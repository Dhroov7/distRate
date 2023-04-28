# Distributed Rate Limiter

A distributed rate limiter library using Redis.

## Introduction

This package provides a rate limiter that uses Redis for distributed locking and storage. It is designed to work in a distributed environment with multiple Node.js servers.

The rate limiter uses a token bucket algorithm to control the rate of requests. It maintains a token bucket for each unique ID that is passed to the `execute()` method. The bucket is initialized with a specified number of tokens and a duration, which determines the rate at which tokens are replenished. Each time the `execute()` method is called with a unique ID, the rate limiter checks the token bucket for that ID and determines whether the request should be allowed based on the number of tokens available in the bucket.

## Installation

To install the package, use the following command:
```
npm install distrate
```

## Usage

To use the package, create an instance of the `DistRate` class and call the `execute()` method with a unique ID for each request. The method returns a boolean indicating whether the request should be allowed or not.


```typescript
import IORedis from "ioredis";
import { DistRate } from "distrate";

const redisClient = new IORedis.Cluster([...]);

const rateLimiter = new DistRate({
  tokens: 10,
  duration: 60,
  redisClient,
});

const allowed = await rateLimiter.execute("user123");
```

## Options

The `DistRate` constructor takes an options object with the following properties:

- `tokens` (required): The number of tokens in the token bucket.
- `duration` (required): The duration in seconds for which the tokens are replenished.
- `redisClient` (required): An instance of the Redis client to use for distributed locking and storage.
- `lockRetryCount` (optional): The maximum number of times to retry acquiring the Redis lock when executing the rate limiter (default: 5).
- `maxBackoffDelay` (optional): The maximum delay in milliseconds between retries when acquiring the Redis lock (default: 10000).
- `initialBackoffDelay` (optional): The initial delay in milliseconds between retries when acquiring the Redis lock (default: 100).
- `backoffMultiplier` (optional): The factor by which to increase the delay between retries when acquiring the Redis lock (default: 2).
- `redisKeyTimeout` (optional): The timeout in milliseconds for the Redis key lock (default: 5000).
- `enableAnalytics` (optional): A boolean indicating whether to enable analytics logging (default: false).


License: MIT

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
