const { createClient } = require('redis');
const { redisUrl } = require('./env');

let redisClient = null;
let redisAvailable = false;

if (redisUrl) {
  redisClient = createClient({ url: redisUrl });
  redisClient.on('error', (err) => {
    redisAvailable = false;
    console.warn('Redis not available:', err.message);
  });
  redisClient.on('ready', () => {
    redisAvailable = true;
  });
  // Try to connect, but don't crash if it fails
  redisClient.connect().catch(() => {
    console.warn('Redis not available — running without cache');
  });
} else {
  console.warn('REDIS_URL not set — running without cache');
}

module.exports = {
  redisClient,
  connectRedis: async () => redisClient,
  isAvailable: () => redisAvailable,
};
