import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    {/* Background music - hidden autoplay */}
    <iframe
      src="https://www.youtube.com/embed/FKSjnm3qdjE?list=OLAK5uy_kJ0YHnJcD9-eOogDZpK1gJEICeNk38rnM&autoplay=1&loop=1&controls=0"
      allow="autoplay"
      className="hidden"
      title="Background Music"
    />
  </div>
);

export default Layout;
