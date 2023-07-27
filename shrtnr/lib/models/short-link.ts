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

export type ShortLinkDataWithoutViews = Omit<ShortLinkData, 'views'>

export type PartialShortLink = Omit<ShortLink, 'short' | 'long' | 'views'> & {
    short?: URL | string | null
    long: URL | string
    text?: string
    views?: LinkStats
}
