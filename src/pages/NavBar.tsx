import { NavLink } from "react-router-dom";
import "../index.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo"> AdVenture </div>
      
      <div className="navbar-links">
        {/* Hauptnavigation */}
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        <NavLink
          to="/publisher"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Publisher
        </NavLink>
        <NavLink
          to="/advertiser"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Advertiser
        </NavLink>
        <NavLink
          to="/bidding"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Bidding
        </NavLink>

        {/* --- Authentifizierung (Neu) --- */}
        {/* Optional: Du könntest hier im CSS margin-left hinzufügen, um diese Gruppe abzutrennen */}
        <NavLink
          to="/login"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Login
        </NavLink>
        <NavLink
          to="/register"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Registrieren
        </NavLink>
      </div>
    </nav>
  );
}