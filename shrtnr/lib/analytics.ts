import { wrapResultAsync } from '@/lib/util'
import { Redis } from "ioredis"
import { TrackerUrn, Urn } from "./urns"
import { Result } from 'ts-results-es'

export type Timeseries<T> = [number, T][]

class Analytics {

    redis: Redis

    constructor(redis: Redis) {
        this.redis = redis
    }

    async create(resource: Urn, ttl?: number) {
        return wrapResultAsync(async () => {
            return await this._create(resource, ttl)
        })
    }

    async _create(resource: Urn, ttl?: number) {
        const urn = new TrackerUrn(resource.toString())
        await this.redis.call('TS.CREATE', urn.toString())

        if (ttl) {
            await this.redis.expire(urn.toString(), ttl)
        }
    }

    async track(resource: Urn): Promise<Result<void, Error>> {
        return wrapResultAsync(async () => {
            return await this._track(resource)
        })
    }

    private async _track(resource: Urn): Promise<void> {
        const urn = new TrackerUrn(resource.toString())
        const time = new Date().getTime()
        await this.redis.call('TS.ADD', urn.toString(), time, 1, 'ON_DUPLICATE', 'SUM')
    }

    async query(resource: Urn, start: number, end: number): Promise<Result<Timeseries<number>, Error>> {
        return wrapResultAsync(async () => {
            return await this._query(resource, start, end)
        })
    }

    private async _query(resource: Urn, start: number, end: number): Promise<Timeseries<number>> {
        const urn = new TrackerUrn(resource.toString())
        let raw = await this.redis.call('TS.RANGE', urn.toString(), start, end) as Timeseries<string>
        return raw.map(([time, count]) => [time, Number.parseInt(count)])
    }

    async delete(resource: Urn): Promise<Result<void, Error>> {
        return wrapResultAsync(async () => {
            return await this._delete(resource)
        })
    }

    private async _delete(resource: Urn) {
        const urn = new TrackerUrn(resource.toString())
        await this.redis.call('DEL', urn.toString())
    }
}

export {
    Analytics
}