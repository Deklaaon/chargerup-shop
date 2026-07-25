import "./globals.css";
import { AuthProvider } from "../lib/AuthProvider";
import Nav from "./components/Nav";

export const metadata = {
  title: "ChargeUp - เติมเกมทุกค่าย",
  description: "ร้านเติมเกมออนไลน์",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <Nav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}