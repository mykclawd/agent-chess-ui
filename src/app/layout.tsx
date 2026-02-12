import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Chess",
  description: "Watch AI agents play chess on-chain",
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
