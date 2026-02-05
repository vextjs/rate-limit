/**
 * TypeScript 类型定义完整性测试
 * 测试常见的使用场景
 */

import { RateLimiter, RedisStore, MemoryStore, RedisClient } from './index';

// ========== 测试场景 1: 基础配置 ==========
const limiter1 = new RateLimiter({
  windowMs: 60000,
  max: 100,
  algorithm: 'sliding-window',
  headers: true,
});

// ========== 测试场景 2: Redis 存储 ==========
const mockRedis: RedisClient = {
  get: async (key: string) => null,
  set: async (key: string, value: string) => 'OK',
  setex: async (key: string, seconds: number, value: string) => 'OK',
  incr: async (key: string) => 1,
  decr: async (key: string) => 0,
  del: async (...keys: string[]) => keys.length,
  keys: async (pattern: string) => [],
  expire: async (key: string, seconds: number) => 1,
  zadd: async (key: string, score: number, member: string) => 1,
  zcard: async (key: string) => 0,
  zremrangebyscore: async (key: string, min: string | number, max: string | number) => 0,
  zpopmax: async (key: string) => [],
  type: async (key: string) => 'string',
};

const redisStore = new RedisStore({
  client: mockRedis,
  prefix: 'rl:',
  expiry: 3600,
});

const limiter2 = new RateLimiter({
  store: redisStore,
  windowMs: 60000,
  max: 100,
});

// ========== 测试场景 3: 使用条件表达式（模拟 ctx.app.redis）==========
// 这是截图中的使用场景
const ctx = {
  app: {
    redis: mockRedis,
  },
};

const limiter3 = new RateLimiter({
  store: ctx.app.redis
    ? new RedisStore({
        client: ctx.app.redis,
        prefix: '',
      })
    : 'memory',
  headers: true,
});

// ========== 测试场景 4: 动态 max 函数 ==========
const limiter4 = new RateLimiter({
  max: (req: any) => {
    return req.user?.isPremium ? 1000 : 100;
  },
});

// ========== 测试场景 5: skip 函数（IP 白名单）==========
const limiter5 = new RateLimiter({
  skip: (req: any) => {
    const whitelistIPs = ['127.0.0.1', '192.168.1.100'];
    return whitelistIPs.includes(req.ip);
  },
});

// ========== 测试场景 6: 自定义 keyGenerator ==========
const limiter6 = new RateLimiter({
  keyGenerator: (req: any, context?: { route?: string }) => {
    if (context?.route) {
      return `${req.user?.id || req.ip}:${context.route}`;
    }
    return req.user?.id || req.ip;
  },
});

// ========== 测试场景 7: 自定义 handler ==========
const limiter7 = new RateLimiter({
  handler: (req: any, res: any, next?: Function) => {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: 60,
    });
  },
});

// ========== 测试场景 8: 路由级配置 ==========
const limiter8 = new RateLimiter({
  perRoute: {
    '/api/login': { windowMs: 15 * 60 * 1000, max: 5 },
    '/api/users': { windowMs: 60 * 1000, max: 100 },
  },
});

// ========== 测试场景 9: Token Bucket 算法 ==========
const limiter9 = new RateLimiter({
  algorithm: 'token-bucket',
  capacity: 100,
  refillRate: 10,
});

// ========== 测试场景 10: Leaky Bucket 算法 ==========
const limiter10 = new RateLimiter({
  algorithm: 'leaky-bucket',
  capacity: 50,
  leakRate: 5,
});

// ========== 测试场景 11: 使用方法 ==========
async function testMethods() {
  const limiter = new RateLimiter();

  // check 方法
  const result = await limiter.check('user-123', { route: '/api/data' });
  console.log(result.allowed, result.remaining, result.resetTime);

  // reset 方法
  await limiter.reset('user-123');

  // resetAll 方法
  await limiter.resetAll();

  // middleware 方法
  const middleware = limiter.middleware();
  // middleware 返回类型应该兼容 Express/Koa
}

// ========== 测试场景 12: MemoryStore ==========
const memStore = new MemoryStore();
const limiter11 = new RateLimiter({
  store: memStore,
});

// ========== 测试场景 13: 完整的 Egg.js 风格配置 ==========
interface EggContext {
  app: {
    redis?: RedisClient;
  };
}

function createLimiter(ctx: EggContext) {
  return new RateLimiter({
    store: ctx.app.redis
      ? new RedisStore({
          client: ctx.app.redis,
          prefix: 'rl:',
        })
      : 'memory',
    headers: true,
    windowMs: 60000,
    max: 100,
  });
}

// ========== 测试场景 14: 异步 max 函数 ==========
const limiter14 = new RateLimiter({
  max: async (req: any) => {
    const user = await Promise.resolve({ tier: 'premium' });
    return user.tier === 'premium' ? 1000 : 100;
  },
});

// ========== 测试场景 15: 异步 skip 函数 ==========
const limiter15 = new RateLimiter({
  skip: async (req: any) => {
    const isAdmin = await Promise.resolve(req.user?.role === 'admin');
    return isAdmin;
  },
});

console.log('✅ 所有类型测试通过！');
