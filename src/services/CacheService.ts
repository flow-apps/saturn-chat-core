import { cache } from "../configs/cache";
import { promisify } from "util";

class CacheService {
  private cacheService = cache;

  async get(key: string) {
    return this.cacheService.retrieveItemValue(key) as string;
  }

  async set(key: string, value: any) {
    const parsedValue = JSON.stringify(value);

    return this.cacheService.storePermanentItem(key, parsedValue);
  }

  async setWithExpiration(
    key: string,
    value: any,
    expirationTimeInSecs: number
  ) {
    const parsedValue = JSON.stringify(value);

    return this.cacheService.storeExpiringItem(
      key,
      parsedValue,
      expirationTimeInSecs
    );
  }

  async verifyExistKey(key: string): Promise<boolean> {
    return this.cacheService.hasItem(key);
  }

  async delete(key: string) {
    const syncDelete = promisify(this.cacheService.removeItem).bind(
      this.cacheService
    );
    return syncDelete(key);
  }
}

export { CacheService };
