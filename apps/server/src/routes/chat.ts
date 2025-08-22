import { AiChatPrompt, GmailSearchAssistantSystemPrompt } from '../lib/prompts';
import { connectionToDriver, getActiveConnection } from '../lib/server-utils';
import { streamText, generateObject, tool, generateText } from 'ai';
import { publicTools, tools } from './agent/tools';
import { getContext } from 'hono/context-storage';
import { connection } from '@zero/db/schema';
import type { HonoContext } from '../ctx';
import { openai } from '@ai-sdk/openai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const buildGmailSearchQuery = tool({
  description: 'Build a Gmail search query',
  parameters: z.object({
    query: z.string().describe('The search query to build, provided in natural language'),
  }),
  execute: async ({ query }) => {
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: GmailSearchAssistantSystemPrompt(),
      prompt: query,
      schema: z.object({
        query: z.string(),
      }),
    });
    return result.object;
  },
});

export const chatHandler = async () => {
  const c = getContext<HonoContext>();

  const { session, autumn } = c.var;
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  console.log('Checking chat permissions for user:', session.user.id);
  const canSendMessages = await autumn.check({
    feature_id: 'chat-messages',
    customer_id: session.user.id,
  });
  console.log('Autumn check result:', JSON.stringify(canSendMessages, null, 2));

  if (!canSendMessages.data) {
    console.log('No data returned from Autumn check');
    return c.json({ error: 'Insufficient permissions' }, 403);
  }

  if (canSendMessages.data.unlimited) {
    console.log('User has unlimited access');
  } else if (!canSendMessages.data.balance) {
    console.log('No balance and not unlimited');
    return c.json({ error: 'Insufficient plan quota' }, 403);
  } else if (canSendMessages.data.balance <= 0) {
    console.log('Balance is 0 or less');
    return c.json({ error: 'Insufficient plan balance' }, 403);
  }

  const _conn = await getActiveConnection().catch((err) => {
    console.error('Error in getActiveConnection:', err);
    throw c.json({ error: 'Failed to get active connection' }, 500);
  });

  const driver = connectionToDriver(_conn);

  const { messages, threadId, currentFolder, currentFilter } = await c.req
    .json()
    .catch((err: Error) => {
      console.error('Error parsing JSON:', err);
      throw c.json({ error: 'Failed to parse request body' }, 400);
    });

  const result = streamText({
    model: openai('gpt-4o'),
    system: AiChatPrompt(threadId, currentFolder, currentFilter),
    messages,
    tools: {
      ...tools(driver, _conn.id),
      buildGmailSearchQuery,
    },
    onError: (error) => {
      console.error('Error in streamText:', error);
      //   throw c.json({ error: 'Failed to stream text' }, 500);
    },
  });

  return result.toDataStreamResponse();
};

export const publicChatHandler = async () => {
  const c = getContext<HonoContext>();
  const { message } = await c.req.json<{ message: string; query: string }>();
  const _connection = await c.var.db.query.connection.findFirst({
    where: eq(connection.email, 'test@test.com'),
  });
  if (!_connection) {
    return c.json({ error: 'Connection not found' }, 404);
  }
  const driver = connectionToDriver(_connection);
  const result = await generateText({
    model: openai('gpt-4o'),
    system: AiChatPrompt('', '', ''),
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
    tools: { ...publicTools(driver, _connection.id), buildGmailSearchQuery },
  });

  return c.json({ response: result.text, toolResults: result.toolResults.map((r) => r.result) });
};
