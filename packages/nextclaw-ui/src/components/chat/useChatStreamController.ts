import { useEffect, useSyncExternalStore } from 'react';
import { ChatStreamManager } from '@/components/chat/managers/chat-stream.manager';
import type { UseChatStreamControllerParams } from './chat-stream/types';

export type { QueuedChatMessageView } from './chat-stream/types';

export function useChatStreamController(
  params: UseChatStreamControllerParams,
  manager: ChatStreamManager
) {

  useEffect(() => {
    manager.updateParams(params);
  }, [manager, params]);

  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, [manager]);

  const state = useSyncExternalStore(manager.subscribe, manager.getSnapshot, manager.getSnapshot);

  return {
    optimisticUserEvent: state.optimisticUserEvent,
    streamingSessionEvents: state.streamingSessionEvents,
    streamingAssistantText: state.streamingAssistantText,
    streamingAssistantTimestamp: state.streamingAssistantTimestamp,
    isSending: state.isSending,
    isAwaitingAssistantOutput: state.isAwaitingAssistantOutput,
    queuedMessages: state.queuedMessages.map((item) => ({ id: item.id, message: item.message })),
    queuedCount: state.queuedMessages.length,
    canStopCurrentRun: state.canStopCurrentRun,
    stopDisabledReason: state.stopDisabledReason,
    lastSendError: state.lastSendError,
    activeBackendRunId: state.activeBackendRunId
  };
}
