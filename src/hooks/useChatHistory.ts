import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatHistory, deleteChatHistory } from '../api/chat';
import type { FlowMode } from '../types/api';

export function useChatHistory(flow: FlowMode) {
  return useQuery({
    queryKey: ['chat', flow],
    queryFn: () => getChatHistory(flow).then((r) => r.data),
    staleTime: 0,
  });
}

export function useClearChatHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flow: FlowMode) => deleteChatHistory(flow),
    onSuccess: (_, flow) => qc.invalidateQueries({ queryKey: ['chat', flow] }),
  });
}
