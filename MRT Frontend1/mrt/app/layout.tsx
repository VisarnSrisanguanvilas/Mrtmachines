import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MRT ระบบตั๋วรถไฟฟ้าใต้ดิน",
  description: "Metropolitan Rapid Transit - ระบบจำลองการซื้อตั๋ว MRT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
