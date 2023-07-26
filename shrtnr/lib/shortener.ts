import { URLWithoutProtocol } from '@/lib/urls'
import { Redis } from 'ioredis'
import { Err, Ok, Result } from 'ts-results-es'
import {
    LongUrlNotFoundError, ShortLinkAlreadyExists, ShortLinkNotValidURL,
    LinkTooLongError, LinkTooShortError, ShortLinkValidationError,
    ShortUrlNotFoundError, SearchQueryTooShort
} from '@/lib/errors'
import { CounterUrn, LongUrlUrn, SearchUrn, ShortUrlUrn } from '@/lib/urns'
import { toBase58, wrapResultAsync } from '@/lib/util'
import { CreatedLinkURNs } from "@/lib/models/short-link"
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

    async createShortLink(url: string, ttl?: number): Promise<Result<CreatedLinkURNs, Error | ShortLinkAlreadyExists | ShortLinkValidationError>> {
        const parseResult = this._parseLink(url)
        const longUrlUrn = new LongUrlUrn(parseResult.val.toString())

        if (parseResult.err) {
            return parseResult
        }
        // Verify we don't already have a short link for this URL
        const shortLinkResult = await this.getShortLink(longUrlUrn)

        if (shortLinkResult.ok) {
            return Err(new ShortLinkAlreadyExists(longUrlUrn, shortLinkResult.val))
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
        return wrapResultAsync(async () => {
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
        return wrapResultAsync(async () => {
            return await this._getLongUrl(shortUrlUrn)
        })
    }

    private async _getLongUrl(shortUrlUrn: ShortUrlUrn) {
        const long = await this.redis.hget(shortUrlUrn.toString(), 'long')

        if (!long) {
            throw new ShortUrlNotFoundError(shortUrlUrn)
        }
        return new LongUrlUrn(long)
    }

    async delete(shortUrlUrn: ShortUrlUrn): Promise<Result<void, Error | ShortUrlNotFoundError>> {
        return wrapResultAsync(async () => {
            return await this._delete(shortUrlUrn)
        })
    }

    private async _delete(shortUrlUrn: ShortUrlUrn): Promise<void> {
        const url = await this.redis.hget(shortUrlUrn.toString(), 'long')

        if (!url) {
            throw new ShortUrlNotFoundError(shortUrlUrn)
        }
        const urlUrn = new LongUrlUrn(url)
        await this.redis.del(shortUrlUrn.toString())
        await this.redis.del(urlUrn.toString())
    }

    async search(query: string): Promise<Result<any, Error | SearchQueryTooShort>> {


        return await Ok(null)
    }
}

export {
    ShortLinkAlreadyExists, Shortener
}
