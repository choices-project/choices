import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polls',
  description: 'Browse and participate in community polls',
};

export default function PollsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
