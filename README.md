# cf-takehome

## Installation

This project needs [`docker`](https://docs.docker.com/get-docker/) (and uses `make` for convenience)  in order to be ran. That's it.

## Commands

### Build <sup>(optional)</sup>

```shell
# Executes `docker compose build` 
make build
```

### Test
```shell

```

### Run



## Proposal

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

To an unexperienced professional this *sounds* like it would imply a meager scale, but as anyone who has operated a few internal services knows: *it's only a matter of time before someone uses it in production*.

But we do make the assumption that all links can reasonably fit into memory since we're using Redis as our backend. Even a worst case scenario of storing [~a billion links](https://www.forbes.com/advisor/business/software/website-statistics/#:~:text=1.,are%20actively%20maintained%20and%20visited.), an average of [~77 characters per URL](http://www.supermind.org/blog/740/average-length-of-a-url-part-2), and 4 bytes to encode each character using UTF-32 at worst, we'd need in the ballpark of 308 GB of memory to store links once (not considering keys and additional indexes). Let's say between 1-2 TB to be safe. Not something most people are running on their laptops, but pretty feasible. [With sharding and replication](https://redis.io/docs/management/scaling/), we can scale our storage layer to reach pretty high throughput while storing a good amount of data. I've ignored the fact that we're also storing a time series for tracking link accesses.

Since it's an internal service, some might be tempted to say performance doesn't really matter. Apparently employees aren't revenue generating like users 🤷.

### UX
> Please try to make it both end user and developer friendly

"End user" friendly seems to imply "build a UI" to me.
"Developer friendly" suggests "API with some amount of documentation." 

> Generating a short url from a long url

Some common internal services (like go/links) allow you to specify your own custom short URL for a given link. The use of the word "generating" here seems to imply this isn't the case.

## Architecture



## What's missing for production

* Auth*: 
  * Redis is accessible to anyone, we would want to restrict access to certain privileged accounts (and store those credentials in a secret management tool of some sort)
  * No authentication for the shortener service itself. Anyone can create and delete whatever links they want. Since this is an internal service, we would likely want to implement something OpenID/SAML compatible to facilitate single-sign on.
* Redis:
  * Transactions:
    * Right now certain operations (deleting a short link, creating a short link) can execute and partially fail because they manipulate data using multiple transactions. 
    * While unlikely, these operations should be executed atomically (all or nothing).
  * Pipelining (sending multiple commands without waiting serially for their results) would also greatly improve performance (but isn't enabled).
  * RedisStack currently enables all additional modules (even though we only use RedisSearch), it would need to be configured to disable anything else
  * We use Redis' Time Series for storing link analytics, but without any compaction enabled (which would improve performance and reduce storage footprint)
* Deployment:
  * Because we leverage Redis, our API routes are *not* compatible with Edge runtimes (despite Cloudflare Workers now support TCP connections -- `ioredis` still assumes a Node.js environment) -- meaning deploying our application would require running a Node.js server somewhere.
  * The current docker compose file (provided for simplicity of execution) likely isn't what we would want to deploy to production. We would probably want to create a Kubernetes manifests with necessary service and deployment specs (containing some concrete resource budgets) and horizontal pod autoscaling.
* UX:
  * Error-handling: Client doesn't render any sort of useful messages or information when something goes wrong (like trying to generate a short link from an invalid URL). Luckily nothing ever goes wrong in demos so this won't be apparent to anyone who looks at this.
