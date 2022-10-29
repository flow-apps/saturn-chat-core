import ExpressRedisCache from "express-redis-cache";

const redisCache = ExpressRedisCache({
  port: process.env.REDIS_PORT,
  expire: 120
})

export { redisCache }