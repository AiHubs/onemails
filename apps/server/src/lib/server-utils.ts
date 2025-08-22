import { connection, user } from '@zero/db/schema';
import { getContext } from 'hono/context-storage';
import type { HonoContext } from '../ctx';
import { createDriver } from './driver';
import { and, eq } from 'drizzle-orm';

export const getActiveConnection = async () => {
  const c = getContext<HonoContext>();
  const { session, db } = c.var;
  if (!session?.user) throw new Error('Session Not Found');

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (userData?.defaultConnectionId) {
    const activeConnection = await db.query.connection.findFirst({
      where: and(
        eq(connection.userId, session.user.id),
        eq(connection.id, userData.defaultConnectionId),
      ),
    });
    if (activeConnection) return activeConnection;
  }

  const firstConnection = await db.query.connection.findFirst({
    where: and(eq(connection.userId, session.user.id)),
  });
  if (!firstConnection) {
    console.error(`No connections found for user ${session.user.id}`);
    throw new Error('No connections found for user');
  }

  return firstConnection;
};

export const connectionToDriver = (activeConnection: typeof connection.$inferSelect) => {
  if (!activeConnection.accessToken || !activeConnection.refreshToken) {
    throw new Error('Invalid connection');
  }

  return createDriver(activeConnection.providerId, {
    auth: {
      userId: activeConnection.userId,
      accessToken: activeConnection.accessToken,
      refreshToken: activeConnection.refreshToken,
      email: activeConnection.email,
    },
  });
};
