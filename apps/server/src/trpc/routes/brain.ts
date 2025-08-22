import { disableBrainFunction, enableBrainFunction, getPrompts } from '../../lib/brain';
import { activeConnectionProcedure, router } from '../trpc';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

/**
 * Gets the current connection limit for a given connection ID
 * @param connectionId The connection ID to check
 * @returns Promise<number> The current limit
 */
export const getConnectionLimit = async (connectionId: string): Promise<number> => {
  try {
    const limit = await env.connection_limits.get(connectionId);
    return limit ? Number(limit) : Number(env.DEFAULT_BRAIN_LIMIT);
  } catch (error) {
    console.error(`[GET_CONNECTION_LIMIT] Error getting limit for ${connectionId}:`, error);
    throw error;
  }
};

const labelSchema = z.object({
  name: z.string(),
  usecase: z.string(),
});

const labelsSchema = z.array(labelSchema);

export const brainRouter = router({
  enableBrain: activeConnectionProcedure
    .input(
      z.object({
        connection: z
          .object({
            id: z.string(),
            providerId: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let { connection } = input;
      if (!connection) connection = ctx.activeConnection;
      return await enableBrainFunction(connection);
    }),
  disableBrain: activeConnectionProcedure
    .input(
      z.object({
        connection: z
          .object({
            id: z.string(),
            providerId: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let { connection } = input;
      if (!connection) connection = ctx.activeConnection;
      return await disableBrainFunction(connection);
    }),

  generateSummary: activeConnectionProcedure
    .input(
      z.object({
        threadId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { threadId } = input;
      const response = await env.VECTORIZE.getByIds([threadId]);
      if (response.length && response?.[0]?.metadata?.['content']) {
        const content = response[0].metadata['content'] as string;
        const shortResponse = await env.AI.run('@cf/facebook/bart-large-cnn', {
          input_text: content,
        });
        return {
          data: {
            short: shortResponse.summary,
          },
        };
      }
      return null;
    }),
  getState: activeConnectionProcedure.query(async ({ ctx }) => {
    const connection = ctx.activeConnection;
    const state = await env.subscribed_accounts.get(connection.id);
    if (!state || state === 'pending') return { enabled: false };
    const limit = await getConnectionLimit(connection.id);
    return { limit, enabled: true };
  }),
  getLabels: activeConnectionProcedure
    .output(
      z.array(
        z.object({
          name: z.string(),
          usecase: z.string(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const connection = ctx.activeConnection;
      const labels = await env.connection_labels.get(connection.id);
      try {
        return labels ? (JSON.parse(labels) as z.infer<typeof labelsSchema>) : [];
      } catch (error) {
        console.error(`[GET_LABELS] Error parsing labels for ${connection.id}:`, error);
        return [];
      }
    }),
  getPrompts: activeConnectionProcedure.query(async ({ ctx }) => {
    const connection = ctx.activeConnection;
    return await getPrompts({ connectionId: connection.id });
  }),
  updateLabels: activeConnectionProcedure
    .input(
      z.object({
        labels: labelsSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const connection = ctx.activeConnection;
      console.log(input.labels);

      const labels = labelsSchema.parse(input.labels);
      console.log(labels);

      await env.connection_labels.put(connection.id, JSON.stringify(labels));
      return { success: true };
    }),
});
