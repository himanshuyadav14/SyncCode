import type { Metadata } from "next";
import "./globals.css";
import ZegoConsoleFilter from "@/components/ZegoConsoleFilter";

export const metadata: Metadata = {
  title: "SyncCode – Real-Time Collaborative Editor",
  description:
    "A blazing-fast, real-time collaborative code editor powered by Monaco and Socket.io.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ZegoConsoleFilter />
        {children}
      </body>
    </html>
  );
}
