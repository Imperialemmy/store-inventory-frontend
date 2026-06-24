import { Outlet, useLocation } from "react-router-dom";
import Footer from "./footer/Footer";
import NavBar from "./NavBar";

const AppShell = () => {
  const location = useLocation();

  return (
    <div className="app-shell">
      <div className="app-shell__rail" aria-hidden="true" />
      <NavBar />
      <main className="app-shell__main">
        {/* Keyed on the path so each navigation replays the slide-in animation */}
        <div className="page-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AppShell;
