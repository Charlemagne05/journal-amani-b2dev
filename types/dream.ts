export type DreamAnalysis = {
  people: string[];
  topics: string[];
};

export type DreamType = 'ordinary' | 'lucid' | 'nightmare' | 'other';

export type DreamTone = 'positive' | 'neutral' | 'negative';

export type DreamEntry = {
  id: string;
  text: string;
  dreamDateTime?: string;
  dreamType: DreamType;
  tone?: DreamTone;
  emotionsBefore?: string;
  emotionsAfter?: string;
  characters?: string[];
  location?: string;
  emotionalIntensity?: number;
  clarity?: number;
  tags?: string[];
  sleepQuality?: number;
  personalMeaning?: string;
  createdAt: string;
  analysis?: DreamAnalysis;
  analysisError?: string;
};
