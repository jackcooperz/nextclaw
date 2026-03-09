import type { ChatModelOption } from '@/components/chat/chat-input.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';

type ChatInputModelSelectorProps = {
  modelOptions: ChatModelOption[];
  selectedModel: string;
  selectedModelOption?: ChatModelOption;
  onSelectedModelChange: (value: string) => void;
  isModelOptionsLoading: boolean;
  hasModelOptions: boolean;
};

export function ChatInputModelSelector(props: ChatInputModelSelectorProps) {
  return (
    <Select
      value={props.hasModelOptions ? props.selectedModel : undefined}
      onValueChange={props.onSelectedModelChange}
      disabled={!props.hasModelOptions}
    >
      <SelectTrigger className="h-8 w-auto min-w-[220px] rounded-lg border-0 bg-transparent shadow-none text-xs font-medium text-gray-600 hover:bg-gray-100 focus:ring-0 px-3">
        {props.selectedModelOption ? (
          <div className="flex min-w-0 items-center gap-2 text-left">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate text-xs font-semibold text-gray-700">
              {props.selectedModelOption.providerLabel}/{props.selectedModelOption.modelLabel}
            </span>
          </div>
        ) : props.isModelOptionsLoading ? (
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
        ) : (
          <SelectValue placeholder={t('chatSelectModel')} />
        )}
      </SelectTrigger>
      <SelectContent className="w-[320px]">
        {props.modelOptions.length === 0 &&
          (props.isModelOptionsLoading ? (
            <div className="space-y-2 px-3 py-2">
              <div className="h-3 w-36 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-gray-500">{t('chatModelNoOptions')}</div>
          ))}
        {props.modelOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="py-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-xs font-semibold text-gray-800">{option.modelLabel}</span>
              <span className="truncate text-[11px] text-gray-500">{option.providerLabel}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
