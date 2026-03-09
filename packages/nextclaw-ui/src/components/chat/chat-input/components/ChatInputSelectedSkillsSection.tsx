import { X } from 'lucide-react';

type ChatInputSelectedSkillsSectionProps = {
  records: Array<{ spec: string; label: string }>;
  selectedSkills: string[];
  onSelectedSkillsChange: (next: string[]) => void;
};

export function ChatInputSelectedSkillsSection(props: ChatInputSelectedSkillsSectionProps) {
  if (props.records.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-2">
      <div className="flex flex-wrap items-center gap-2">
        {props.records.map((record) => (
          <button
            key={record.spec}
            type="button"
            onClick={() => props.onSelectedSkillsChange(props.selectedSkills.filter((skill) => skill !== record.spec))}
            className="inline-flex max-w-[200px] items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            <span className="truncate">{record.label}</span>
            <X className="h-3 w-3 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
