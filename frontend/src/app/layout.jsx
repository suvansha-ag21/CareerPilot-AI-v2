import { AuthProvider } from "@/store/auth-context";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "CareerPilot AI – Career & Interview Intelligence Platform",
  description: "AI-powered resume intelligence, hybrid job description matching, adaptive voice interviews, and structured career roadmaps.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#F8FAFC] text-[#172033]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
