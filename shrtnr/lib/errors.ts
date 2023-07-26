import { LongUrlUrn, ShortUrlUrn, TimeseriesUrn } from '@/lib/urns'
import { ShortLinkData } from '@lib/models/short-link'

export class ShortLinkValidationError extends Error {
}
export class LinkTooLongError extends ShortLinkValidationError {
    constructor(link: string, maxLength: number) {
        super(`Link "${link}" is too long. Maximum length is ${maxLength} characters.`)
    }
}
export class LinkTooShortError extends ShortLinkValidationError {
    constructor(link: string, minLength: number) {
        super(`Link "${link}" is too short. Mininum length is ${minLength} characters.`)
    }
}
export class ShortLinkNotValidURL extends ShortLinkValidationError {
    constructor(link: string) {
        super(`Link "${link}" is not a valid URL.`)
    }
}
export class ShortLinkAlreadyExists extends Error implements ShortLinkData {

    constructor(long: LongUrlUrn, link: ShortLinkData) {
        super(`Short link for "${long}" already exists`)
        this.short = link.short
        this.long = link.long
        this.views = link.views
    }
}
export class LongUrlNotFoundError extends Error {
    constructor(urn: LongUrlUrn) {
        super(`"${urn}" not found`)
    }
}
export class ShortUrlNotFoundError extends Error {
    constructor(urn: ShortUrlUrn) {
        super(`"${urn}" not found`)
    }
}
export class SearchQueryTooShort extends Error {
    constructor(length: number) {
        super(`Search terms require at least ${length} characters`)
    }
}
export class TimeseriesNotFoundError extends Error {
    constructor(urn: TimeseriesUrn) {
        super(`Timeseries for "${urn}" not found`)
    }
}