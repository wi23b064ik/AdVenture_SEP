//useState to keep track of changes made by user
import { useState } from "react";

//Define bid object 
interface Bid {
  id: number;
  adSpace: string;
  amount: number;
}

//funct called when user goes to advertiser page ( http://localhost:5174/advertiser)
export default function AdvertiserPage() { //export default = mvp component
  const [bids, setBids] = useState<Bid[]>([]); 
  const [adSpace, setAdSpace] = useState(""); 
  const [amount, setAmount] = useState("");

  //creates new bid with given details 
  const placeBid = () => {
    if (!adSpace || !amount) return;
    const newBid: Bid = {
      id: Date.now(),
      adSpace,
      amount: parseFloat(amount),
    };
    //update bids array with new bid
    setBids([...bids, newBid]);
    //reset input fields
    setAdSpace("");
    setAmount("");
  };    

  //visual layout
  return (
    <div style={{ padding: "20px" }}>
      <h2>Advertiser Portal</h2>
      <p>Enter bids for available ad spaces.</p>
      <input
        placeholder="Ad Space Name"
        value={adSpace}
        onChange={(e) => setAdSpace(e.target.value)}
      />
      <input
        placeholder="Bid Amount (€)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={placeBid}>Place Bid</button>

      <h3>Your Bids</h3>
      <ul>
        {bids.map((b) => (
          <li key={b.id}>
            {b.adSpace}: €{b.amount.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
