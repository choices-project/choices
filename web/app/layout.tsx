import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Vote, BarChart3, Home, Menu, X } from 'lucide-react'
import { useState } from 'react'

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
        {/* Enhanced Navigation Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Vote className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Choices
                  </span>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href="/polls" 
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                >
                  <Vote className="h-4 w-4" />
                  <span>Polls</span>
                </Link>
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile Navigation (hidden by default) */}
            <div className="md:hidden hidden">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href="/polls" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Vote className="h-4 w-4" />
                  <span>Polls</span>
                </Link>
              </div>
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
