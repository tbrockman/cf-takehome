import { Redis } from 'ioredis';
import { CounterUrn, ShortUrlUrn, LongUrlUrn } from './urns';
import { toBase58, wrapResultAsync } from './util';
import { Err, Ok, Result } from 'ts-results-es';
import { ShortLinkAlreadyExists as ShortLinkAlreadyExists, LongUrlNotFoundError, ShortUrlNotFoundError } from './errors';

const SHORT_LINK_COUNTER_NAME = 'short_urls'
const SHORT_LINK_COUNTER_URN = new CounterUrn(SHORT_LINK_COUNTER_NAME);

class LinkShortener {

    redis: Redis;

    constructor(redis: Redis) {
        this.redis = redis;
    }

    async createShortLink(longUrlUrn: LongUrlUrn, ttl?: number): Promise<Result<ShortUrlUrn, Error | ShortLinkAlreadyExists>> {
        // Verify we don't already have a short link for this URL
        const shortLinkResult = await this.getShortLink(longUrlUrn);

        if (shortLinkResult.ok) {
            return Err(new ShortLinkAlreadyExists(longUrlUrn, shortLinkResult.val.getResource()))
        }
        const shortUrlUrn = await this._generateShortLink(longUrlUrn, ttl);
        return Ok(shortUrlUrn)
    }

    async generateShortLink(longUrlUrn: LongUrlUrn, ttl?: number): Promise<Result<ShortUrlUrn, Error>> {
        return wrapResultAsync(async () => {
            return await this._generateShortLink(longUrlUrn, ttl);
        })
    }

    private async _generateShortLink(longUrlUrn: LongUrlUrn, ttl?: number): Promise<ShortUrlUrn> {
        // Increment and return value of Redis short link counter
        const id = await this.redis.incr(SHORT_LINK_COUNTER_URN.toString());

        // Convert counter value to base58
        const link = toBase58(id);

        // Store the short and long links in Redis
        const shortUrlUrn = new ShortUrlUrn(link);

        // TODO: prevent short links from linking to themselves (which is pretty easy since our URLs are predictable)
        // TODO: don't allow empty short links
        // TODO: don't allow non-link short links

        if (ttl) {
            await this.redis.set(longUrlUrn.toString(), link, 'EX', ttl);
            await this.redis.set(shortUrlUrn.toString(), longUrlUrn.getResource(), 'EX', ttl);
        }
        else {
            await this.redis.set(longUrlUrn.toString(), link);
            await this.redis.set(shortUrlUrn.toString(), longUrlUrn.getResource());
        }
        // Return short link
        return shortUrlUrn;
    }

    async getShortLink(longUrlUrn: LongUrlUrn): Promise<Result<ShortUrlUrn, Error | LongUrlNotFoundError>> {
        return wrapResultAsync(async () => {
            return await this._getShortLink(longUrlUrn)
        })
    }

    private async _getShortLink(longUrlUrn: LongUrlUrn) {
        const short = await this.redis.get(longUrlUrn.toString())

        if (!short) {
            throw new LongUrlNotFoundError(longUrlUrn)
        }
        return new ShortUrlUrn(short);
    }

    async getLongUrl(shortUrlUrn: ShortUrlUrn): Promise<Result<LongUrlUrn, Error | ShortUrlNotFoundError>> {
        return wrapResultAsync(async () => {
            return await this._getLongUrl(shortUrlUrn);
        })
    }

    private async _getLongUrl(shortUrlUrn: ShortUrlUrn) {
        const long = await this.redis.get(shortUrlUrn.toString());

        if (!long) {
            throw new ShortUrlNotFoundError(shortUrlUrn)
        }
        return new LongUrlUrn(long);
    }

    async delete(shortUrlUrn: ShortUrlUrn): Promise<Result<void, Error | ShortUrlNotFoundError>> {
        return wrapResultAsync(async () => {
            return await this._delete(shortUrlUrn);
        })
    }

    private async _delete(shortUrlUrn: ShortUrlUrn): Promise<void> {
        const url = await this.redis.get(shortUrlUrn.toString());
    
        if (!url) {
            throw new ShortUrlNotFoundError(shortUrlUrn)
        }
        const urlUrn = new LongUrlUrn(url);
        await this.redis.del(shortUrlUrn.toString());
        await this.redis.del(urlUrn.toString());
    }
}

export {
    LinkShortener,
    ShortLinkAlreadyExists
}