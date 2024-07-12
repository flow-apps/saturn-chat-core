/*
  Cache usando Redis
*/

import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on("error", err => {
  console.error(err)
})

// import { MemoryCache } from "memory-cache-node"

// const maxItems = 10000
// const checkItemIntervalSecs = 30
// const cache = new MemoryCache(checkItemIntervalSecs, maxItems)

const cache = redisClient

export { cache }
