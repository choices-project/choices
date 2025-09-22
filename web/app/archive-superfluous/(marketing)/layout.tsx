import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* No providers - keep bundle pure */}
        {children}
      </body>
    </html>
  )
}
