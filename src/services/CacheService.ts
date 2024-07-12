import { cache } from "../configs/cache";
import { promisify } from "util";

class CacheService {
  private cacheService = cache;

  async get(key: string) {
    return await this.cacheService.get(key) as string;
  }

  async set(key: string, value: any) {
    const parsedValue = JSON.stringify(value);

    return await this.cacheService.set(key, parsedValue);
  }

  async setWithExpiration(
    key: string,
    value: any,
    expirationTimeInSecs: number
  ) {
    const parsedValue = JSON.stringify(value);

    return this.cacheService.set(
      key,
      parsedValue,
      "EX", expirationTimeInSecs
    );
  }

  async verifyExistKey(key: string): Promise<boolean> {
    const hasItem = await this.cacheService.get(key);

    return !!hasItem;
  }

  async delete(key: string) {
    const syncDelete = promisify(this.cacheService.del).bind(
      this.cacheService
    );
    return syncDelete(key);
  }
}

export { CacheService };
