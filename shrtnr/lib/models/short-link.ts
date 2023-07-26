import { LongUrlUrn, ShortUrlUrn } from "@/lib/urns"

type LinkStats = {
    today: number
    week: number
    all: number
}

export type ShortLink = {
    short: URL
    long: URL
    views: LinkStats
}

export type ShortLinkData = {
    short: string
    long: string
    views: LinkStats
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