import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preferences',
  description: 'Customize your experience and manage your data',
};

export default function PreferencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
