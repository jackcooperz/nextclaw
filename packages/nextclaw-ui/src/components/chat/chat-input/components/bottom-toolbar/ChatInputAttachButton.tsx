import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { t } from '@/lib/i18n';
import { Paperclip } from 'lucide-react';

export function ChatInputAttachButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{t('chatInputAttachComingSoon')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
