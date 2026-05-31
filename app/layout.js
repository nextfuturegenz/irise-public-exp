import "./globals.css";

export const metadata = {
  title: "Task Master — AI Meeting Intelligence",
  description:
    "Turn meeting notes into structured action items, owner assignments, and personalized email drafts in seconds.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
