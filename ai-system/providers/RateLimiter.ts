/**
 * Sovereign Lands - Client-Side RateLimiter & Query Cache
 * Prevents player API key exhaustion using a Token Bucket algorithm and LRU response cache.
 */

import {
  NPCConversationContext,
  NPCSpatialContext,
  NPCSpatialAction,
  RateLimiterMetrics,
} from './types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class RateLimiter {
  private static instance: RateLimiter | null = null;

  private maxRequestsPerMinute: number;
  private tokens: number;
  private lastRefillTimestamp: number;
  private totalRequestsMade = 0;
  private cacheHits = 0;

  // In-memory query cache with TTL
  private responseCache: Map<string, CacheEntry<any>> = new Map();
  private maxCacheEntries = 100;
  private defaultCacheTtlMs = 60 * 1000; // 1 minute default cache

  constructor(maxRequestsPerMinute = 25) {
    this.maxRequestsPerMinute = Math.max(5, maxRequestsPerMinute);
    this.tokens = this.maxRequestsPerMinute;
    this.lastRefillTimestamp = Date.now();
  }

  public static getInstance(rpm = 25): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(rpm);
    }
    return RateLimiter.instance;
  }

  public setLimit(rpm: number): void {
    this.maxRequestsPerMinute = Math.max(5, Math.min(120, rpm));
    if (this.tokens > this.maxRequestsPerMinute) {
      this.tokens = this.maxRequestsPerMinute;
    }
  }

  public getLimit(): number {
    return this.maxRequestsPerMinute;
  }

  /**
   * Refills the token bucket based on elapsed time.
   */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    const refillRatePerSecond = this.maxRequestsPerMinute / 60;
    const newTokens = elapsedSeconds * refillRatePerSecond;

    if (newTokens > 0) {
      this.tokens = Math.min(this.maxRequestsPerMinute, this.tokens + newTokens);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Tries to consume tokens immediately. Returns true if allowed, false if rate limited.
   */
  public tryAcquire(tokensRequired = 1): boolean {
    this.refill();
    if (this.tokens >= tokensRequired) {
      this.tokens -= tokensRequired;
      this.totalRequestsMade++;
      return true;
    }
    return false;
  }

  /**
   * Asynchronously waits until a token is available, or rejects if wait exceeds maxWaitMs.
   */
  public async acquire(tokensRequired = 1, maxWaitMs = 10000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime <= maxWaitMs) {
      if (this.tryAcquire(tokensRequired)) {
        return true;
      }
      // Calculate delay until next token is roughly available
      const tokensNeeded = tokensRequired - this.tokens;
      const secondsNeeded = tokensNeeded / (this.maxRequestsPerMinute / 60);
      const waitMs = Math.min(1000, Math.max(100, Math.ceil(secondsNeeded * 1000)));

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    return false;
  }

  /**
   * Generate deterministic cache key for NPC conversation context.
   */
  public getConversationCacheKey(context: NPCConversationContext): string {
    const cleanMsg = context.playerMessage.trim().toLowerCase();
    const role = context.npcRole.toLowerCase();
    return `dialogue:${context.npcId}:${role}:${cleanMsg}`;
  }

  /**
   * Generate deterministic cache key for NPC spatial action context.
   */
  public getSpatialCacheKey(context: NPCSpatialContext): string {
    const pos = Array.isArray(context.currentPosition)
      ? `${Math.round(context.currentPosition[0])}_${Math.round(context.currentPosition[2])}`
      : `${Math.round(context.currentPosition.x)}_${Math.round(context.currentPosition.z)}`;
    const routine = context.currentRoutine || 'patrol';
    const time = context.timeOfDay || 'day';
    return `spatial:${context.npcId}:${routine}:${pos}:${time}`;
  }

  /**
   * Retrieve cached value if not expired.
   */
  public getCached<T>(key: string): T | null {
    const entry = this.responseCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.responseCache.delete(key);
      return null;
    }

    this.cacheHits++;
    return entry.value as T;
  }

  /**
   * Set cached value with TTL.
   */
  public setCached<T>(key: string, value: T, ttlMs?: number): void {
    const effectiveTtl = ttlMs ?? this.defaultCacheTtlMs;

    // Evict oldest if reaching capacity
    if (this.responseCache.size >= this.maxCacheEntries) {
      const oldestKey = this.responseCache.keys().next().value;
      if (oldestKey) {
        this.responseCache.delete(oldestKey);
      }
    }

    this.responseCache.set(key, {
      value,
      expiresAt: Date.now() + effectiveTtl,
    });
  }

  /**
   * Clears the response cache.
   */
  public clearCache(): void {
    this.responseCache.clear();
  }

  public getRetryAfterSeconds(): number {
    this.refill();
    const tokensNeeded = 1 - this.tokens;
    if (tokensNeeded <= 0) return 0;
    return Math.max(1, Math.ceil(tokensNeeded / (this.maxRequestsPerMinute / 60)));
  }

  /**
   * Get current metrics for HUD / telemetry.
   */
  public getMetrics(): RateLimiterMetrics {
    this.refill();
    const tokensNeeded = 1 - this.tokens;
    const secondsNeeded = tokensNeeded > 0 ? tokensNeeded / (this.maxRequestsPerMinute / 60) : 0;

    return {
      requestsRemaining: Math.floor(Math.max(0, this.tokens)),
      windowResetTimeMs: Math.round(secondsNeeded * 1000),
      totalRequestsMade: this.totalRequestsMade,
      cachedHits: this.cacheHits,
      isThrottled: this.tokens < 1,
    };
  }
}

export const rateLimiter = RateLimiter.getInstance();
