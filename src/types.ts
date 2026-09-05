export type Tone = 'formal' | 'friendly' | 'direct' | 'detailed';

export interface RewriteChoice {
  id: string;
  versionNumber: number;
  tone: Tone;
  label: string; // e.g. "Version 1: Formal"
  rewrittenText: string;
  originalText: string;
  diffMarkdown: string;
  tintColor: any;
  icon: any;
}
