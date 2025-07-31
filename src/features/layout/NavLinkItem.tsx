import React from "react";
import { Link } from "react-router-dom";

interface NavLinkItemProps {
  to: string;
  children: React.ReactNode;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ to, children }) => {
  return (
    <Link
      to={to}
      className="text-sm text-gray-800 hover:text-black transition-colors duration-200"
    >
      {children}
    </Link>
  );
};

export default NavLinkItem;
