import { NavLink } from "react-router-dom";
import "../index.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo"> AdVenture </div>
      <div className="navbar-links">
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
      </div>
    </nav>
  );
}
