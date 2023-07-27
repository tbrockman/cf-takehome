import { URLWithoutProtocol } from '@/lib/urls'
import { Redis } from 'ioredis'
import { Err, Ok, Result } from 'ts-results-es'
import {
    LongUrlNotFoundError, ShortLinkAlreadyExists, ShortLinkNotValidURL,
    LinkTooLongError, LinkTooShortError, ShortLinkValidationError,
    ShortUrlNotFoundError, SearchQueryTooShort
} from '@/lib/errors'
import { CounterUrn, LongUrlUrn, SearchUrn, ShortUrlUrn } from '@/lib/urns'
import { toBase58, tryResultAsync } from '@/lib/util'
import { ShortLinkData, ShortLinkDataWithoutViews } from "@/lib/models/short-link"
import { basicURLParse, serializeURL } from 'whatwg-url'
import { escapePunctuation } from './redis'

const SHORT_LINK_NAME = 'short_urls'
const SHORT_LINK_COUNTER_URN = new CounterUrn(SHORT_LINK_NAME)
const SHORT_LINK_SEARCH_URN = new SearchUrn(SHORT_LINK_NAME)
const SHORT_LINK_MAX_LENGTH = 2048
const SHORT_LINK_MIN_LENGTH = 3
const SEARCH_MIN_LENGTH = 2
const PROTOCOL_REGEX = /^[^:\s]*:\/\//i

class Shortener {

    redis: Redis

    constructor(redis: Redis) {
        this.redis = redis
    }

    async createShortLink(url: string, ttl?: number): Promise<Result<ShortLinkData, Error | ShortLinkAlreadyExists | ShortLinkValidationError>> {
        const parseResult = this._parseLink(url)
        const longUrlUrn = new LongUrlUrn(parseResult.val.toString())

        if (parseResult.err) {
            return parseResult
        }
        // Verify we don't already have a short link for this URL
        const shortLinkResult = await this.getShortUrlUrn(longUrlUrn)
        const views = {
            today: 0,
            week: 0,
            all: 0
        }

        if (shortLinkResult.ok) {
            const link = {
                short: shortLinkResult.val.getResource(),
                long: longUrlUrn.getResource(),
                views
            }
            return Err(new ShortLinkAlreadyExists(longUrlUrn, link))
        }
        const shortUrlUrn = await this._generateShortLink(longUrlUrn, ttl)

        return Ok({
            short: shortUrlUrn.getResource(),
            long: longUrlUrn.getResource(),
            views
        })
    }

    private _parseLink(url: string): Result<URL, ShortLinkValidationError> {

        if (url.length > SHORT_LINK_MAX_LENGTH) {
            return Err(new LinkTooLongError(url, SHORT_LINK_MAX_LENGTH))
        }
        else if (url.length < SHORT_LINK_MIN_LENGTH) {
            return Err(new LinkTooShortError(url, SHORT_LINK_MIN_LENGTH))
        }
        // if domain is empty, we've only been given a protocol
        if (url.replace(PROTOCOL_REGEX, '') == '') {
            return Err(new ShortLinkNotValidURL(url))
        }
        let result = basicURLParse(url) ?? basicURLParse(`https://${url}`)

        if (!result) {
            return Err(new ShortLinkNotValidURL(url))
        }
        const serialized = serializeURL(result)

        if (!serialized) {
            return Err(new ShortLinkNotValidURL(url))
        }
        return Ok(new URL(serialized))
    }

    private async _generateShortLink(longUrlUrn: LongUrlUrn, ttl?: number): Promise<ShortUrlUrn> {
        // Increment and return value of Redis short link counter
        const id = await this.redis.incr(SHORT_LINK_COUNTER_URN.toString())

        // Convert counter value to base58
        const link = toBase58(id)

        // Store the short and long links in Redis
        const shortUrlUrn = new ShortUrlUrn(link)
        const longUrl = new URLWithoutProtocol(longUrlUrn.getResource())

        // TODO: remove writing to the short URL URN as we'll use a search index
        // Which we can already use as a reverse lookup for long URL -> short

        // // TODO: prevent short links from linking to themselves (which is pretty easy since our URLs are predictable)
        // // or maybe do allow this because it'd be kind of funny

        if (ttl) {
            await this.redis.multi()
                .hset(longUrlUrn.toString(), 'short', link, 'EX', ttl)
                .hset(shortUrlUrn.toString(), 'long', longUrl.toString(), 'protocol', longUrl.protocol, 'EX', ttl)
                .expire(SHORT_LINK_SEARCH_URN.toString(), ttl)
                .exec()
        }
        else {
            await this.redis.multi()
                .hset(longUrlUrn.toString(), 'short', link)
                .hset(shortUrlUrn.toString(), 'long', longUrl.toString(), 'protocol', longUrl.protocol)
                .exec()
        }
        return shortUrlUrn
    }

    async getShortUrlUrn(longUrlUrn: LongUrlUrn): Promise<Result<ShortUrlUrn, Error | LongUrlNotFoundError>> {
        return tryResultAsync(async () => {
            return await this._getShortUrlUrn(longUrlUrn)
        })
    }

    private async _getShortUrlUrn(longUrlUrn: LongUrlUrn) {
        const short = await this.redis.hget(longUrlUrn.toString(), 'short')

        if (!short) {
            throw new LongUrlNotFoundError(longUrlUrn)
        }
        return new ShortUrlUrn(short)
    }

    async getLongUrlFromShort(shortUrlUrn: ShortUrlUrn): Promise<Result<LongUrlUrn, Error | ShortUrlNotFoundError>> {
        const result: Result<(string | null)[], Error> = await tryResultAsync(() => { return this.redis.hmget(shortUrlUrn.toString(), 'protocol', 'long') })

        if (result.err) {
            return result
        }
        const [protocol, url] = result.val

        if (!protocol || !url) {
            return Err(new ShortUrlNotFoundError(shortUrlUrn))
        }
        return Ok(new LongUrlUrn(protocol + '//' + url))
    }

    async delete(shortUrlUrn: ShortUrlUrn): Promise<Result<void, Error | ShortUrlNotFoundError>> {
        const result = await this.getLongUrlFromShort(shortUrlUrn)

        if (result.err) {
            return result
        }

        return await tryResultAsync(async () => {
            await this.redis.multi()
                .del(shortUrlUrn.toString())
                .del(result.val.toString())
                .exec()
        })
    }

    async search(query: string): Promise<Result<ShortLinkDataWithoutViews[], Error | SearchQueryTooShort>> {
        if (query.length < SEARCH_MIN_LENGTH) {
            return Err(new SearchQueryTooShort(SEARCH_MIN_LENGTH))
        }
        // Remove first instance of protocol from query, 
        // if anyone enters more than that... they're on their own.
        const protocol = query.match(PROTOCOL_REGEX)
        let sanitized = query.replace(PROTOCOL_REGEX, '')
        let components: string[] = []

        if (protocol) {
            components.push(`@protocol:{ ${escapePunctuation(protocol[0].replace('//', ''))} }`)
        }
        sanitized = escapePunctuation(sanitized)

        if (sanitized.length > 0) {
            components.push(`@long:{ ${sanitized}* }`)
        }
        const result = await tryResultAsync<[number, ...any]>(async () => {
            return await this.redis.call('FT.SEARCH', SHORT_LINK_SEARCH_URN.toString(), components.join(' ')) as [number, ...any]
        })

        if (result.err) {
            return result
        }
        const [count, ...results] = result.val
        const links: ShortLinkDataWithoutViews[] = []

        for (let i = 0; i < results.length; i += 2) {
            const short = results[i].split(':').pop()
            const [, long, , protocol] = results[i + 1]
            const link: ShortLinkDataWithoutViews = {
                short: short,
                long: protocol + '//' + long
            }
            links.push(link)
        }
        return Ok(links)
    }
}

export {
    ShortLinkAlreadyExists, Shortener
}
