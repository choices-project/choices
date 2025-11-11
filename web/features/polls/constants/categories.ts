export type PollCategoryDefinition = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export const POLL_CATEGORIES: PollCategoryDefinition[] = [
  { id: 'general', name: 'General', icon: '📊', color: 'bg-gray-100 text-gray-700' },
  { id: 'business', name: 'Business', icon: '💼', color: 'bg-blue-100 text-blue-700' },
  { id: 'education', name: 'Education', icon: '🎓', color: 'bg-green-100 text-green-700' },
  { id: 'technology', name: 'Technology', icon: '💻', color: 'bg-purple-100 text-purple-700' },
  { id: 'health', name: 'Health', icon: '🏥', color: 'bg-red-100 text-red-700' },
  { id: 'finance', name: 'Finance', icon: '💰', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'environment', name: 'Environment', icon: '🌱', color: 'bg-lime-100 text-lime-700' },
  { id: 'social', name: 'Social', icon: '👥', color: 'bg-teal-100 text-teal-700' },
];

export const getPollCategoryIcon = (category: string): string =>
  POLL_CATEGORIES.find((c) => c.id === category)?.icon ?? '📊';

export const getPollCategoryColor = (category: string): string =>
  POLL_CATEGORIES.find((c) => c.id === category)?.color ?? 'bg-gray-100 text-gray-700';

