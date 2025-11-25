//all visual components and routing  is handled here

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import AdvertiserPage from "./pages/AdvertiserPage";
import HomePage from "./pages/HomePage";
import PublisherPage from "./pages/PublisherPage";
import BiddingPage from "./pages/BiddingPage";
import Navbar from "./pages/NavBar"; 
import Login from "./pages/login"; 
import Register from "./pages/register";

// NEU: Profil Seite importieren
import ProfilePage from "./pages/ProfilePage.tsx"; 

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/advertiser" element={<AdvertiserPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/publisher" element={<PublisherPage />} />
        <Route path="/bidding" element={<BiddingPage />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- NEU: Route für das Profil --- */}
        <Route path="/profile" element={<ProfilePage />} />

      </Routes>
    </Router>
  );
}

export default App;