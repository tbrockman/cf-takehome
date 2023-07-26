import Redis from 'ioredis'

const host = process.env.REDIS_HOST ?? 'localhost'
const redis = new Redis(host)

export {
    redis
}