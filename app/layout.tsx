import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
export const metadata: Metadata = { title: "Copa Madu", description: "Vôlei e futevôlei no aniversário da Madu. Acompanhe as chaves e quem está passando.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR"><body>{children}</body></html>; }
