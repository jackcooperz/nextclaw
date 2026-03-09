import { t } from '@/lib/i18n';

type ChatInputModelStateHintProps = {
  isModelOptionsLoading: boolean;
  isModelOptionsEmpty: boolean;
  onGoToProviders: () => void;
};

export function ChatInputModelStateHint(props: ChatInputModelStateHintProps) {
  if (!props.isModelOptionsLoading && !props.isModelOptionsEmpty) {
    return null;
  }

  if (props.isModelOptionsLoading) {
    return (
      <div className="px-4 pb-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span className="h-3 w-28 animate-pulse rounded bg-gray-200" />
          <span className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-2">
      <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
        <span>{t('chatModelNoOptions')}</span>
        <button
          type="button"
          onClick={props.onGoToProviders}
          className="font-semibold text-amber-900 underline-offset-2 hover:underline"
        >
          {t('chatGoConfigureProvider')}
        </button>
      </div>
    </div>
  );
}
