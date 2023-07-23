import { Analytics, Timeseries } from "@/lib/analytics"
import { LinkShortener } from "@/lib/link-shortener"
import { ShortUrlNotFoundError } from '../errors'
import { Ok, Result } from "ts-results-es"
import { LongUrlUrn, ShortUrlUrn } from "@/lib/urns"

export type LinkInfo = { timeseries: Timeseries<number>, url: string }

class LinksHandler {

    analytics: Analytics
    shortener: LinkShortener

    constructor(analytics: Analytics, shortener: LinkShortener) {
        this.analytics = analytics
        this.shortener = shortener
    }

    async post(url: string, ttl?: number): Promise<Result<ShortUrlUrn, Error>> {
        const longUrlUrn = new LongUrlUrn(url)
        const shortLinkResult = await this.shortener.createShortLink(longUrlUrn, ttl)

        if (shortLinkResult.err) {
            return shortLinkResult
        }
        const analyticsResult = await this.analytics.create(shortLinkResult.val, ttl)

        if (analyticsResult.err) {
            return analyticsResult
        }
        return shortLinkResult
    }

    async get(shortUrlUrn: ShortUrlUrn, start: number, end: number): Promise<Result<LinkInfo, Error | ShortUrlNotFoundError>> {
        // Retrieve analytics for a short link from Redis
        const queryResult = await this.analytics.query(shortUrlUrn, start, end)
        
        if (queryResult.err) {
            return queryResult
        }
        const longUrlResult = await this.shortener.getLongUrl(shortUrlUrn)

        if (longUrlResult.err) {
            return longUrlResult
        }
        return Ok({ timeseries: queryResult.val, url: longUrlResult.val.getResource() })
    }

    async delete(shortUrlUrn: ShortUrlUrn): Promise<Result<void, Error | ShortUrlNotFoundError>> {
        const shortenerResult = await this.shortener.delete(shortUrlUrn)
        
        if (shortenerResult.err) {
            return shortenerResult
        }
        return await this.analytics.delete(shortUrlUrn)
    }
}

export {
    LinksHandler
}