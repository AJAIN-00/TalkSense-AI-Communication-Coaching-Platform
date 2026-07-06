import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalkSense — AI Communication Coaching',
  description: 'Practice and master your communication skills with TalkSense\'s AI-powered coaching. Real-time feedback, voice analysis, and photorealistic AI avatar coaching sessions.',
  keywords: ['AI coaching', 'communication skills', 'interview prep', 'public speaking', 'voice analysis'],
  icons: {
    icon: '/favicon.ico?v=2',
    shortcut: '/favicon.ico?v=2',
    apple: '/favicon.ico?v=2',
  },
  openGraph: {
    title: 'TalkSense — AI Communication Coaching',
    description: 'Master communication skills with AI-powered coaching and a photorealistic avatar coach.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise-overlay">
        {children}
      </body>
    </html>
  );
}
