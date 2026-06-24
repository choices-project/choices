import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact History',
  description: 'View your message history with representatives',
};

export default function ContactHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
