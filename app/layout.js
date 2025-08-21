// Import fonts from the new Next.js font system
import { GeistSans, GeistMono } from 'next/font/google';
import './globals.css';

// Configure fonts with CSS variable names
const geistSans = GeistSans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata for your site (SEO + favicon etc.)
export const metadata = {
  title: 'Surge.lol by unvhook',
  description:
    'Stop losing. Start winning with Surge.lol, the best legit and rage cw cheat. Free and shitsploit friendly!',
  icons: {
    icon: '/favicon.ico', // Example: "/logo.png" for custom favicon
  },
};

// Root layout wrapper for all pages
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-900 text-white overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
