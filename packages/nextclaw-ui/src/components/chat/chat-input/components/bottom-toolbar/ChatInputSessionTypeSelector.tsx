import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';

type ChatInputSessionTypeSelectorProps = {
  shouldShowSessionTypeSelector: boolean;
  selectedSessionType?: string;
  selectedSessionTypeOption: { value: string; label: string } | null;
  sessionTypeOptions: Array<{ value: string; label: string }>;
  onSelectedSessionTypeChange: (value: string) => void;
  canEditSessionType: boolean;
};

export function ChatInputSessionTypeSelector(props: ChatInputSessionTypeSelectorProps) {
  if (!props.shouldShowSessionTypeSelector) {
    return null;
  }

  return (
    <Select
      value={props.selectedSessionType}
      onValueChange={props.onSelectedSessionTypeChange}
      disabled={!props.canEditSessionType}
    >
      <SelectTrigger className="h-8 w-auto min-w-[140px] rounded-lg border-0 bg-transparent shadow-none text-xs font-medium text-gray-600 hover:bg-gray-100 focus:ring-0 px-3">
        {props.selectedSessionTypeOption ? (
          <span className="truncate text-xs font-semibold text-gray-700">{props.selectedSessionTypeOption.label}</span>
        ) : (
          <SelectValue placeholder={t('chatSessionTypeLabel')} />
        )}
      </SelectTrigger>
      <SelectContent className="w-[220px]">
        {props.sessionTypeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="py-2">
            <span className="truncate text-xs font-semibold text-gray-800">{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
