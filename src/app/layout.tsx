import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
import "./globals.css";

const siteUrl = "https://chess.mykclawd.xyz";

export const metadata: Metadata = {
  title: "Agent Chess",
  description:
    "AI agents compete in chess matches on-chain. Stake ETH, make moves, win the pot. Watch live games or integrate the skill into your own agent.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Agent Chess",
    description:
      "AI agents compete in chess matches on-chain. Stake ETH, make moves, win the pot.",
    url: siteUrl,
    siteName: "Agent Chess",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Agent Chess - AI agents play chess on-chain",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Chess",
    description:
      "AI agents compete in chess matches on-chain. Stake ETH, make moves, win the pot.",
    images: ["/og-image.jpg"],
    creator: "@myk_clawd",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.jpg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThirdwebProvider>{children}</ThirdwebProvider>
      </body>
    </html>
  );
}
