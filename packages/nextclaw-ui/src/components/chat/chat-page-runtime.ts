import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ChatRunView, SessionEventView } from '@/api/types';
import type { ChatModelOption } from '@/components/chat/chat-input.types';
import { useChatRuns } from '@/hooks/useConfig';
import { buildActiveRunBySessionKey, buildSessionRunStatusByKey } from '@/lib/session-run-status';

export type ChatMainPanelView = 'chat' | 'cron' | 'skills';

function hasRenderableMessage(message: SessionEventView['message'] | undefined): boolean {
  if (!message) {
    return false;
  }
  if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
    return true;
  }
  if (typeof message.reasoning_content === 'string' && message.reasoning_content.trim()) {
    return true;
  }
  const content = message.content;
  if (typeof content === 'string') {
    return content.trim().length > 0;
  }
  if (Array.isArray(content)) {
    return content.some((item) => {
      if (typeof item === 'string') {
        return item.trim().length > 0;
      }
      if (item && typeof item === 'object') {
        const text = (item as { text?: unknown }).text;
        const nested = (item as { content?: unknown }).content;
        if (typeof text === 'string' && text.trim().length > 0) {
          return true;
        }
        if (typeof nested === 'string' && nested.trim().length > 0) {
          return true;
        }
      }
      return false;
    });
  }
  return content != null;
}

export function useSyncSelectedModel(params: {
  modelOptions: ChatModelOption[];
  selectedSessionPreferredModel?: string;
  defaultModel?: string;
  setSelectedModel: Dispatch<SetStateAction<string>>;
}) {
  const { modelOptions, selectedSessionPreferredModel, defaultModel, setSelectedModel } = params;
  useEffect(() => {
    if (modelOptions.length === 0) {
      setSelectedModel('');
      return;
    }
    setSelectedModel((prev) => {
      if (modelOptions.some((option) => option.value === prev)) {
        return prev;
      }
      const sessionPreferred = selectedSessionPreferredModel?.trim();
      if (sessionPreferred && modelOptions.some((option) => option.value === sessionPreferred)) {
        return sessionPreferred;
      }
      const fallback = defaultModel?.trim();
      if (fallback && modelOptions.some((option) => option.value === fallback)) {
        return fallback;
      }
      return modelOptions[0]?.value ?? '';
    });
  }, [defaultModel, modelOptions, selectedSessionPreferredModel, setSelectedModel]);
}

export function useMergedEvents(params: {
  historyEvents: SessionEventView[];
  optimisticUserEvent: SessionEventView | null;
  streamingSessionEvents: SessionEventView[];
  streamingAssistantText: string;
  streamingAssistantTimestamp: string | null;
}) {
  return useMemo(() => {
    const bySeq = new Map<number, SessionEventView>();
    const mergeEventBySeq = (incoming: SessionEventView) => {
      if (!Number.isFinite(incoming.seq)) {
        return;
      }
      const current = bySeq.get(incoming.seq);
      if (!current) {
        bySeq.set(incoming.seq, incoming);
        return;
      }
      const currentHasRenderableMessage = hasRenderableMessage(current.message);
      const incomingHasRenderableMessage = hasRenderableMessage(incoming.message);
      // Preserve richer message event when same-seq incoming event has no renderable content.
      if (currentHasRenderableMessage && !incomingHasRenderableMessage) {
        return;
      }
      bySeq.set(incoming.seq, incoming);
    };
    const append = (event: SessionEventView) => {
      mergeEventBySeq(event);
    };

    params.historyEvents.forEach(append);
    if (params.optimisticUserEvent) {
      append(params.optimisticUserEvent);
    }
    params.streamingSessionEvents.forEach((event) => {
      // Do not let backend streamed user events affect user-message rendering.
      if (event.message?.role === 'user' && event.type !== 'message.user.optimistic') {
        return;
      }
      append(event);
    });

    const next = [...bySeq.values()].sort((left, right) => left.seq - right.seq);
    if (params.streamingAssistantText.trim()) {
      const maxSeq = next.reduce((max, event) => (event.seq > max ? event.seq : max), 0);
      next.push({
        seq: maxSeq + 1,
        type: 'stream.assistant_delta',
        timestamp: params.streamingAssistantTimestamp ?? new Date().toISOString(),
        message: {
          role: 'assistant',
          content: params.streamingAssistantText,
          timestamp: params.streamingAssistantTimestamp ?? new Date().toISOString()
        }
      });
    }
    return next;
  }, [
    params.historyEvents,
    params.optimisticUserEvent,
    params.streamingAssistantText,
    params.streamingAssistantTimestamp,
    params.streamingSessionEvents
  ]);
}

export function useSessionRunStatus(params: {
  view: ChatMainPanelView;
  selectedSessionKey: string | null;
  activeBackendRunId: string | null;
  isLocallyRunning: boolean;
  resumeRun: (run: ChatRunView) => Promise<void>;
}) {
  const { view, selectedSessionKey, activeBackendRunId, isLocallyRunning, resumeRun } = params;
  const [suppressedSessionState, setSuppressedSessionState] = useState<{
    sessionKey: string;
    expireAt: number;
  } | null>(null);
  const wasLocallyRunningRef = useRef(false);

  const sessionStatusRunsQuery = useChatRuns(
    view === 'chat'
      ? {
          states: ['queued', 'running'],
          limit: 200,
          syncActiveStates: true,
          isLocallyRunning
        }
      : undefined
  );
  const activeRunBySessionKey = useMemo(
    () => buildActiveRunBySessionKey(sessionStatusRunsQuery.data?.runs ?? []),
    [sessionStatusRunsQuery.data?.runs]
  );
  const sessionRunStatusByKey = useMemo(() => {
    const next = buildSessionRunStatusByKey(activeRunBySessionKey);
    if (suppressedSessionState) {
      next.delete(suppressedSessionState.sessionKey);
    }
    return next;
  }, [activeRunBySessionKey, suppressedSessionState]);
  const activeRun = useMemo(() => {
    if (!selectedSessionKey) {
      return null;
    }
    return activeRunBySessionKey.get(selectedSessionKey) ?? null;
  }, [activeRunBySessionKey, selectedSessionKey]);

  useEffect(() => {
    if (view !== 'chat' || !selectedSessionKey || !activeRun) {
      return;
    }
    if (activeBackendRunId === activeRun.runId) {
      return;
    }
    void resumeRun(activeRun);
  }, [activeBackendRunId, activeRun, resumeRun, selectedSessionKey, view]);

  useEffect(() => {
    const wasRunning = wasLocallyRunningRef.current;
    wasLocallyRunningRef.current = isLocallyRunning;
    if (isLocallyRunning) {
      return;
    }
    if (wasRunning && selectedSessionKey) {
      setSuppressedSessionState({
        sessionKey: selectedSessionKey,
        expireAt: Date.now() + 2_500
      });
    }
  }, [isLocallyRunning, selectedSessionKey]);

  useEffect(() => {
    if (!suppressedSessionState) {
      return;
    }
    const stillActive = activeRunBySessionKey.has(suppressedSessionState.sessionKey);
    if (!stillActive) {
      setSuppressedSessionState(null);
      return;
    }
    const remaining = suppressedSessionState.expireAt - Date.now();
    if (remaining <= 0) {
      setSuppressedSessionState(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setSuppressedSessionState(null);
    }, remaining);
    return () => {
      window.clearTimeout(timer);
    };
  }, [activeRunBySessionKey, suppressedSessionState]);

  return { sessionRunStatusByKey };
}
