import { Link, useLocation } from "react-router-dom";
import { Home, Download, Layers, BookOpen, Scale, PenTool, Paintbrush, Sparkles, Search, Image as ImageIcon, Shirt } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/browse", label: "Browse", icon: Search },
  { to: "/download", label: "Download", icon: Download },
  { to: "/download?tab=multi", label: "Multi Download", icon: Layers },
  { to: "/character-color", label: "Character Color", icon: Paintbrush },
  { to: "/character-cosmetics", label: "Cosmetics", icon: Shirt },
  { to: "/character-thumbnail", label: "Thumbnail", icon: ImageIcon },
  { to: "/ai-generator", label: "AI Generator", icon: Sparkles },
  { to: "https://grabvr.tools/editor", label: "JSON Level Editor", icon: PenTool, external: true },
  { to: "/tutorial", label: "Tutorial", icon: BookOpen },
  { to: "/legal", label: "Legal", icon: Scale },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-navbar sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-primary">
          Grab Level Grabber
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon, external }) => {
            const isActive =
              !external && (location.pathname + location.search === to ||
              (to === "/download" && location.pathname === "/download" && !location.search.includes("tab=multi")));
            const className = `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-navbar-foreground/15 text-navbar-foreground"
                : "text-navbar-foreground/70 hover:bg-navbar-foreground/10 hover:text-navbar-foreground"
            }`;
            return external ? (
              <a
                key={to}
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </a>
            ) : (
              <Link
                key={to}
                to={to}
                className={className}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
