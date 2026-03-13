import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Civics',
  description: 'Explore your representatives and civic engagement',
};

export default function CivicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
