import IORedis from "ioredis";
import { isEmpty } from "lodash";
import {
  BACKOFF_MULTIPLIER,
  INITIAL_BACKOFF_DELAY,
  MAX_BACKOFF_DELAY,
} from "./index.constant";

const RedisLock = require("ioredis-lock");

export class DistRate {
  private tokens: number;
  private duration: number;
  private _redisClient: IORedis.Cluster | IORedis.Redis;
  private _redisLock: any;
  private retryCount: number;
  private maxBackoffDelay: number;
  private initialBackoffDelay: number;
  private backoffMultiplier: number;
  private enableAnalytics: boolean;

  constructor(options: IOptions) {
    this.tokens = options.tokens;
    this.duration = options.duration;
    this._redisClient = options.redisClient;
    this.retryCount = options.lockRetryCount || 5;
    this.maxBackoffDelay = options.maxBackoffDelay || MAX_BACKOFF_DELAY;
    this.initialBackoffDelay =
      options.initialBackoffDelay || INITIAL_BACKOFF_DELAY;
    this.backoffMultiplier = options.backoffMultiplier || BACKOFF_MULTIPLIER;
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
  async execute(uniqueId: string): Promise<boolean> {
    try {
      const redisKey: string = `RT:id:${uniqueId}`,
        redisAnalyticsKey: string = `RT:analytics`,
        currentTime: number = Math.floor(Date.now() / 1000);

      // Acquiring the lock on the Redis key for the `uniqueId`
      await this.acquireRedisLock(redisKey, this.retryCount);
      // await this._redisLock.acquire(`lock:${redisKey}`);

      let userBucket = await this._redisClient.hgetall(redisKey),
        allowRequest: boolean = false;

      if (isEmpty(userBucket)) {
        // Initialize the token bucket with the given number of tokens and the current timestamp
        await this._redisClient.hmset(redisKey, {
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

      let localUserBucket: ITokenBucket = {
        tokens: +userBucket.tokens,
        lastCall: +userBucket.lastCall,
      };

      // Calculating the number of new tokens that should be added to the bucket

      const timeDiff: number = currentTime - parseInt(userBucket.lastCall),
        newTokens: number = (timeDiff * this.tokens) / this.duration;

      localUserBucket.tokens += newTokens;
      localUserBucket.lastCall = currentTime;

      if (localUserBucket.tokens > this.tokens) {
        localUserBucket.tokens = this.tokens;
      }

      if (localUserBucket.tokens >= 1) {
        localUserBucket.tokens -= 1;
        allowRequest = true;
        this._redisClient.hincrby(redisAnalyticsKey, "requestCleared", 1);
      } else {
        //Analytics call to redis
        if (this.enableAnalytics) {
          this._redisClient.hincrby(redisAnalyticsKey, "requestBlocked", 1);
        }
      }
      // Rounding the token count to two decimal places
      localUserBucket.tokens = +localUserBucket.tokens.toFixed(2);

      // Saving the updated token bucket and releasing the lock on the Redis key
      await Promise.all([
        this._redisClient.hmset(redisKey, localUserBucket as any),
        this._redisLock.release(),
      ]);

      return allowRequest;
    } catch (err: any) {
      throw new Error(
        `Error occurred while executing rate limiter: ${err.message}`
      );
    }
  }

  /**
   * Attempts to acquire a Redis lock for the given Redis key with backoff retries.
   *
   * @param redisKey The Redis key for which the lock should be acquired.
   * @param maxAttempts The maximum number of attempts to acquire the lock before giving up.
   * @returns A Promise that resolves when the lock is successfully acquired.
   * @throws An error if the lock could not be acquired after the maximum number of attempts.
   */
  private async acquireRedisLock(
    redisKey: string,
    maxAttempts: number
  ): Promise<any> {
    let attempts = 0,
      backoffDelay = this.initialBackoffDelay;

    while (attempts < maxAttempts) {
      try {
        await this._redisLock.acquire(`lock:${redisKey}`);
        return;
      } catch (err) {
        // Lock not acquired, wait for backoffDelay before trying again
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));

        // Increase the backoff delay for the next retry
        backoffDelay = Math.min(
          backoffDelay * this.backoffMultiplier,
          this.maxBackoffDelay
        );
        attempts++;
      }
    }
    throw new Error("Lock not acquired after maximum attempts");
  }
}

/**
 * The options for configuring the RateLimiter.
 */
export interface IOptions {
  tokens: number; // The number of tokens in the bucket

  duration: number; // The duration in seconds that tokens should be added to the bucket

  redisKeyTimeout?: number; // Optional timeout in seconds for the Redis key

  lockRetryCount?: number; // Optional number of times to retry acquiring a lock on the Redis key

  maxBackoffDelay?: number; // Optional maximum delay in milliseconds for exponential backoff

  initialBackoffDelay?: number; // Optional initial delay in milliseconds for exponential backoff

  backoffMultiplier?: number; // Optional multiplier for exponential backoff

  enableAnalytics?: boolean; // Optional flag to enable analytics
  
  redisClient: any; // Redis client instance to use for rate limiting
}

/**
 * An interface for storing the token bucket data.
 *
 * @property tokens The number of tokens remaining in the bucket.
 * @property lastCall The timestamp (in seconds) of the last request made by the user.
 */
interface ITokenBucket {
  tokens: number;
  lastCall: number;
}
