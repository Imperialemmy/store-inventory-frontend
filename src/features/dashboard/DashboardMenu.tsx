import { Link } from 'react-router-dom';
import { dropdownData } from './dashboardMenuData';
import LogoScroller from './LogoScroller';
import { useUserRole } from '../../hooks/useUserRole';
import { useDashboard } from './useDashboard';

const DashboardMenu: React.FC = () => {
  const userRole = useUserRole();

  // ✅ Pull the logic from the custom hook
  const {
    containerRef,
    openDropdown,
    setOpenDropdown,
    toggleDropdown,
  } = useDashboard();

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto px-4"
    >
      {dropdownData.map(({ name, label, logos, description, links }) => (
        <div key={name} className="relative">
          <button
            onClick={() => toggleDropdown(name)}
            aria-haspopup="true"
            aria-expanded={openDropdown === name}
            className="w-72 h-72 bg-white rounded-lg shadow-md p-8 flex flex-col items-center justify-center text-gray-700 hover:shadow-xl transition"
          >
            <LogoScroller logos={logos} />
            <h3 className="text-xl font-semibold mb-2">{label}</h3>
            <p className="text-center text-gray-500 text-sm">{description}</p>
          </button>

          <ul
            id={`dropdown-${name}`}
            className={`absolute z-10 bg-white border border-gray-200 rounded shadow-lg w-48 mt-2
              overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out
              ${openDropdown === name ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
          >
            {links
              .filter(link => !link.roles || link.roles.includes(userRole.role))
              .map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setOpenDropdown(null)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default DashboardMenu;
