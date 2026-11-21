import { AuthProvider } from "@/store/auth-context";
import "./globals.css";

export const metadata = {
  title: "CareerPilot AI – Career & Interview Intelligence Platform",
  description: "AI-powered resume intelligence, hybrid job description matching, adaptive voice interviews, and structured career roadmaps.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#F8FAFC] text-[#172033]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
