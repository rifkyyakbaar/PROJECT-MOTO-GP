import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RACEDAYTRIPS.COM - Tiket Balap F1 & MotoGP",
  description: "Platform resmi pemesanan tiket balap motor dan mobil tingkat dunia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Jurus Ninja: Kita memanggil sistem warna langsung dari Cloud/Internet */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}