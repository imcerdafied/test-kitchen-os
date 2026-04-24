import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Test Kitchen OS — AI-Powered Community Recipes',
  description:
    'Upload your ingredients, get healthy AI-generated recipes with beautiful food images, and share with the community.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
