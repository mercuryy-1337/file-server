import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Merc File Server',
  description: 'mercurys file server',
  generator: 'mercuryy-1337',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
