import { Outlet } from "react-router-dom";
import Footer from "./footer/Footer";
import NavBar from "./NavBar";

const AppShell = () => (
  <div className="app-shell">
    <div className="app-shell__rail" aria-hidden="true" />
    <NavBar />
    <main className="app-shell__main">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default AppShell;
