import type { SessionEntryView } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDateTime, t } from '@/lib/i18n';
import { MessageSquareText, Plus, RefreshCw, Search } from 'lucide-react';

type ChatSessionsSidebarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  selectedChannel: string;
  onSelectedChannelChange: (value: string) => void;
  channelOptions: string[];
  channelLabel: (channel: string) => string;
  isLoading: boolean;
  isRefreshing: boolean;
  sessions: SessionEntryView[];
  selectedSessionKey: string | null;
  onSelectSession: (key: string) => void;
  sessionTitle: (session: SessionEntryView) => string;
  onRefresh: () => void;
  onCreateSession: () => void;
};

export function ChatSessionsSidebar(props: ChatSessionsSidebarProps) {
  return (
    <aside className="w-[320px] max-lg:w-full shrink-0 rounded-2xl border border-gray-200 bg-white shadow-card flex flex-col min-h-0">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-gray-400" />
          <Input
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={t('chatSearchSessionPlaceholder')}
            className="pl-8 h-9 rounded-lg text-xs"
          />
        </div>
        <Select value={props.selectedChannel} onValueChange={props.onSelectedChannelChange}>
          <SelectTrigger className="h-9 rounded-lg text-xs">
            <SelectValue placeholder={t('sessionsAllChannels')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('sessionsAllChannels')}</SelectItem>
            {props.channelOptions.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {props.channelLabel(channel)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={props.onRefresh}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', props.isRefreshing && 'animate-spin')} />
            {t('chatRefresh')}
          </Button>
          <Button variant="subtle" size="sm" className="rounded-lg" onClick={props.onCreateSession}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('chatNewSession')}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
        {props.isLoading ? (
          <div className="text-sm text-gray-500 p-4">{t('sessionsLoading')}</div>
        ) : props.sessions.length === 0 ? (
          <div className="p-5 m-2 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500">
            <MessageSquareText className="h-7 w-7 mx-auto mb-2 text-gray-300" />
            {t('sessionsEmpty')}
          </div>
        ) : (
          <div className="space-y-1">
            {props.sessions.map((session) => {
              const active = props.selectedSessionKey === session.key;
              return (
                <button
                  key={session.key}
                  onClick={() => props.onSelectSession(session.key)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2.5 text-left transition-all',
                    active
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="text-sm font-semibold text-gray-900 truncate">{props.sessionTitle(session)}</div>
                  <div className="mt-1 text-[11px] text-gray-500 truncate">{session.key}</div>
                  <div className="mt-1 text-[11px] text-gray-400">
                    {session.messageCount} · {formatDateTime(session.updatedAt)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
