import "./globals.css";

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
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-slate-100">
        {children}
      </body>
    </html>
  );
}
