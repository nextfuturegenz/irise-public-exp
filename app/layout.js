import "./globals.css";

export const metadata = {
  title: "AI Meeting Notes → Action Items",
  description:
    "Paste meeting notes, get structured action items. Built live at the iRise Buildathon.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
