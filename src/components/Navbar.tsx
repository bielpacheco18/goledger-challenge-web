import { Link, useLocation } from "react-router-dom";
import { Tv, Heart, Film } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      location.pathname === path
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-accent"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Film className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            GoLedger<span className="text-primary">TV</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/" className={linkClass("/")}>
            <Tv className="h-4 w-4" /> Séries
          </Link>
          <Link to="/favorites" className={linkClass("/favorites")}>
            <Heart className="h-4 w-4" /> Favoritos
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
