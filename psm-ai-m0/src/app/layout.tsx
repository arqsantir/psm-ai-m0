import "./styles.css";

export const metadata = {
  title: "BOB — AI Territory Inspector",
  description: "Upload a survey. Bob will read the territory using the PSM methodology."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
