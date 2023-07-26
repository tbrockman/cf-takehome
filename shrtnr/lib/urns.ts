class Urn {
    namespace: string
    type: string
    resource: string

    constructor(type: string, resource: string) {
        this.namespace = 'urn:shrtnr'
        this.type = type
        this.resource = resource
    }

    toString() {
        return this.namespace + ':' + this.type + ':' + this.resource
    }

    getPrefix() {
        return this.namespace + ':' + this.type
    }

    getType() {
        return this.type
    }

    getResource() {
        return this.resource
    }
}

/**
 * A ShortUrl URN is the URN for a short link. In Redis, it is a key identifying a long URL value.
 * This allows us to quickly look up the long URL for a given short link.
 */
class ShortUrlUrn extends Urn {
    constructor(resource: string) {
        super('short_url', resource)
    }
}

/**
 * A LongUrl URN is the URN for a regular URL. In Redis, it is a key identifying a short link.
 * This allows us to quickly look up if a given URL already has a short link, and return that link.
 */
class LongUrlUrn extends Urn {
    constructor(resource: string) {
        super('long_url', resource)
    }
}

/**
 * A Counter URN is the URN for a counter. In Redis, it is a key identifying a counter value.
 * This allows us to increment (and return the value of) a distributed counter.
 * This is used to retrieve a unique integer that we then encode (in human-readable base58) as a short link.
 */
class CounterUrn extends Urn {
    constructor(resource: string) {
        super('counter', resource)
    }
}

/**
 * A Tracker URN is the URN for a tracker. In Redis, it is a key identifying a time series.
 * This allows us to track the number of times a short link is accessed.
 */
class TrackerUrn extends Urn {
    constructor(resource: string) {
        super('tracker', resource)
    }
}

class SearchUrn extends Urn {
    constructor(resource: string) {
        super('search', resource)
    }
}

export {
    Urn,
    ShortUrlUrn,
    LongUrlUrn,
    CounterUrn,
    TrackerUrn,
    SearchUrn
}
