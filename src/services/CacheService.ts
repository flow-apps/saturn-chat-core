import { cache } from "../configs/cache";
import { promisify } from "util";

class CacheService {
  private cacheService = cache;

  async get(key: string) {
    const syncGet = promisify(this.cacheService.retrieveItemValue).bind(this.cacheService);
    return syncGet(key);
  }

  async set(key: string, value: any) {
    const parsedValue = JSON.stringify(value);
    const syncSet = promisify(this.cacheService.storePermanentItem).bind(this.cacheService);

    return syncSet(key, parsedValue)
  }

  async setWithExpiration(key: string, value: any, expirationTimeInSecs: number) {
    const parsedValue = JSON.stringify(value);
    const syncSet = promisify(this.cacheService.storeExpiringItem).bind(this.cacheService);

    return syncSet(key, parsedValue, expirationTimeInSecs)
  }

  async verifyExistKey(key: string): Promise<boolean> {
    const syncVerify = promisify(this.cacheService.hasItem).bind(this.cacheService);

    return syncVerify(key) as Promise<boolean>
  }

  async delete(key: string) {
    const syncDelete = promisify(this.cacheService.removeItem).bind(this.cacheService)
    return syncDelete(key)
  }
}

export { CacheService }
