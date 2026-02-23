import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PanicButton",
  description: "Upload a syllabus PDF → extract deadlines → export to calendar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full bg-background text-foreground`}
        style={{ minHeight: "100%", background: "#0a0f1c", color: "#f3f4f6" }}
      >
        {children}
      </body>
    </html>
  );
}
