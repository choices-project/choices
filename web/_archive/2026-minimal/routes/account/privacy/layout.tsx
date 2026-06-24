import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy & Data',
  description: 'Manage your privacy settings and data',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
