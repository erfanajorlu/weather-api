export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  weather: {
    apiKey: process.env.WEATHER_API_KEY! || '',
    baseUrl: process.env.WEATHER_API_BASE_URL! || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
  },
});
