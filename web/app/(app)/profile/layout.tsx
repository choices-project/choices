import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View and manage your profile',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
