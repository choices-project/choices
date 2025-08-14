import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Vote, BarChart3, Home } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Choices - Privacy-Preserving Polling Network',
  description: 'A neutral, privacy-preserving real-time polling network that puts your voice first while protecting your privacy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <Vote className="h-8 w-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">Choices</span>
                </Link>
              </div>
              
              <nav className="flex items-center space-x-8">
                <Link 
                  href="/" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href="/polls" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Vote className="h-4 w-4" />
                  <span>Polls</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}
