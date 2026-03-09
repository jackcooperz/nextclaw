import { t } from '@/lib/i18n';
import { ArrowUp, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';

type ChatInputQueueSectionProps = {
  queuedCount: number;
  queuedMessages: Array<{ id: number; message: string }>;
  isQueueExpanded: boolean;
  onToggleQueueExpanded: () => void;
  onEditQueuedMessage: (messageId: number, message: string) => void;
  onPromoteQueuedMessage: (messageId: number) => void;
  onRemoveQueuedMessage: (messageId: number) => void;
};

function previewQueuedMessage(message: string): string {
  const compact = message.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return '-';
  }
  return compact.length > 180 ? `${compact.slice(0, 180)}…` : compact;
}

export function ChatInputQueueSection(props: ChatInputQueueSectionProps) {
  if (props.queuedMessages.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200/80 bg-gray-50/70 px-3 py-2">
      <button
        type="button"
        onClick={props.onToggleQueueExpanded}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800"
      >
        {props.isQueueExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <span>
          {t('chatQueuedHintPrefix')} {props.queuedCount} {t('chatQueuedHintSuffix')}
        </span>
      </button>
      {props.isQueueExpanded && (
        <div className="mt-2 space-y-1.5">
          {props.queuedMessages.map((item, index) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2"
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{previewQueuedMessage(item.message)}</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => props.onEditQueuedMessage(item.id, item.message)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title={t('edit')}
                  aria-label={t('edit')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => props.onPromoteQueuedMessage(item.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:text-gray-200"
                  title={t('chatQueueMoveFirst')}
                  aria-label={t('chatQueueMoveFirst')}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => props.onRemoveQueuedMessage(item.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-destructive"
                  title={t('delete')}
                  aria-label={t('delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
