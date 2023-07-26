import { ShortUrlUrn } from '@/lib/urns'
import { LongUrlUrn, ShortUrlUrn } from "./urns"

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
export class ShortLinkAlreadyExists extends Error {
    short: ShortUrlUrn
    long: LongUrlUrn

    constructor(long: LongUrlUrn, short: ShortUrlUrn) {
        super(`Short link for "${long}" already exists`)
        this.short = short
        this.long = long
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