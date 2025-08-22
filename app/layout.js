import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased min-h-screen bg-background text-foreground overflow-hidden font-inter`}
      >
        {children}
      </body>
    </html>
  );
}
