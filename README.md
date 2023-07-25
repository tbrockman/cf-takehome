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

//TODO

## Trade-offs

//TODO

## What's missing for production

* Auth*: 
  * Redis is completely open and accessible to anyone, we would want to restrict access to certain privileged accounts (and store those credentials in a secret management tool of some sort)
  * No authentication for the shortener service itself. Anyone can create and delete whatever links they want. Since this is an internal service, we would likely want to implement something OpenID/SAML compatible to facilitate single-sign on.
* Transactions/Pipelining:
  * Right now certain operations (deleting a short link, creating a short link) can execute and partially fail because they manipulate data using multiple transactions. 
  * While unlikely, these operations should be executed atomically (all or nothing). 
* Deployment:
  * Because we leverage Redis, our API routes are *not* compatible with Edge runtimes (despite Cloudflare Workers now support TCP connections -- `ioredis` still assumes a Node.js environment) -- meaning deploying our application would require running a Node.js server somewhere.
  * The current docker compose file (provided for simplicity of execution) likely isn't what we would want to deploy to production. We would probably want to create a Kubernetes manifests with necessary service and deployment specs (containing some concrete resource budgets) and horizontal pod autoscaling.
* Configuration:
  * The Redis backend (RedisStack) currently enables all additional modules (even though we only use RedisSearch)
  * The application is built for local development, and doesn't produce an optimized production build. In the case of next.js, this means re-compiling on requests to pages.
* Error-handling:
  * Client doesn't render anything