import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell } from "lucide-react";
import { useUserRole } from "../../hooks/useUserRole";

interface TopBarProps {
  onMenu: () => void;
}

const TopBar = ({ onMenu }: TopBarProps) => {
  const navigate = useNavigate();
  const { role, username } = useUserRole();
  const [query, setQuery] = useState("");

  const initials = (username || "U").slice(0, 2).toUpperCase();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/wares?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="topbar">
      <button className="topbar__menu" onClick={onMenu} aria-label="Open menu" type="button">
        <Menu size={22} />
      </button>

      <form className="topbar__search" onSubmit={handleSearch}>
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer, product…"
          aria-label="Search"
        />
      </form>

      <div className="topbar__spacer" />

      <button className="topbar__bell" aria-label="Notifications" type="button">
        <Bell size={20} />
      </button>

      <div className="topbar__profile">
        <span className="topbar__avatar">{initials}</span>
        <span className="topbar__who">
          <strong>{username || "User"}</strong>
          <span>{role}</span>
        </span>
      </div>
    </header>
  );
};

export default TopBar;
