import { NavLink } from "react-router-dom";
import "../index.css";

export default function Navbar() {
  // 1. Benutzerdaten aus dem Speicher holen
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const role = user ? user.role : null;

  // 2. Logout-Funktion
  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = "/login"; // Seite neu laden
  };

  return (
    <nav className="navbar">
      {/* LOGO: Mit etwas Abstand nach rechts (marginRight) */}
      <div className="navbar-logo" style={{ marginRight: '30px', fontWeight: 'bold' }}> 
        AdVenture 
      </div>
      
      <div className="navbar-links">
        {/* === HOME (Für alle) === */}
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>

        {/* === BIDDING (Für alle) === */}
        <NavLink to="/bidding" className={({ isActive }) => (isActive ? "active" : "")}>
          Bidding
        </NavLink>

        {/* =======================================================
            ROLLEN-BASIERTE LINKS
           ======================================================= */}
        
        {/* Link zu PublisherPage.tsx */}
        {(role === 'Publisher' || role === 'Admin') && (
          <NavLink to="/publisher" className={({ isActive }) => (isActive ? "active" : "")}>
            Publisher
          </NavLink>
        )}

        {/* Link zu AdvertiserPage.tsx */}
        {(role === 'Advertiser' || role === 'Admin') && (
          <NavLink to="/advertiser" className={({ isActive }) => (isActive ? "active" : "")}>
            Advertiser
          </NavLink>
        )}

        {/* === PROFIL (Für alle Eingeloggten) === */}
        {user && (
           <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
             {/* WENN Admin -> "Profile verwalten", SONST -> "Profilverwaltung" */}
             {role === 'Admin' ? 'Profile editing' : 'Profil management'}
           </NavLink>
        )}


        {/* =======================================================
            GÄSTE (Nicht eingeloggt)
           ======================================================= */}
        {!user && (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? "active" : "")}>
              Registration
            </NavLink>
          </>
        )}

        {/* === IMPRESSUM (Für alle) === */}
        <NavLink to="/impressum" className={({ isActive }) => (isActive ? "active" : "")}>
          Impressum
        </NavLink>
      </div>

      {/* Logout Button */}
      {user && (
        <div style={{ marginLeft: 'auto' }}>
          <button 
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Logout ({user.username})
          </button>
        </div>
      )}
    </nav>
  );
}