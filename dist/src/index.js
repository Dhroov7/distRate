"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistRate = void 0;
const lodash_1 = require("lodash");
const index_constant_1 = require("./index.constant");
const RedisLock = require("ioredis-lock");
class DistRate {
    constructor(options) {
        this.tokens = options.tokens;
        this.duration = options.duration;
        this._redisClient = options.redisClient;
        this.retryCount = options.lockRetryCount || 5;
        this.maxBackoffDelay = options.maxBackoffDelay || index_constant_1.MAX_BACKOFF_DELAY;
        this.initialBackoffDelay =
            options.initialBackoffDelay || index_constant_1.INITIAL_BACKOFF_DELAY;
        this.backoffMultiplier = options.backoffMultiplier || index_constant_1.BACKOFF_MULTIPLIER;
        this.enableAnalytics = options.enableAnalytics || false;
        // Creating a new Redis lock object for the given Redis client
        this._redisLock = RedisLock.createLock(this._redisClient, {
            timeout: options.redisKeyTimeout || 5000,
        });
    }
    /**
     * Executes the rate limiter for a given unique ID by calculating the token bucket and checking if the request should be allowed or not.
     * @param uniqueId The unique ID to execute the rate limiter for.
     * @returns A boolean indicating whether the request is allowed or not.
     * @throws An error if any error occurs while executing the rate limiter.
     */
    execute(uniqueId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const redisKey = `RT:id:${uniqueId}`, redisAnalyticsKey = `RT:analytics`, currentTime = Math.floor(Date.now() / 1000);
                // Acquiring the lock on the Redis key for the `uniqueId`
                yield this.acquireRedisLock(redisKey, this.retryCount);
                // await this._redisLock.acquire(`lock:${redisKey}`);
                let userBucket = yield this._redisClient.hgetall(redisKey), allowRequest = false;
                if ((0, lodash_1.isEmpty)(userBucket)) {
                    // Initialize the token bucket with the given number of tokens and the current timestamp
                    yield this._redisClient.hmset(redisKey, {
                        tokens: this.tokens - 1,
                        lastCall: currentTime,
                    });
                    //Analytics call to redis
                    if (this.enableAnalytics) {
                        this._redisClient.hmset(redisAnalyticsKey, {
                            requestBlocked: 0,
                            requestCleared: 1,
                        });
                    }
                    return true;
                }
                let localUserBucket = {
                    tokens: +userBucket.tokens,
                    lastCall: +userBucket.lastCall,
                };
                // Calculating the number of new tokens that should be added to the bucket
                const timeDiff = currentTime - parseInt(userBucket.lastCall), newTokens = (timeDiff * this.tokens) / this.duration;
                localUserBucket.tokens += newTokens;
                localUserBucket.lastCall = currentTime;
                if (localUserBucket.tokens > this.tokens) {
                    localUserBucket.tokens = this.tokens;
                }
                if (localUserBucket.tokens >= 1) {
                    localUserBucket.tokens -= 1;
                    allowRequest = true;
                    this._redisClient.hincrby(redisAnalyticsKey, "requestCleared", 1);
                }
                else {
                    //Analytics call to redis
                    if (this.enableAnalytics) {
                        this._redisClient.hincrby(redisAnalyticsKey, "requestBlocked", 1);
                    }
                }
                // Rounding the token count to two decimal places
                localUserBucket.tokens = +localUserBucket.tokens.toFixed(2);
                // Saving the updated token bucket and releasing the lock on the Redis key
                yield Promise.all([
                    this._redisClient.hmset(redisKey, localUserBucket),
                    this._redisLock.release(),
                ]);
                return allowRequest;
            }
            catch (err) {
                throw new Error(`Error occurred while executing rate limiter: ${err.message}`);
            }
        });
    }
    /**
     * Attempts to acquire a Redis lock for the given Redis key with backoff retries.
     *
     * @param redisKey The Redis key for which the lock should be acquired.
     * @param maxAttempts The maximum number of attempts to acquire the lock before giving up.
     * @returns A Promise that resolves when the lock is successfully acquired.
     * @throws An error if the lock could not be acquired after the maximum number of attempts.
     */
    acquireRedisLock(redisKey, maxAttempts) {
        return __awaiter(this, void 0, void 0, function* () {
            let attempts = 0, backoffDelay = this.initialBackoffDelay;
            while (attempts < maxAttempts) {
                try {
                    yield this._redisLock.acquire(`lock:${redisKey}`);
                    return;
                }
                catch (err) {
                    // Lock not acquired, wait for backoffDelay before trying again
                    yield new Promise((resolve) => setTimeout(resolve, backoffDelay));
                    // Increase the backoff delay for the next retry
                    backoffDelay = Math.min(backoffDelay * this.backoffMultiplier, this.maxBackoffDelay);
                    attempts++;
                }
            }
            throw new Error("Lock not acquired after maximum attempts");
        });
    }
}
exports.DistRate = DistRate;
