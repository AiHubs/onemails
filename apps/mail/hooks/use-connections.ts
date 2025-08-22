import { useTRPC } from '@/providers/query-provider';
import { useQuery } from '@tanstack/react-query';

export const useConnections = () => {
  const trpc = useTRPC();
  const connectionsQuery = useQuery(trpc.connections.list.queryOptions(void 0));
  return connectionsQuery;
};

export const useActiveConnection = () => {
  const trpc = useTRPC();
  const connectionsQuery = useQuery(trpc.connections.getDefault.queryOptions(void 0));
  return connectionsQuery;
};
