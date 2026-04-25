import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#C4622D',
};

export const metadata: Metadata = {
  title: 'Test Kitchen OS — AI-Powered Community Recipes',
  description:
    'Upload your ingredients, get healthy AI-generated recipes with beautiful food images, and share with the community.',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Test Kitchen OS',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream-100">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-cream-300 py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-green-700/50">
            <p>Test Kitchen OS — Healthy recipes, powered by AI</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
