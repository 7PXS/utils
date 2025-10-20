import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Sigma Site',
  description: 'Goon.Cool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://cdn.discordapp.com/avatars/155149108183695360/b4fdfc64edff74c37e1574d34fad66c2.webp?size=1024" />
      </head>
      <body className={`${inter.variable} antialiased`} >
        {children}
      </body>
    </html>
  );
}
