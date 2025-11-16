//all visual components and routing  is handled here

// Import necessary modules from react-router-dom for routing 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Import adv page component and show route.
import AdvertiserPage from "./pages/AdvertiserPage";
import HomePage from "./pages/HomePage";
import PublisherPage from "./pages/PublisherPage";
import BiddingPage from "./pages/BiddingPage";
import Navbar from "./pages/NavBar"; // <-- Du hast hier NavBar (groß B) geschrieben, stelle sicher, dass die Datei auch so heißt!
// --- NEUER IMPORT ---
import Login from "./pages/login"; // Importiere die Login-Seite
// --- optional für später ---
import Register from "./pages/register";
// import Register from "./pages/RegisterPage"; // Import für die Registrierungsseite

//root react component: App.tsx - entry point for the application
function App() {
  return (
    /*all possible rootes:*/
    <Router>
      <Navbar />
      {/*defines individual routes within the application*/}
      <Routes>
        {/*connect URL path to Page.tsx component*/}
        <Route path="/advertiser" element={<AdvertiserPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/publisher" element={<PublisherPage />} />
        <Route path="/bidding" element={<BiddingPage />} />
        
        {/* --- NEUE ROUTE HINZUGEFÜGT --- */}
        <Route path="/login" element={<Login />} />
        
        {/* --- optional für später --- */}
        <Route path="/register" element={<Register />} />
        {/* <Route path="/register" element={<Register />} /> */}
        
      </Routes>
    </Router>
  );
}

export default App; //Export app component wherever its called