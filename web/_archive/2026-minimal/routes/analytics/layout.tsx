import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'View analytics and insights',
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
