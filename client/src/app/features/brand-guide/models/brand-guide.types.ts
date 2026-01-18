export interface BrandGuideFormData {
  name: string;
  colors: string[];
  tone: string;
  coreMessage: string;
}

export const DEFAULT_COLORS: string[] = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export const CHAR_LIMITS = {
  name: 100,
  tone: 500,
  coreMessage: 1000,
} as const;

export const createDefaultBrandGuide = (): BrandGuideFormData => ({
  name: '',
  colors: [...DEFAULT_COLORS],
  tone: '',
  coreMessage: '',
});
