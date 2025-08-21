import { GeistSans, GeistMono } from 'next/font/google';
import './globals.css';

const geistSans = GeistSans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Surge.lol by unvhook',
  description: 'Stop losing. Start winning with Surge.lol, the best legit and rage cw cheat. Free and shitsploit friendly!',
  icons: {
    icon: '/favicon.ico', // Replace with your favicon URL
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-900 text-white overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
