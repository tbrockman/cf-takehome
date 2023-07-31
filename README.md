# shrtnr

## Prerequisites

This project requires [`docker`](https://docs.docker.com/get-docker/) (and `docker compose`), [`node.js`](https://nodejs.org/en), and [`yarn`](https://classic.yarnpkg.com/en/docs/install).

## Commands

In the `shrtnr` directory:

```shell
# download dependencies
yarn install 
```

```shell
# runs unit and e2e tests in headless mode
yarn test
```

```shell
# creates an optimized production build
yarn build
```

```shell
# starts a server serving the production build
yarn start
```

```shell
# dev environment with poor performance but hot reloads
yarn dev
```

### Documentation

After starting the application, you can find the Swagger UI by navigating to [localhost:3000/docs](http://localhost:3000/docs) and OpenAPI JSON spec at [localhost:3000/api/doc](http://localhost:3000/api/doc).

There's also a Makefile where you can see some of the orchestration that was supposed to be available (some littered in `package.json` as well), but I ran out of time before digging into observability.

### Project structure 

```shell
shrtnr/
├── __tests__ # Jest unit tests folder (I don't like the naming convention but I'm not breaking it)
│   └── lib
├── app # Next.js API routes and pages (mainly just parsing params and interpreting results)
│   ├── [short] # Endpoint responsible for redirects to long URLs
│   ├── api # Backend routes
│   │   ├── admin 
│   │   │   └── clean # Endpoint to clear all Redis data, only used for testing
│   │   ├── doc # Endpoint which returns JSON OpenAPI spec
│   │   └── links # API endpoints for creating, getting, deleting, and searching links
│   │       ├── [short] # Endpoints for creating, getting, and deleting
│   │       └── search # Endpoint for searching
│   └── docs # Swagger UI
├── components # Frontend React components
├── cypress # Cypress end-to-end testing framework  
│   ├── downloads # Nothing to see here
│   ├── e2e # This folder is where the tests are
│   │   └── spec.cy.ts # End-to-end tests, can be ran headless or interactively
│   ├── fixtures # Just some JSON data for creating test short links in end-to-end tests 
│   ├── screenshots # Nothing to see here
│   └── support # Nothing to see here
├── lib # Some shared code, mainly actual business logic here
│   ├── handlers # Misnomer, there's only a single handler and it's responsible for /links/ API functionality
│   └── models # Not really database models, I just threw some types here
├── scripts # If there were scripts, they would be here
│   └── init # A folder containing the command to create the search index in Redis
└── package.json # Typical package.json, contains entrypoints for working on the project as well as listed dependencies
Makefile # Initially intended to be the entrypoint for most work in the repo, ended up falling mainly to package.json
README.md # This file
```

## Prompt

You've been asked to make an internal service for shortening URLs that anyone in the company can use. You can implement it in any way you see fit, including whatever backend functionality that you think makes sense. Please try to make it both end user and developer friendly. Please include a README with documentation on how to build, and run and test the system. Clearly state all assumptions and design decisions in the README. 

A short URL: 

* Has one long URL 

* This URL shortener should have a well-defined API for URLs created, including analytics of usage.

* No duplicate URLs are allowed to be created.

* Short links can expire at a future time or can live forever.

Your solution must support: 

* Generating a short url from a long url 

*  Redirecting a short url to a long url. 

* List the number of times a short url has been accessed in the last 24 hours, past week, and all time. 

* Data persistence ( must survive computer restarts) 

* Metrics and/or logging: Implement metrics or logging for the purposes of troubleshooting and alerting. This is optional.

* Short links can be deleted

Project Requirements:

* This project should be able to be runnable locally with  some simple instructions

* This project's documentation should include build and deploy instruction

* Tests should be provided and able to be executed locally or within a test environment.

## Assumptions

### Scale
> internal service for shortening URLs that anyone in the company can use

To the untrained eye this *sounds* like it would imply a meager scale, but as anyone who has operated a few internal services knows: *it's only a matter of time before someone uses it in production*.

But we do make the assumption that all links can reasonably fit into memory since we're using Redis as our backend. Even a **worst** case scenario of storing [~a billion links](https://www.forbes.com/advisor/business/software/website-statistics/#:~:text=1.,are%20actively%20maintained%20and%20visited.), an average of [~77 characters per URL](http://www.supermind.org/blog/740/average-length-of-a-url-part-2), and 4 bytes to encode each character using UTF-32 at worst, we'd need in the ballpark of 308 GB of memory to store links once (not considering keys and additional indexes). Let's say between 1-2 TB to be safe. Not something most people are running on their laptops, but pretty feasible ([for example](https://aws.amazon.com/ec2/instance-types/high-memory/)). [With sharding and replication](https://redis.io/docs/management/scaling/), we can scale our storage layer to reach pretty high throughput while storing a good amount of data. I've ignored the fact that we're also storing a time series for tracking link accesses.

Since it's an internal service, some might be tempted to say performance doesn't really matter. Some might believe employees aren't revenue generating like users. The app should still be pretty fast.

### Security

There's no mention of any security requirements here (like that URLs can't be guessable or anything of that nature), so I'm assuming that it's fine for the design to allow anyone to enumerate through all URLs which might be stored using our service.

### UX
> Please try to make it both end user and developer friendly

"End user" friendly seems to imply "build a UI" to me. ➡️ So there's a janky UI at [localhost:3000](http://localhost:3000/).

"Developer friendly" suggests "API with some amount of documentation". ➡️ So there's a Swagger UI at [localhost:3000/docs](http://localhost:3000/docs) and JSON spec at [http://localhost:3000/api/doc](http://localhost:3000/api/doc)

> Generating a short url from a long url

Some common internal services (like go/links) allow you to specify your own custom short URL for a given link. The use of the word "generating" here seems to imply this isn't the case, so we handle that for you (but it wouldn't be difficult to add in).

## Architecture

### Incredibly complex systems diagram
Next.js (React + Node.js) -> Redis

**Alternative consideration:**

If there weren't a requirement that it had to be runnable locally, I would've been cheeky and written everything in a Cloudflare worker and used KV as the storage backend, and then leveraged Cloudflare's endpoint analytics (which isn't available locally) instead of writing anything myself (part of me still thinks this would've been worth it).

### Why & how

Redis solves for:

- [x] Data persistence (must survive computer restarts) ➡️ Redis serves queries from memory but persists data to disk (you can technically lose some amount of data here but for the use case this seems fine)
- [x] Short links can expire at a future time or can live forever. ➡️ Redis natively supports TTLs on stored data
- [x] List the number of times a short url has been accessed in the last 24 hours, past week, and all time. ➡️ Redis supports [Timeseries](https://redis.io/docs/data-types/timeseries/). We create a timeseries for each short link and query it for the given time periods. There's probably a more efficient way of doing this (all time could just be a counter, yada yada yada), but this is pretty flexible and would allow us to render graphs showing link accesses over time (which is something I intended to do but didn't have the time). 

Here's how we do the rest of what was asked for:
- [x] Has one long URL ➡️ Store a key-value pair of short URL -> long.
- [x] No duplicate URLs are allowed to be created ➡️ Store a key-value pair of long URL -> short.
- [x] Generating a short url from a long url ➡️ We atomically increment and get a counter and [base58 encode it](https://learnmeabitcoin.com/technical/base58#why-base58) as the short URL. We then store this in Redis so we can redirect short URLs to their corresponding long ones. An alternative would be to store a hash of the long URL and then slice off a prefix of pre-defined length. Theoretically we don't have to deal with collisions and we get the advantage of having shorter URLs until we have to store more, but our URLs are a bit more guessable and *technically* you can create an infinite redirect loop if you take advantage of that -- you could do the same with hashing but you're probably better off just mining Bitcoin. With hashing you can also rely on your datastore (if it provides a primary key / unique constraint) to prevent you from inserting long URLs which already exist using only one table/index. You'd end up having to do some additional work if you wanted to support manually entered short links with hashing.

Next.js (and React) were chosen primarily for productivity reasons:
- Good amount of documentation and examples online for how to do pretty much anything
- Used to working with Typescript/Javascript on my own projects
- Opinionated frameworks that I'm okay letting make some decisions for me to do less work

Given more time, I would probably re-write the backend in Rust 😬

## What's missing for production

* **Auth\*:**
  * Redis is accessible to anyone, we would want to restrict access to certain accounts (and store those credentials in a secret management tool of some sort)
  * No authentication for the shortener service itself. Anyone can create and delete whatever links they want. Since this is an internal service, we would likely want to implement something OpenID/SAML compatible to facilitate single-sign on. There's also an exposed endpoint that you can use to drop all data in Redis.
* **Redis:**
  * **Transactions:**
    * Right now certain operations (deleting a short link, creating a short link) can execute and partially fail because they manipulate data using multiple transactions. 
    * While unlikely, these operations should be executed atomically (all or nothing).
    * Technically it's possible for people competing to store the same link at the exact same time to store it twice because we do a GET *and then* SET
  * **Pipelining**: (sending multiple commands without waiting serially for their results) would improve performance (but isn't enabled).
  * [RedisStack](https://redis.io/docs/about/about-stack/) currently enables all additional modules (even though we only use RedisSearch), needs to be configured to remove what isn't needed.
  * We use [Redis Timeseries](https://redis.io/docs/data-types/timeseries/) for storing link analytics, but without any compaction enabled (which would improve performance and reduce storage footprint if it were intelligently configured).
* **Deployment:**
  * Because we leverage Redis, our API routes are *not* compatible with Edge runtimes (although Cloudflare Workers support TCP connections -- `ioredis` still assumes a Node.js environment) -- meaning deploying our application would require running a Node.js server somewhere.
  * The current docker compose file (provided for simplicity of execution) likely isn't what we would want to deploy to production. We would probably want to create Kubernetes manifests with necessary service and deployment specs (containing some concrete resource budgets) and horizontal pod autoscaling.
* **UX:**
  * **Error-handling:** Client doesn't render any sort of useful messages or information when something goes wrong (like trying to generate a short link from an invalid URL). Luckily nothing ever goes wrong in demos so this won't be apparent to anyone who looks at this.
  * **Progress indicators/Animations:** Not a lot of feedback is given to the user on why the UI is stalling before loading something
  * **Mobile:** I haven't even *looked* at what the UI looks like in mobile.
* **Tech-debt:** 
  * Code started getting worse as time went on, some files are a bit tougher to read. Need betters tests as well.
  * Front-end code isn't optimal

## Troubleshooting

If you run into the following error:
```
https://nextjs.org/docs/messages/module-not-found
- wait compiling /instrumentation (client and server)...
- error ./app/page.tsx:2:0
Module not found: Can't resolve '@mui/joy/styles'
  1 | "use client"
> 2 | import { CssVarsProvider, extendTheme } from '@mui/joy/styles'
  3 | import Grid from '@mui/joy/Grid'
  4 | import LinkShortenerInput from "@/components/Search"
  5 |
```

Run:
```
yarn add @mui/joy
```

If you run into data related issues, RedisStack also has a UI running at [localhost:8001/](http://localhost:8001/) to help you filter through data.
