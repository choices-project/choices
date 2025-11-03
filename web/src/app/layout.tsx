import type { Metadata } from 'next'
import { Inter } from 'next/font/google';
import React from 'react';



const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Choices - Privacy-Preserving Voting',
  description: 'A secure, privacy-preserving voting system using VOPRF and WebAuthn',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {children}
        </div>
      </body>
    </html>
  )
}
