import { URLWithoutProtocol } from "@/lib/urls"
import { LongUrlUrn, ShortUrlUrn } from "@/lib/urns"

export type ShortLink = {
    short: URLWithoutProtocol
    long: URLWithoutProtocol
    views: {
        today: number
        week: number
        all: number
    }
}

export type PartialShortLink = Omit<Omit<ShortLink, 'short'>, 'long'> & {
    short?: URL | string | null
    long: URL | string
    text?: string
}

export type CreatedLinkURNs = {
    short: ShortUrlUrn,
    long: LongUrlUrn
}