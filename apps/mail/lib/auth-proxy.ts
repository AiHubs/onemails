import { customSessionClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/client';
import type { Auth } from '@zero/server/auth';

const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_BACKEND_URL,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [customSessionClient<Auth>()],
});

export const authProxy = {
  api: {
    getSession: async ({ headers }: { headers: Headers }) => {
      const session = await authClient.getSession({
        fetchOptions: { headers, credentials: 'include' },
      });
      if (session.error) {
        console.error(`Failed to get session: ${session.error}`);
        return null;
      }
      return session.data;
    },
  },
};
