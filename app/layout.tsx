import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from './components/ThemeProvider';
import { Footer } from './components/Footer';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://billgenics.com"),
  title: {
    default: "BillGenics — Track bills, plan ahead, split with ease",
    template: "%s · BillGenics",
  },
  description:
    "Scan receipts with AI, schedule every recurring bill once, get reminded before payments are due, and split shared expenses with friends — all in one beautiful app.",
  keywords: [
    "bill tracking", "AI receipt scanner", "expense tracker", "recurring bills",
    "bill reminders", "split expenses", "personal finance app",
  ],
  openGraph: {
    type: "website",
    title: "BillGenics — Track bills, plan ahead, split with ease",
    description:
      "AI-powered bill tracking, recurring-bill scheduling, payment reminders and effortless expense splitting.",
    siteName: "BillGenics",
    images: [{ url: "/images/invoice_analytics.png", width: 1200, height: 630, alt: "BillGenics dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BillGenics — Track bills, plan ahead, split with ease",
    description:
      "AI-powered bill tracking, recurring-bill scheduling, payment reminders and effortless expense splitting.",
    images: ["/images/invoice_analytics.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BillGenics",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#3b4ef8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <ThemeProvider>
            <div className='flex-1 flex flex-col'>{children}</div>
            <Footer />
            <Toaster
              position='top-right'
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--color-card)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-border)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--color-primary)',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'white',
                  },
                },
              }}
            />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
