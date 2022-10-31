import { redisClient } from "../configs/redis";
import { promisify } from "util";

class RedisService {
  private redis = redisClient;

  async get(key: string) {
    const syncGet = promisify(this.redis.get).bind(this.redis);
    return syncGet(key);
  }

  async set(key: string, value: any) {
    const parsedValue = JSON.stringify(value);
    const syncSet = promisify(this.redis.set).bind(this.redis);

    return syncSet(key, parsedValue)
  }

  async delete(key: string) {
    const syncDelete = promisify(this.redis.del).bind(this.redis)
    return syncDelete(key)
  }
}

export { RedisService }
