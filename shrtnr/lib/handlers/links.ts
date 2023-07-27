import { Analytics, Timeseries } from "@/lib/analytics"
import { Shortener } from "@/lib/shortener"
import { ShortLinkAlreadyExists, ShortUrlNotFoundError } from '../errors'
import { Err, Ok, Result } from "ts-results-es"
import { ShortUrlUrn } from "@/lib/urns"
import { ShortLinkData } from "@/lib/models/short-link"

const ONE_DAY = 24 * 60 * 60 * 1000
const ONE_WEEK = 7 * ONE_DAY

class LinksHandler {

    analytics: Analytics
    shortener: Shortener

    constructor(analytics: Analytics, shortener: Shortener) {
        this.analytics = analytics
        this.shortener = shortener
    }

    async post(url: string, ttl?: number): Promise<Result<ShortLinkData, Error>> {
        const shortLinkResult = await this.shortener.createShortLink(url, ttl)

        if (shortLinkResult.err && !(shortLinkResult.val instanceof ShortLinkAlreadyExists)) {
            return shortLinkResult
        }

        if (!shortLinkResult.err) {
            const urn = new ShortUrlUrn(shortLinkResult.val.short.toString())
            const analyticsResult = await this.analytics.create(urn, ttl)

            if (analyticsResult.err) {
                return analyticsResult
            }
        }
        return Ok(shortLinkResult.val as ShortLinkData)
    }

    async get(shortUrlUrn: ShortUrlUrn): Promise<Result<ShortLinkData, Error | ShortUrlNotFoundError>> {
        // Retrieve analytics for a short link from Redis
        const now = new Date().getTime()
        const dayAgo = now - ONE_DAY
        const weekAgo = now - ONE_WEEK

        // TODO: pipeline these queries
        const promises = [
            this.analytics.sum(shortUrlUrn, dayAgo, now),
            this.analytics.sum(shortUrlUrn, weekAgo, now),
            this.analytics.sum(shortUrlUrn, 0, now)
        ]
        const results = await Promise.all(promises)
        const errors: Err<Error>[] = results.filter(r => r.err) as Err<Error>[]

        if (errors.length > 0) {
            return errors[0]
        }
        const [today, week, all] = results.map(r => r.val) as number[]

        const longUrlResult = await this.shortener.getLongUrlFromShort(shortUrlUrn)

        if (longUrlResult.err) {
            return longUrlResult
        }
        const result = { views: { today, week, all }, long: longUrlResult.val.getResource(), short: shortUrlUrn.getResource() }
        return Ok(result)
    }

    async delete(shortUrlUrn: ShortUrlUrn): Promise<Result<void, Error | ShortUrlNotFoundError>> {
        const shortenerResult = await this.shortener.delete(shortUrlUrn)

        if (shortenerResult.err) {
            return shortenerResult
        }
        return await this.analytics.delete(shortUrlUrn)
    }

    async search(query: string) {
        return this.shortener.search(query)
    }
}

export {
    LinksHandler
}