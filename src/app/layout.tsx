import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthModal } from "@/components/AuthModal";
import { BottomNav } from "@/components/BottomNav";
import { FooterWrapper } from "@/components/FooterWrapper";
import { UserDataProvider } from "@/context/UserDataContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://logosroyal.com"),
  title: {
    default: "Logos Royal Enterprise",
    template: "%s | Logos Royal Enterprise",
  },
  description: "We ship fashion, electronics, beauty, and home essentials to Ghana, the USA, and beyond. Reliable products, fast delivery.",
  keywords: [
    // Ghana
    "online shopping Ghana",
    "buy online Ghana",
    "trusted online store Ghana",
    "reliable delivery Ghana",
    "shop online Accra",
    "Ghana e-commerce",
    "fast delivery Ghana",
    "order online Ghana",
    // USA
    "online shopping USA",
    "buy online USA",
    "affordable online store",
    "fast US shipping",
    // Cross-market
    "fashion online",
    "electronics online",
    "beauty products online",
    "home essentials online",
    "quality products worldwide",
    "international shipping",
    "Logos Royal Enterprise",
  ],
  openGraph: {
    siteName: "Logos Royal Enterprise",
    type: "website",
    url: "https://logosroyal.com",
    title: "Logos Royal Enterprise. Reliable Shopping, Worldwide Delivery.",
    description: "We ship fashion, electronics, beauty, and home essentials to Ghana, the USA, and beyond. Reliable products, fast delivery.",
    images: [{ url: "/logos-royal-logo-v2.png", width: 512, height: 512, alt: "Logos Royal Enterprise" }],
  },
  twitter: {
    card: "summary",
    title: "Logos Royal Enterprise. Reliable Shopping, Worldwide Delivery.",
    description: "We ship fashion, electronics, beauty, and home essentials to Ghana, the USA, and beyond. Reliable products, fast delivery.",
    images: ["/logos-royal-logo-v2.png"],
  },
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
      <body className="min-h-full flex flex-col">
        <UserDataProvider>
          {children}
          <FooterWrapper />
          <AuthModal />
          <BottomNav />
        </UserDataProvider>
      </body>
    </html>
  );
}
