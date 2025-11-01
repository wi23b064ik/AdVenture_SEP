import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "10px", backgroundColor: "#282c34" }}>
      <Link to="/" style={{ color: "white", marginRight: "20px" }}>Home</Link>
      <Link to="/publisher" style={{ color: "white", marginRight: "20px" }}>Publisher</Link>
      <Link to="/advertiser" style={{ color: "white", marginRight: "20px" }}>Advertiser</Link>
      <Link to="/bidding" style={{ color: "white" }}>Bidding</Link>
    </nav>
  );
}
