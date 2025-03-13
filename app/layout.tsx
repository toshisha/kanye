import './globals.css'
import { inter } from './fonts'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'mix by mafwbh',
  description: 'mixed songs',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}

