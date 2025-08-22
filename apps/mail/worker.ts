import { createRequestHandler } from 'react-router';

declare global {
  interface CloudflareEnvironment extends Env {}
}

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnvironment;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  // @ts-ignore, virtual module
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

// 修改为自己的Sentry.io配置
const sentryUrl = `https://xxxxx`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/monitoring')) {
      const sentryRequest = new Request(sentryUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      return await fetch(sentryRequest);
    }
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<CloudflareEnvironment>;
