import localFont from "next/font/local";
import "./globals.css";

// Load Geist Sans
const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900", // variable font weight range
});

// Load Geist Mono
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Surge.lol by unvhook",
  description:
    "Stop losing. Start winning with Surge.lol, the best legit and rage cw cheat. Free and shitsploit friendly!",
  icons: {
    icon: "/favicon.ico",
  },
};

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
