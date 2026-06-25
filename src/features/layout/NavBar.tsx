import { LogOut, PackageOpen } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { primaryNavigation } from "../../config/navigation";
import { clearSession } from "../../utils/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  // Skip the transition on the very first measure so the pill doesn't
  // slide in from the left edge on initial load.
  const [ready, setReady] = useState(false);

  // The active tab is the navigation entry whose path is the longest prefix
  // of the current location, so /sales/reports lights Reports (not Sales).
  const activeTo = primaryNavigation
    .filter((link) => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

  const measurePill = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const el = activeTo ? linkRefs.current[activeTo] : null;
    if (!el) {
      setPill((prev) => ({ ...prev, visible: false }));
      return;
    }
    const navBox = nav.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    setPill({ left: box.left - navBox.left + nav.scrollLeft, width: box.width, visible: true });
  }, [activeTo]);

  useLayoutEffect(() => {
    measurePill();
  }, [measurePill]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    window.addEventListener("resize", measurePill);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measurePill);
    };
  }, [measurePill]);

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

      <nav className="primary-nav" aria-label="Main navigation" ref={navRef}>
        <span
          className="primary-nav__pill"
          aria-hidden="true"
          style={{
            transform: `translateX(${pill.left}px)`,
            width: pill.width,
            opacity: pill.visible ? 1 : 0,
            transition: ready
              ? "transform .45s cubic-bezier(.34,1.4,.5,1), width .45s cubic-bezier(.34,1.4,.5,1), opacity .25s ease"
              : "none",
          }}
        />
        {primaryNavigation.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            ref={(el) => {
              linkRefs.current[link.to] = el;
            }}
            className={`primary-nav__link${link.to === activeTo ? " primary-nav__link--active" : ""}`}
          >
            {link.shortLabel}
          </NavLink>
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
