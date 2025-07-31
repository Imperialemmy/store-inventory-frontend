import { useNavigate } from "react-router-dom";
import NavLinkItem from "./NavLinkItem";

const navLinks = [
  { to: "/home", label: "Home" },
  { to: "/brands", label: "Brands" },
  { to: "/categories", label: "Categories" },
  { to: "/wares", label: "Products" },
];

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <nav className="bg-white px-4 py-3 border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Centered nav links */}
        <div className="flex-1 flex justify-center space-x-20">
          {navLinks.map((link) => (
            <NavLinkItem key={link.to + link.label} to={link.to}>
              {link.label}
            </NavLinkItem>
          ))}
        </div>

        {/* Logout button on the far right */}
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
