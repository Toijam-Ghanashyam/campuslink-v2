import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource-variable/newsreader/standard-italic.css";
import "./globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { ToastProvider } from "@/components/editorial/Toast";

export const metadata: Metadata = {
  title: "CampusLink v2.0 — Institutional Placement & AI Operating System",
  description:
    "Enterprise Campus Placement OS with PEP Policy Engine, Gemini AI Resume Screening, Live War Room Dispatch, and Native Remediation Studio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="day" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('cl-theme') || 'day';
                document.documentElement.dataset.theme = theme;
              } catch (e) {
                document.documentElement.dataset.theme = 'day';
              }
            `,
          }}
        />
      </head>
      <body className="bg-bg text-fg font-sans antialiased selection:bg-accent-tint selection:text-fg min-h-screen flex flex-col">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
