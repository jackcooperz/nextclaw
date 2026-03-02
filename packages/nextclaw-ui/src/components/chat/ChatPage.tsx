import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SessionEntryView } from '@/api/types';
import { useConfig, useDeleteSession, useSessionHistory, useSessions } from '@/hooks/useConfig';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { Button } from '@/components/ui/button';
import { PageHeader, PageLayout } from '@/components/layout/page-layout';
import { ChatSessionsSidebar } from '@/components/chat/ChatSessionsSidebar';
import { ChatConversationPanel } from '@/components/chat/ChatConversationPanel';
import { useChatStreamController } from '@/components/chat/useChatStreamController';
import { cn } from '@/lib/utils';
import { buildFallbackEventsFromMessages } from '@/lib/chat-message';
import { t } from '@/lib/i18n';
import { Plus, RefreshCw } from 'lucide-react';

const CHAT_SESSION_STORAGE_KEY = 'nextclaw.ui.chat.activeSession';
const UNKNOWN_CHAT_CHANNEL_KEY = '__unknown_channel__';

function readStoredSessionKey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const value = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeStoredSessionKey(value: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (!value) {
      window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, value);
  } catch {
    // ignore storage errors
  }
}

function resolveAgentIdFromSessionKey(sessionKey: string): string | null {
  const match = /^agent:([^:]+):/i.exec(sessionKey.trim());
  if (!match) {
    return null;
  }
  const value = match[1]?.trim();
  return value ? value : null;
}

function buildNewSessionKey(agentId: string): string {
  const slug = Math.random().toString(36).slice(2, 8);
  return `agent:${agentId}:ui:direct:web-${Date.now().toString(36)}${slug}`;
}

function sessionDisplayName(session: SessionEntryView): string {
  if (session.label && session.label.trim()) {
    return session.label.trim();
  }
  const chunks = session.key.split(':');
  return chunks[chunks.length - 1] || session.key;
}

function resolveChannelFromSessionKey(key: string): string {
  const separator = key.indexOf(':');
  if (separator <= 0) {
    return UNKNOWN_CHAT_CHANNEL_KEY;
  }
  const channel = key.slice(0, separator).trim();
  return channel || UNKNOWN_CHAT_CHANNEL_KEY;
}

function displayChannelName(channel: string): string {
  if (channel === UNKNOWN_CHAT_CHANNEL_KEY) {
    return t('sessionsUnknownChannel');
  }
  return channel;
}

export function ChatPage() {
  const [query, setQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [draft, setDraft] = useState('');
  const [selectedSessionKey, setSelectedSessionKey] = useState<string | null>(() => readStoredSessionKey());
  const [selectedAgentId, setSelectedAgentId] = useState('main');

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const threadRef = useRef<HTMLDivElement | null>(null);
  const isUserScrollingRef = useRef(false);
  const selectedSessionKeyRef = useRef<string | null>(selectedSessionKey);

  const configQuery = useConfig();
  const sessionsQuery = useSessions({ q: query.trim() || undefined, limit: 120, activeMinutes: 0 });
  const historyQuery = useSessionHistory(selectedSessionKey, 300);
  const deleteSession = useDeleteSession();

  const agentOptions = useMemo(() => {
    const list = configQuery.data?.agents.list ?? [];
    const unique = new Set<string>(['main']);
    for (const item of list) {
      if (typeof item.id === 'string' && item.id.trim().length > 0) {
        unique.add(item.id.trim().toLowerCase());
      }
    }
    return Array.from(unique);
  }, [configQuery.data?.agents.list]);

  const sessions = useMemo(() => sessionsQuery.data?.sessions ?? [], [sessionsQuery.data?.sessions]);
  const channelOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const session of sessions) {
      unique.add(resolveChannelFromSessionKey(session.key));
    }
    return Array.from(unique).sort((a, b) => {
      if (a === UNKNOWN_CHAT_CHANNEL_KEY) return 1;
      if (b === UNKNOWN_CHAT_CHANNEL_KEY) return -1;
      return a.localeCompare(b);
    });
  }, [sessions]);
  const filteredSessions = useMemo(() => {
    if (selectedChannel === 'all') {
      return sessions;
    }
    return sessions.filter((session) => resolveChannelFromSessionKey(session.key) === selectedChannel);
  }, [selectedChannel, sessions]);
  const selectedSession = useMemo(
    () => sessions.find((session) => session.key === selectedSessionKey) ?? null,
    [selectedSessionKey, sessions]
  );

  const historyData = historyQuery.data;
  const historyMessages = historyData?.messages ?? [];
  const historyEvents =
    historyData?.events && historyData.events.length > 0
      ? historyData.events
      : buildFallbackEventsFromMessages(historyMessages);
  const nextOptimisticUserSeq = useMemo(
    () => historyEvents.reduce((max, event) => (Number.isFinite(event.seq) ? Math.max(max, event.seq) : max), 0) + 1,
    [historyEvents]
  );

  const {
    optimisticUserEvent,
    streamingSessionEvents,
    streamingAssistantText,
    streamingAssistantTimestamp,
    isSending,
    isAwaitingAssistantOutput,
    queuedCount,
    sendMessage,
    resetStreamState
  } = useChatStreamController({
    nextOptimisticUserSeq,
    selectedSessionKeyRef,
    setSelectedSessionKey,
    setDraft,
    refetchSessions: sessionsQuery.refetch,
    refetchHistory: historyQuery.refetch
  });

  const mergedEvents = useMemo(() => {
    const next = [...historyEvents];
    if (optimisticUserEvent) {
      next.push(optimisticUserEvent);
    }
    next.push(...streamingSessionEvents);
    if (streamingAssistantText.trim()) {
      const maxSeq = next.reduce((max, event) => {
        const seq = Number.isFinite(event.seq) ? event.seq : 0;
        return seq > max ? seq : max;
      }, 0);
      next.push({
        seq: maxSeq + 1,
        type: 'stream.assistant_delta',
        timestamp: streamingAssistantTimestamp ?? new Date().toISOString(),
        message: {
          role: 'assistant',
          content: streamingAssistantText,
          timestamp: streamingAssistantTimestamp ?? new Date().toISOString()
        }
      });
    }
    return next;
  }, [historyEvents, optimisticUserEvent, streamingAssistantText, streamingAssistantTimestamp, streamingSessionEvents]);

  useEffect(() => {
    if (!selectedSessionKey && filteredSessions.length > 0) {
      setSelectedSessionKey(filteredSessions[0].key);
    }
  }, [filteredSessions, selectedSessionKey]);

  useEffect(() => {
    writeStoredSessionKey(selectedSessionKey);
  }, [selectedSessionKey]);

  useEffect(() => {
    const inferred = selectedSessionKey ? resolveAgentIdFromSessionKey(selectedSessionKey) : null;
    if (!inferred) {
      return;
    }
    if (selectedAgentId !== inferred) {
      setSelectedAgentId(inferred);
    }
  }, [selectedAgentId, selectedSessionKey]);

  useEffect(() => {
    selectedSessionKeyRef.current = selectedSessionKey;
    isUserScrollingRef.current = false;
  }, [selectedSessionKey]);

  const isNearBottom = useCallback(() => {
    const element = threadRef.current;
    if (!element) return true;
    const threshold = 50;
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
  }, []);

  const handleScroll = useCallback(() => {
    if (isNearBottom()) {
      isUserScrollingRef.current = false;
    } else {
      isUserScrollingRef.current = true;
    }
  }, [isNearBottom]);

  useEffect(() => {
    const element = threadRef.current;
    if (!element || isUserScrollingRef.current) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, [mergedEvents, isSending]);

  const createNewSession = useCallback(() => {
    resetStreamState();
    const next = buildNewSessionKey(selectedAgentId);
    setSelectedSessionKey(next);
  }, [resetStreamState, selectedAgentId]);

  const handleDeleteSession = useCallback(async () => {
    if (!selectedSessionKey) {
      return;
    }
    const confirmed = await confirm({
      title: t('chatDeleteSessionConfirm'),
      variant: 'destructive',
      confirmLabel: t('delete')
    });
    if (!confirmed) {
      return;
    }
    deleteSession.mutate(
      { key: selectedSessionKey },
      {
        onSuccess: async () => {
          resetStreamState();
          setSelectedSessionKey(null);
          await sessionsQuery.refetch();
        }
      }
    );
  }, [confirm, deleteSession, resetStreamState, selectedSessionKey, sessionsQuery]);

  const handleSend = useCallback(async () => {
    const message = draft.trim();
    if (!message) {
      return;
    }

    const sessionKey = selectedSessionKey ?? buildNewSessionKey(selectedAgentId);
    if (!selectedSessionKey) {
      setSelectedSessionKey(sessionKey);
    }
    setDraft('');
    await sendMessage({
      message,
      sessionKey,
      agentId: selectedAgentId,
      restoreDraftOnError: true
    });
  }, [draft, selectedSessionKey, selectedAgentId, sendMessage]);

  return (
    <PageLayout fullHeight>
      <PageHeader
        title={t('chatPageTitle')}
        description={t('chatPageDescription')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => historyQuery.refetch()} className="rounded-lg">
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', historyQuery.isFetching && 'animate-spin')} />
              {t('chatRefresh')}
            </Button>
            <Button variant="primary" size="sm" onClick={createNewSession} className="rounded-lg">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {t('chatNewSession')}
            </Button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex gap-4 max-lg:flex-col">
        <ChatSessionsSidebar
          query={query}
          onQueryChange={setQuery}
          selectedChannel={selectedChannel}
          onSelectedChannelChange={setSelectedChannel}
          channelOptions={channelOptions}
          channelLabel={displayChannelName}
          isLoading={sessionsQuery.isLoading}
          isRefreshing={sessionsQuery.isFetching}
          sessions={filteredSessions}
          selectedSessionKey={selectedSessionKey}
          onSelectSession={setSelectedSessionKey}
          sessionTitle={sessionDisplayName}
          onRefresh={() => {
            void sessionsQuery.refetch();
          }}
          onCreateSession={createNewSession}
        />

        <ChatConversationPanel
          agentOptions={agentOptions}
          selectedAgentId={selectedAgentId}
          onSelectedAgentIdChange={setSelectedAgentId}
          selectedSessionKey={selectedSessionKey}
          canDeleteSession={Boolean(selectedSession)}
          isDeletePending={deleteSession.isPending}
          onDeleteSession={() => {
            void handleDeleteSession();
          }}
          threadRef={threadRef}
          onThreadScroll={handleScroll}
          isHistoryLoading={historyQuery.isLoading}
          mergedEvents={mergedEvents}
          isSending={isSending}
          isAwaitingAssistantOutput={isAwaitingAssistantOutput}
          streamingAssistantText={streamingAssistantText}
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
          queuedCount={queuedCount}
        />
      </div>
      <ConfirmDialog />
    </PageLayout>
  );
}
