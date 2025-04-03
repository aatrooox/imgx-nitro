//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "server",
  compatibilityDate: "2025-02-25",
  runtimeConfig: {
    jwtSecret: 'your_secret_key',
  },
  preset: 'bun',
  imports: {
    presets: [
      {
        from: 'zod',
        imports: ['z']
      },
      {
        from: 'h3-zod',
        imports: ['useSafeValidatedQuery', 'useSafeValidatedBody', 'useValidatedParams', 'zh']
      }
    ]
  },
  // cors 目前还十分难用，需自行配置正向、反向代理解决
  routeRules: {
    // '/**': {
    //   cors: true,
      // headers: {
      //   'Access-Control-Allow-Origin': '*',
      //   'Access-Control-Allow-Methods': '*',
      //   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      // },
    // },
  },
  storage: {
    redis: {
      driver: 'redis',
      host: 'localhost',
      db: 1, // TODO 和其他服务 区分开
      tls: false,
      port: 6379,
    },
    // db 才是 base
    // local: {
    //   driver: 'fs',
    //   base: './assets', // 路径
    // }
  },
});