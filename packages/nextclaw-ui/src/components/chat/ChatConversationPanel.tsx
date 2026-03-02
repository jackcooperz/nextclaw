import type { MutableRefObject } from 'react';
import type { SessionEventView } from '@/api/types';
import { Button } from '@/components/ui/button';
import { ChatThread } from '@/components/chat/ChatThread';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { MessageSquareText, Send, Trash2 } from 'lucide-react';

type ChatConversationPanelProps = {
  agentOptions: string[];
  selectedAgentId: string;
  onSelectedAgentIdChange: (value: string) => void;
  selectedSessionKey: string | null;
  canDeleteSession: boolean;
  isDeletePending: boolean;
  onDeleteSession: () => void;
  threadRef: MutableRefObject<HTMLDivElement | null>;
  onThreadScroll: () => void;
  isHistoryLoading: boolean;
  mergedEvents: SessionEventView[];
  isSending: boolean;
  isAwaitingAssistantOutput: boolean;
  streamingAssistantText: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => Promise<void> | void;
  queuedCount: number;
};

export function ChatConversationPanel({
  agentOptions,
  selectedAgentId,
  onSelectedAgentIdChange,
  selectedSessionKey,
  canDeleteSession,
  isDeletePending,
  onDeleteSession,
  threadRef,
  onThreadScroll,
  isHistoryLoading,
  mergedEvents,
  isSending,
  isAwaitingAssistantOutput,
  streamingAssistantText,
  draft,
  onDraftChange,
  onSend,
  queuedCount
}: ChatConversationPanelProps) {
  const showHistoryLoading =
    isHistoryLoading &&
    mergedEvents.length === 0 &&
    !isSending &&
    !isAwaitingAssistantOutput &&
    !streamingAssistantText.trim();

  return (
    <section className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50/60 to-white shadow-card flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)_auto] items-end">
          <div className="min-w-0">
            <div className="text-[11px] text-gray-500 mb-1">{t('chatAgentLabel')}</div>
            <Select value={selectedAgentId} onValueChange={onSelectedAgentIdChange}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder={t('chatSelectAgent')} />
              </SelectTrigger>
              <SelectContent>
                {agentOptions.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <div className="text-[11px] text-gray-500 mb-1">{t('chatSessionLabel')}</div>
            <div className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 flex items-center truncate">
              {selectedSessionKey ?? t('chatNoSession')}
            </div>
          </div>

          <Button
            variant="outline"
            className="rounded-lg"
            onClick={onDeleteSession}
            disabled={!canDeleteSession || isDeletePending}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {t('chatDeleteSession')}
          </Button>
        </div>
      </div>

      <div ref={threadRef} onScroll={onThreadScroll} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 py-5">
        {!selectedSessionKey ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageSquareText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <div className="text-sm font-medium">{t('chatNoSession')}</div>
              <div className="text-xs mt-1">{t('chatNoSessionHint')}</div>
            </div>
          </div>
        ) : showHistoryLoading ? (
          <div className="text-sm text-gray-500">{t('chatHistoryLoading')}</div>
        ) : mergedEvents.length === 0 ? (
          <div className="text-sm text-gray-500">{t('chatNoMessages')}</div>
        ) : (
          <ChatThread events={mergedEvents} isSending={isSending && isAwaitingAssistantOutput} />
        )}
      </div>

      <div className="border-t border-gray-200 bg-white p-4">
        <div className="rounded-xl border border-gray-200 bg-white p-2">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void onSend();
              }
            }}
            placeholder={t('chatInputPlaceholder')}
            className="w-full min-h-[68px] max-h-[220px] resize-y bg-transparent outline-none text-sm px-2 py-1.5 text-gray-800 placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="text-[11px] text-gray-400">
              {isSending && queuedCount > 0
                ? `${t('chatQueuedHintPrefix')} ${queuedCount} ${t('chatQueuedHintSuffix')}`
                : t('chatInputHint')}
            </div>
            <Button
              size="sm"
              className="rounded-lg"
              onClick={() => void onSend()}
              disabled={draft.trim().length === 0}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {isSending ? t('chatQueueSend') : t('chatSend')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
