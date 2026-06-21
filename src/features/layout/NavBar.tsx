import { LogOut, PackageOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { primaryNavigation } from "../../config/navigation";
import NavLinkItem from "./NavLinkItem";
import { clearSession } from "../../utils/auth";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <a className="brand-mark" href="/home" aria-label="AkinFolu Foods control desk">
        <span className="brand-mark__icon"><PackageOpen size={21} /></span>
        <span>
          <strong>AkinFolu</strong>
          <small>Food inventory</small>
        </span>
      </a>

      <nav className="primary-nav" aria-label="Main navigation">
        {primaryNavigation.map((link) => (
          <NavLinkItem key={link.to} to={link.to}>{link.shortLabel}</NavLinkItem>
        ))}
      </nav>

      <button className="logout-button" onClick={handleLogout} type="button">
        <LogOut size={17} />
        <span>Sign out</span>
      </button>
    </header>
  );
};

export default Navbar;
