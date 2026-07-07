import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadMorph AI — Intelligent CSV Importer',
  description:
    'AI-powered CSV importer that intelligently extracts CRM lead information from any CSV format using Ollama LLM.',
  keywords: ['CRM', 'CSV importer', 'AI', 'lead generation', 'GrowEasy'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
