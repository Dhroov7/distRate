export declare class DistRate {
    private tokens;
    private duration;
    private _redisClient;
    private _redisLock;
    private retryCount;
    private maxBackoffDelay;
    private initialBackoffDelay;
    private backoffMultiplier;
    private enableAnalytics;
    constructor(options: IOptions);
    /**
     * Executes the rate limiter for a given unique ID by calculating the token bucket and checking if the request should be allowed or not.
     * @param uniqueId The unique ID to execute the rate limiter for.
     * @returns A boolean indicating whether the request is allowed or not.
     * @throws An error if any error occurs while executing the rate limiter.
     */
    execute(uniqueId: string): Promise<boolean>;
    /**
     * Attempts to acquire a Redis lock for the given Redis key with backoff retries.
     *
     * @param redisKey The Redis key for which the lock should be acquired.
     * @param maxAttempts The maximum number of attempts to acquire the lock before giving up.
     * @returns A Promise that resolves when the lock is successfully acquired.
     * @throws An error if the lock could not be acquired after the maximum number of attempts.
     */
    private acquireRedisLock;
}
/**
 * The options for configuring the RateLimiter.
 */
export interface IOptions {
    tokens: number;
    duration: number;
    redisKeyTimeout?: number;
    lockRetryCount?: number;
    maxBackoffDelay?: number;
    initialBackoffDelay?: number;
    backoffMultiplier?: number;
    enableAnalytics?: boolean;
    redisClient: any;
}
