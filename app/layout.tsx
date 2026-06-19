import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agri Africa - Cultivating success in agriculture",
  description:
    "Agri Africa events and exhibitions platform powered by Next.js, Tailwind, Redux, and Strapi-ready APIs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="no-gsap">
      <body>{children}</body>
    </html>
  );
}
