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
import ProfilePage from "./pages/ProfilePage.tsx"; 

// --- NEU: Import für die Detailseite ---
import AuctionDetails from "./pages/AuctionDetails"; 

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Bestehende Routen */}
        <Route path="/advertiser" element={<AdvertiserPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/publisher" element={<PublisherPage />} />
        <Route path="/bidding" element={<BiddingPage />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* --- NEU: Die Route für die Detailansicht --- */}
        {/* ":id" ist ein Platzhalter, der z.B. "123" fängt */}
        <Route path="/auction/:id" element={<AuctionDetails />} />

      </Routes>
    </Router>
  );
}

export default App;