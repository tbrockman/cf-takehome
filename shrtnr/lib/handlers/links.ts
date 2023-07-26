import { URLWithoutProtocol } from '@/lib/urls'
import { Analytics, Timeseries } from "@/lib/analytics"
import { Shortener } from "@/lib/shortener"
import { ShortLinkAlreadyExists, ShortUrlNotFoundError } from '../errors'
import { Ok, Result } from "ts-results-es"
import { LongUrlUrn, ShortUrlUrn } from "@/lib/urns"
import { CreatedLinkURNs, PartialShortLink, ShortLink } from "@/lib/models/short-link"

export type LinkInfo = { timeseries: Timeseries<number>, url: string }

class LinksHandler {

    analytics: Analytics
    shortener: Shortener

    constructor(analytics: Analytics, shortener: Shortener) {
        this.analytics = analytics
        this.shortener = shortener
    }

    async post(url: string, ttl?: number): Promise<Result<PartialShortLink, Error>> {
        const shortLinkResult = await this.shortener.createShortLink(url, ttl)

        if (shortLinkResult.err && !(shortLinkResult.val instanceof ShortLinkAlreadyExists)) {
            return shortLinkResult
        }

        if (!shortLinkResult.err) {
            const analyticsResult = await this.analytics.create(shortLinkResult.val.short, ttl)

            if (analyticsResult.err) {
                return analyticsResult
            }
        }

        return Ok({
            short: shortLinkResult.val.short.getResource(),
            long: shortLinkResult.val.long.getResource(),
            views: {
                today: 0,
                week: 0,
                all: 0
            }
        })
    }

    async get(shortUrlUrn: ShortUrlUrn, start: number, end: number): Promise<Result<LinkInfo, Error | ShortUrlNotFoundError>> {
        // Retrieve analytics for a short link from Redis
        const queryResult = await this.analytics.query(shortUrlUrn, start, end)

        if (queryResult.err) {
            return queryResult
        }
        const longUrlResult = await this.shortener.getLongUrlFromShort(shortUrlUrn)

        if (longUrlResult.err) {
            return longUrlResult
        }
        //TODO: fix this
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