import { LongUrlUrn, ShortUrlUrn } from "./urns"

export class ShortLinkValidationError extends Error {
}
export class LinkTooLongError extends ShortLinkValidationError {
    constructor(link: string, maxLength: number) {
        super(`Short link "${link}" is too long. Maximum length is ${maxLength} characters.`)
    }
}
export class LinkTooShortError extends ShortLinkValidationError {
    constructor(link: string, minLength: number) {
        super(`Short link "${link}" is too short. Mininum length is ${minLength} characters.`)
    }
}
export class ShortLinkNotValidURL extends ShortLinkValidationError {
    constructor(link: string) {
        super(`Short link "${link}" is not a valid URL.`)
    }
}
export class ShortLinkAlreadyExists extends Error {
    link: string

    constructor(urn: LongUrlUrn, link: string) {
        super(`Short link for "${urn}" already exists`)
        this.link = link
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