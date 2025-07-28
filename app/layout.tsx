import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AskKaka.in - Multilingual AI Chatbots for Indian Businesses',
  description: 'Create intelligent chatbots that understand English, Hindi, and Hinglish. Perfect for Indian businesses to serve customers in their preferred language.',
  keywords: ['chatbot', 'AI', 'multilingual', 'Hindi', 'Hinglish', 'Indian business', 'customer support'],
  authors: [{ name: 'AskKaka.in Team' }]
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {children}
        </div>
      </body>
    </html>
  )
}