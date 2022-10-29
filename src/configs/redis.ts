import Redis from "ioredis";

const redisClient = new Redis({ enableOfflineQueue: false });

redisClient.on("error", err => {

})

export { redisClient }
