import * as Sentry from '@sentry/react';

if (!import.meta.env.DEV) {
  Sentry.init({
    // 更改为自己的sentry.io账号配置，onemails
    dsn: 'https://xxxxx',
    tunnel: '/monitoring',
    integrations: [Sentry.replayIntegration()],
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
  });
}
