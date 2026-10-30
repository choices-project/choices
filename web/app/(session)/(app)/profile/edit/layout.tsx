import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Profile',
  description: 'Edit your profile information',
};

export default function EditProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
