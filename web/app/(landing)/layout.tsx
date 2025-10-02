import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Choices Platform - Democratic Decision Making',
  description: 'Secure, private, and transparent voting platform for democratic decision making.',
  keywords: ['voting', 'democracy', 'polls', 'transparency', 'privacy'],
  authors: [{ name: 'Choices Platform' }],
  openGraph: {
    title: 'Choices Platform',
    description: 'Secure, private, and transparent voting platform',
    type: 'website',
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="landing-layout">
      {/* No providers - keep landing bundle pure */}
      {children}
    </div>
  )
}
