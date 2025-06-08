
export interface SystemSettings {
  id?: string;
  systemName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  webhookUrl: string;
  messageWebhookUrl: string;
  journeyWebhookUrl: string;
}

export const statusOptions = [
  { value: 'Pendente', label: 'Pendente', color: '#e11d48' },
  { value: 'Follow-up', label: 'Follow-up', color: '#f59e0b' },
  { value: 'Qualificado', label: 'Qualificado', color: '#3b82f6' },
  { value: 'Proposta', label: 'Proposta', color: '#8b5cf6' },
  { value: 'Negociação', label: 'Negociação', color: '#06b6d4' },
  { value: 'Fechado', label: 'Fechado', color: '#10b981' },
  { value: 'Perdido', label: 'Perdido', color: '#64748b' }
];
