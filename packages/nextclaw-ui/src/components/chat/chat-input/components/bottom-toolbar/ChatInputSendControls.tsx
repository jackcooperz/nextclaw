import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { t } from '@/lib/i18n';
import { Send, Square } from 'lucide-react';

type ChatInputSendControlsProps = {
  sendError?: string | null;
  draft: string;
  hasModelOptions: boolean;
  sessionTypeUnavailable: boolean;
  isSending: boolean;
  canStopGeneration: boolean;
  resolvedStopHint: string;
  onSend: () => Promise<void> | void;
  onStop: () => Promise<void> | void;
};

export function ChatInputSendControls(props: ChatInputSendControlsProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      {props.sendError?.trim() && <div className="max-w-[420px] text-right text-[11px] text-red-600">{props.sendError}</div>}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="rounded-lg"
          onClick={() => void props.onSend()}
          disabled={props.draft.trim().length === 0 || !props.hasModelOptions || props.sessionTypeUnavailable}
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {t('chatSend')}
        </Button>
        {props.isSending &&
          (props.canStopGeneration ? (
            <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => void props.onStop()}>
              <Square className="h-3.5 w-3.5 mr-1.5" />
              {t('chatStop')}
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="sm" className="rounded-lg" disabled>
                      <Square className="h-3.5 w-3.5 mr-1.5" />
                      {t('chatStop')}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{props.resolvedStopHint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
      </div>
    </div>
  );
}
