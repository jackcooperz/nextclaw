export type ChatModelOption = {
  value: string;
  modelLabel: string;
  providerLabel: string;
};

export type ChatInputBarSlashItem = {
  kind: 'skill';
  key: string;
  title: string;
  subtitle: string;
  description: string;
  detailLines: string[];
  skillSpec?: string;
};
