
export interface JourneyMessage {
  id: string;
  title: string;
  content: string;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  stage: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  order: number;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color?: string;
  order?: number;
  description?: string;
}
