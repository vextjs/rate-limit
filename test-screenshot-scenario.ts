/**
 * 测试截图中的具体场景
 */

import { RateLimiter, RedisStore, RedisClient } from './index';

// 模拟 Egg.js 的 ctx 类型
interface Context {
  app: {
    redis?: RedisClient | any; // 实际使用时可能是 any 类型
  };
}

// 测试场景：截图中的代码
function testScreenshotScenario() {
  const ctx: Context = {
    app: {
      redis: undefined as any, // 模拟实际情况
    },
  };

  const enableHeaders = true;

  // 这是截图中的代码
  const limiter = new RateLimiter({
    store: ctx.app.redis ? new RedisStore({
      client: ctx.app.redis, // 这里应该不报错
      prefix: '',
    }) : 'memory',
    headers: enableHeaders,
  });

  console.log('✅ 截图场景类型检查通过');
}

testScreenshotScenario();
