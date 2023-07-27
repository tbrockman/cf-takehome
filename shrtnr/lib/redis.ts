import Redis from 'ioredis'

const host = process.env.REDIS_HOST ?? 'localhost'
const redis = new Redis(host)

function escapePunctuation(str: string): string {
    return str.replace(/[\s\t,\/\(\)\{\}\[\]:;\\~!@#\$%\^&\*\-=\+\|'`"<>?_\x00\.]/g, function (match) {
        return '\\' + match
    })
}

export {
    redis,
    escapePunctuation
}