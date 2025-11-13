export type PollCategoryDefinition = {
  id: string;
  nameKey: string;
  icon: string;
  color: string;
};

export const POLL_CATEGORIES: PollCategoryDefinition[] = [
  { id: 'general', nameKey: 'polls.categories.general', icon: '📊', color: 'bg-gray-100 text-gray-700' },
  { id: 'business', nameKey: 'polls.categories.business', icon: '💼', color: 'bg-blue-100 text-blue-700' },
  { id: 'education', nameKey: 'polls.categories.education', icon: '🎓', color: 'bg-green-100 text-green-700' },
  { id: 'technology', nameKey: 'polls.categories.technology', icon: '💻', color: 'bg-purple-100 text-purple-700' },
  { id: 'health', nameKey: 'polls.categories.health', icon: '🏥', color: 'bg-red-100 text-red-700' },
  { id: 'finance', nameKey: 'polls.categories.finance', icon: '💰', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'environment', nameKey: 'polls.categories.environment', icon: '🌱', color: 'bg-lime-100 text-lime-700' },
  { id: 'social', nameKey: 'polls.categories.social', icon: '👥', color: 'bg-teal-100 text-teal-700' },
];

export const getPollCategoryIcon = (category: string): string =>
  POLL_CATEGORIES.find((c) => c.id === category)?.icon ?? '📊';

export const getPollCategoryColor = (category: string): string =>
  POLL_CATEGORIES.find((c) => c.id === category)?.color ?? 'bg-gray-100 text-gray-700';

