import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/*
 * The brand voice is a rounded geometric sans at heavy weights. Plus Jakarta
 * Sans is the open-source analogue named in the design spec; 500 carries body,
 * 700/800 carry display.
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Deadlock Counter Helper",
  description:
    "Pick the enemy team, see every item that answers their kit — with costs, tiers, slots, and the specific ability each item counters.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
