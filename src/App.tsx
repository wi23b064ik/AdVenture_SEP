//all visual components and routing  is handled here

// Import necessary modules from react-router-dom for routing 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Import adv page component and show route.
import AdvertiserPage from "./pages/AdvertiserPage";
import HomePage from "./pages/HomePage";
import PublisherPage from "./pages/PublisherPage";
import BiddingPage from "./pages/BiddingPage";
import Navbar from "./pages/NavBar";

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
      </Routes>
    </Router>
  );
}

export default App; //Export app component wherever its called