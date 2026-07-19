import "./styles.css";

export const metadata = {
  title: "PSM AI — Bob",
  description: "Upload a survey. Bob will read the territory."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
