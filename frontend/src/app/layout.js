import "./globals.css";

export const metadata = {
  title: "MindTrack — AI Mental Wellness",
  description:
    "Early emotional assessment using short-term AI-driven micro-interactions and CBT-based adaptive responses. Not a medical tool.",
  keywords: "mental health, emotional tracking, CBT, AI wellness, mood journal",
  openGraph: {
    title: "MindTrack — AI Mental Wellness",
    description: "Track your emotional wellbeing with AI-powered insights.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
