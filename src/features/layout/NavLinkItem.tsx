import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface NavLinkItemProps {
  to: string;
  children: ReactNode;
}

const NavLinkItem = ({ to, children }: NavLinkItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) => `primary-nav__link${isActive ? " primary-nav__link--active" : ""}`}
  >
    {children}
  </NavLink>
);

export default NavLinkItem;
