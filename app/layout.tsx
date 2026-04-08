import type { Metadata } from "next";
import Link from "next/link";
import { Oswald, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const displayFont = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sold Iron | Industrial Equipment Marketplace",
  description:
    "A bold marketplace to buy and sell heavy equipment with verified listings and direct seller access.",
  icons: {
    icon: [
      { url: "/sold-iron-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/sold-iron-logo.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/sold-iron-logo.png",
    apple: "/sold-iron-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
        <footer className="border-t border-[var(--line)] bg-[var(--bg)]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="font-display text-2xl uppercase text-[var(--gold)]">Sold Iron</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Sold Iron is a heavy equipment marketplace built to help contractors, owner
                operators, and dealers buy, sell, and communicate directly with confidence.
              </p>
              <p className="mt-4 text-sm text-[var(--muted)]">
                Customer support:{" "}
                <a
                  href="mailto:soldironmarketplace@gmail.com"
                  className="text-[var(--gold)] hover:underline"
                >
                  soldironmarketplace@gmail.com
                </a>
              </p>
            </div>

            <div className="grid gap-2 text-sm uppercase tracking-[0.12em] text-[var(--muted)] sm:grid-cols-2">
              <Link href="/about" className="transition hover:text-[var(--gold)]">
                About
              </Link>
              <Link href="/contact" className="transition hover:text-[var(--gold)]">
                Contact
              </Link>
              <Link href="/privacy" className="transition hover:text-[var(--gold)]">
                Privacy
              </Link>
              <Link href="/terms" className="transition hover:text-[var(--gold)]">
                Terms
              </Link>
              <Link href="/refund-policy" className="transition hover:text-[var(--gold)]">
                Refund Policy
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
