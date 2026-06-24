import type { PollCategory } from '@/lib/types/poll-templates';

export {
  TITLE_CHAR_LIMIT,
  DESCRIPTION_CHAR_LIMIT,
  MAX_OPTIONS,
  MIN_OPTIONS,
  MAX_TAGS,
} from '@/lib/polls/wizard/constants';

export type PollCreationStep = 'details' | 'options' | 'audience' | 'review';

export const POLL_CREATION_STEPS: Array<{
  id: PollCreationStep;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'details',
    title: 'Describe your poll',
    subtitle: 'Craft the question and context voters will see first.',
  },
  {
    id: 'options',
    title: 'Add response options',
    subtitle: 'Offer distinct, easy-to-scan choices.',
  },
  {
    id: 'audience',
    title: 'Audience & discovery',
    subtitle: 'Pick a category, tags, and participation rules.',
  },
  {
    id: 'review',
    title: 'Preview & publish',
    subtitle: 'Double-check everything before launching.',
  },
];

export const STEP_TIPS: Array<{ heading: string; body: string }> = [
  {
    heading: 'Clarity wins votes',
    body: 'Write a title that states the decision and use the description to explain why it matters.',
  },
  {
    heading: 'Offer distinct choices',
    body: 'Keep options short, mutually exclusive, and easy to scan at a glance.',
  },
  {
    heading: 'Tag for discovery',
    body: 'The right category and tags help the right audience discover your poll quickly.',
  },
  {
    heading: 'Set the rules',
    body: 'Decide how votes are counted, who can participate, and when results appear.',
  },
  {
    heading: 'Review before launch',
    body: 'Preview exactly what voters will see and confirm everything looks right.',
  },
];

export const CATEGORIES: Array<{ id: PollCategory; name: string; description: string; icon: string }> = [
  { id: 'general', name: 'General', description: 'General purpose polls', icon: '📊' },
  { id: 'business', name: 'Business', description: 'Business and workplace polls', icon: '💼' },
  { id: 'education', name: 'Education', description: 'Educational and academic polls', icon: '🎓' },
  { id: 'entertainment', name: 'Entertainment', description: 'Entertainment and media polls', icon: '🎬' },
  { id: 'politics', name: 'Politics', description: 'Political and social issues', icon: '🗳️' },
  { id: 'technology', name: 'Technology', description: 'Technology and innovation polls', icon: '💻' },
  { id: 'health', name: 'Health', description: 'Health and wellness polls', icon: '🏥' },
  { id: 'sports', name: 'Sports', description: 'Sports and fitness polls', icon: '⚽' },
  { id: 'food', name: 'Food', description: 'Food and dining polls', icon: '🍕' },
  { id: 'travel', name: 'Travel', description: 'Travel and tourism polls', icon: '✈️' },
  { id: 'fashion', name: 'Fashion', description: 'Fashion and style polls', icon: '👗' },
  { id: 'finance', name: 'Finance', description: 'Finance and money polls', icon: '💰' },
  { id: 'environment', name: 'Environment', description: 'Environmental and sustainability polls', icon: '🌱' },
  { id: 'social', name: 'Social', description: 'Social and community polls', icon: '👥' },
];

