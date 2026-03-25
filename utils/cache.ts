type CacheItem<T> = {
    data: T;
    timestamp: number;
};

class MemoryCache {
    private cache: Map<string, CacheItem<any>> = new Map();
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default TTL

    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    get<T>(key: string, ttl: number = this.defaultTTL): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        const isExpired = Date.now() - item.timestamp > ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    clear(): void {
        this.cache.clear();
    }
}

export const apiCache = new MemoryCache();
