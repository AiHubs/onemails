import type { env } from 'cloudflare:workers';
import type { Autumn } from 'autumn-js';
import type { Auth } from './lib/auth';
import type { DB } from '@zero/db';

export type HonoVariables = {
  auth: Auth;
  session: Awaited<ReturnType<Auth['api']['getSession']>>;
  db: DB;
  autumn: Autumn;
};

export type HonoContext = { Variables: HonoVariables; Bindings: typeof env };
