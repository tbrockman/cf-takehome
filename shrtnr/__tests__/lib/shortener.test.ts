import { LinkTooLongError, LinkTooShortError, LongUrlNotFoundError, ShortLinkAlreadyExists, ShortLinkNotValidURL, ShortUrlNotFoundError } from "@/lib/errors"
import { ShortLinkData } from "@/lib/models/short-link"
import { Shortener } from "@/lib/shortener"
import { LongUrlUrn, ShortUrlUrn } from "@/lib/urns"
import Redis from "ioredis"
jest.mock('ioredis')

describe('Shortener', () => {

    let redis: jest.MockedObjectDeep<Redis>
    let shortener: Shortener

    beforeEach(() => {
        redis = jest.mocked(new Redis())
        shortener = new Shortener(redis)
        redis.multi.mockReturnValue(redis)
        redis.del.mockReturnValue(redis)
        redis.hset.mockReturnValue(redis)
        redis.exec.mockResolvedValue(null)
    })

    describe('createShortLink', () => {
        it('Returns an error if given a link that is too short', async () => {
            const result = await shortener.createShortLink('a')
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(LinkTooShortError)
        })
        it('Returns an error if given a link that is too long', async () => {
            const result = await shortener.createShortLink('https://' + 'a'.repeat(2048) + '.com')
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(LinkTooLongError)
        })
        it('Assumes protocol is HTTPS if given an otherwise valid URL', async () => {
            redis.incr.mockResolvedValue(1)
            redis.hget.mockResolvedValue(null)
            const result = await shortener.createShortLink('noschemelol.com')
            expect(result.err).toEqual(false)
            expect((result.val as ShortLinkData).short).toEqual('b')
        })
        it('Returns an error if given a link that already exists', async () => {
            const url = 'https://google.com'
            redis.hget.mockResolvedValue(url)
            const result = await shortener.createShortLink(url)
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortLinkAlreadyExists)
        })
        it('Returns an error if only given a protocol', async () => {
            const url = 'https://'
            const result = await shortener.createShortLink(url)
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortLinkNotValidURL)
        })
        it('Returns an error if given text beside a valid URL', async () => {
            const url = 'rightguys https://test.com'
            const result = await shortener.createShortLink(url)
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortLinkNotValidURL)
        })
        it('Returns a short link regardless of protocol', async () => {
            const url = 'wss://test.com'
            redis.hget.mockResolvedValue(null)
            redis.incr.mockResolvedValue(1)
            const result = await shortener.createShortLink(url)
            expect(result.err).toEqual(false)
            expect((result.val as ShortLinkData).short).toEqual('b')
        })
        it('Returns a short link if given a valid URL', async () => {
            const url = 'https://google.com'
            redis.hget.mockResolvedValue(null)
            redis.incr.mockResolvedValue(1)
            const result = await shortener.createShortLink(url)
            expect(result.err).toEqual(false)
            expect((result.val as ShortLinkData).short).toEqual('b')
        })
    })

    describe('getLongUrlFromShort', () => {
        it('Returns an error attempting to retrieve a long URL from a short link that does not exist', async () => {
            redis.hmget.mockResolvedValue([])
            const result = await shortener.getLongUrlFromShort(new ShortUrlUrn('https://google.com'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortUrlNotFoundError)
        })

        it('Returns a long URL if given a valid short link', async () => {
            const [protocol, url] = ['https:', 'google.com']
            redis.hmget.mockResolvedValue([protocol, url])
            const result = await shortener.getLongUrlFromShort(new ShortUrlUrn(url))
            expect(result.err).toEqual(false)
            expect((result.val as LongUrlUrn).getResource()).toEqual(protocol + '//' + url)
        })
    })

    describe('getShortLink', () => {
        it('Returns an error attempting to retrieve a short link from a long URL that does not exist', async () => {
            redis.hget.mockResolvedValue(null)
            const result = await shortener.getShortUrlUrn(new LongUrlUrn('https://google.com'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(LongUrlNotFoundError)
        })

        it('Returns a short link if given a valid long URL', async () => {
            const url = 'https://google.com'
            redis.hget.mockResolvedValue(url)
            const result = await shortener.getShortUrlUrn(new LongUrlUrn(url))
            expect(result.err).toEqual(false)
            expect((result.val as ShortUrlUrn).getResource()).toEqual(url)
        })
    })

    describe('delete', () => {
        it('Returns an error attempting to delete a short link that does not exist', async () => {
            redis.multi.mockResolvedValue(redis)
            redis.hmget.mockResolvedValue([])
            const result = await shortener.delete(new ShortUrlUrn('https://google.com'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortUrlNotFoundError)
        })

        it('Returns no errors if attempting to delete a short link that exists', async () => {
            const [protocol, url] = ['https:', 'google.com']
            redis.hmget.mockResolvedValue([protocol, url])
            redis.exec.mockResolvedValue(null)
            const result = await shortener.delete(new ShortUrlUrn(protocol + '//' + url))
            expect(result.err).toEqual(false)
        })
    })

    describe('search', () => {
        it('Returns an empty list if no short links found', async () => {
            redis.call.mockResolvedValue([])
            const result = await shortener.search('google')
            expect(result.err).toEqual(false)
            expect(result.val).toEqual([])
        })
        it('Returns an error if the search query is too short', async () => { })
        it('Returns a list of results containing both the short link and long URL', async () => { })
    })
})