import { Redis } from 'ioredis'
import { Err, Ok, Result } from 'ts-results-es'
import { LongUrlNotFoundError, ShortLinkAlreadyExists, ShortUrlNotFoundError } from './errors'
import { CounterUrn, LongUrlUrn, ShortUrlUrn } from './urns'
import { toBase58, wrapResultAsync } from './util'

const SHORT_LINK_COUNTER_NAME = 'short_urls'
const SHORT_LINK_COUNTER_URN = new CounterUrn(SHORT_LINK_COUNTER_NAME)

class Shortener {

    redis: Redis

    constructor(redis: Redis) {
        this.redis = redis
    }

    async createShortLink(longUrlUrn: LongUrlUrn, ttl?: number): Promise<Result<ShortUrlUrn, Error | ShortLinkAlreadyExists>> {
        // TODO: do basic check to make sure that short links are actually valid URLs 
        // TODO: prevent short links from linking to themselves (which is pretty easy since our URLs are predictable)
        // TODO: don't allow empty short links
        // TODO: don't allow non-link short links

        // Verify we don't already have a short link for this URL
        const shortLinkResult = await this.getShortLink(longUrlUrn)

        if (shortLinkResult.ok) {
            return Err(new ShortLinkAlreadyExists(longUrlUrn, shortLinkResult.val.getResource()))
        }
        const shortUrlUrn = await this._generateShortLink(longUrlUrn, ttl)
        return Ok(shortUrlUrn)
    }

    async generateShortLink(longUrlUrn: LongUrlUrn, ttl?: number): Promise<Result<ShortUrlUrn, Error>> {
        return wrapResultAsync(async () => {
            return await this._generateShortLink(longUrlUrn, ttl)
        })
    }

    private async _generateShortLink(longUrlUrn: LongUrlUrn, ttl?: number): Promise<ShortUrlUrn> {
        // Increment and return value of Redis short link counter
        const id = await this.redis.incr(SHORT_LINK_COUNTER_URN.toString())

        // Convert counter value to base58
        const link = toBase58(id)

        // Store the short and long links in Redis
        const shortUrlUrn = new ShortUrlUrn(link)

        if (ttl) {
            await this.redis.hset(longUrlUrn.toString(), 'short', link, 'EX', ttl)
            await this.redis.hset(shortUrlUrn.toString(), 'long', longUrlUrn.getResource(), 'EX', ttl)
        }
        else {
            await this.redis.hset(longUrlUrn.toString(), 'short', link)
            await this.redis.hset(shortUrlUrn.toString(), 'long', longUrlUrn.getResource())
        }
        // Return short link
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

    async getLongUrl(shortUrlUrn: ShortUrlUrn): Promise<Result<LongUrlUrn, Error | ShortUrlNotFoundError>> {
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
        const url = await this.redis.get(shortUrlUrn.toString())

        if (!url) {
            throw new ShortUrlNotFoundError(shortUrlUrn)
        }
        const urlUrn = new LongUrlUrn(url)
        await this.redis.hdel(shortUrlUrn.toString())
        await this.redis.hdel(urlUrn.toString())
    }
}

export {
    ShortLinkAlreadyExists, Shortener
}
