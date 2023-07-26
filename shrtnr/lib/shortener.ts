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
import { ShortLink, ShortLinkData } from "@/lib/models/short-link"
import { basicURLParse, serializeURL } from 'whatwg-url'

const SHORT_LINK_NAME = 'short_urls'
const SHORT_LINK_COUNTER_URN = new CounterUrn(SHORT_LINK_NAME)
const SHORT_LINK_SEARCH_URN = new SearchUrn(SHORT_LINK_NAME)
const SHORT_LINK_MAX_LENGTH = 2048
const SHORT_LINK_MIN_LENGTH = 3


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
        const shortLinkResult = await this.getShortLink(longUrlUrn)

        if (shortLinkResult.ok) {
            const link = {
                short: shortLinkResult.val.getResource(),
                long: longUrlUrn.getResource(),
                views: {
                    today: 0,
                    week: 0,
                    all: 0
                }
            }
            return Err(new ShortLinkAlreadyExists(longUrlUrn, link))
        }
        const shortUrlUrn = await this._generateShortLink(longUrlUrn, ttl)

        return Ok({
            short: shortUrlUrn,
            long: longUrlUrn
        })
    }

    private _parseLink(url: string): Result<URL, ShortLinkValidationError> {

        if (url.length > SHORT_LINK_MAX_LENGTH) {
            return Err(new LinkTooLongError(url, SHORT_LINK_MAX_LENGTH))
        }
        else if (url.length < SHORT_LINK_MIN_LENGTH) {
            return Err(new LinkTooShortError(url, SHORT_LINK_MIN_LENGTH))
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

        // Parse the protocol from the long URL
        // If not present, assume HTTPS
        // const url = longUrlUrn.url
        // url.protocol = url.protocol || 'https:'

        // TODO: remove writing to the short URL URN as we'll use a search index
        // Which we can already use as a reverse lookup for long URL -> short

        // // TODO: prevent short links from linking to themselves (which is pretty easy since our URLs are predictable)
        // // or maybe do allow this because it'd be kind of funny
        // await this.redis.call('FT.SUGADD', SHORT_LINK_SEARCH_URN.toString(), longUrlUrn.toString(), 1, 'PAYLOAD', shortUrlUrn.toString())

        if (ttl) {
            await this.redis.hset(longUrlUrn.toString(), 'short', link, 'EX', ttl)
            await this.redis.hset(shortUrlUrn.toString(), 'long', longUrl.toString(), 'protocol', longUrl.protocol, 'EX', ttl)
            await this.redis.expire(SHORT_LINK_SEARCH_URN.toString(), ttl)
        }
        else {
            await this.redis.hset(longUrlUrn.toString(), 'short', link)
            await this.redis.hset(shortUrlUrn.toString(), 'long', longUrl.toString(), 'protocol', longUrl.protocol,)
        }
        // Return short linkw
        return shortUrlUrn
    }

    async getShortLink(longUrlUrn: LongUrlUrn): Promise<Result<ShortUrlUrn, Error | LongUrlNotFoundError>> {
        return tryResultAsync(async () => {
            return await this._getShortLink(longUrlUrn)
        })
    }

    private async _getShortLink(longUrlUrn: LongUrlUrn) {
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
            await this.redis.del(shortUrlUrn.toString())
            await this.redis.del(result.val.toString())
        })
    }

    async search(query: string): Promise<Result<any, Error | SearchQueryTooShort>> {


        return await Ok(null)
    }
}

export {
    ShortLinkAlreadyExists, Shortener
}
