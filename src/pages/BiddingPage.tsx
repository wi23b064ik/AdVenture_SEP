import { useState } from "react";

interface Bid {
  advertiser: string;
  amount: number;
}

export default function BiddingPage() {
  const bids: Bid[] = [
    { advertiser: "Company A", amount: 1.2 },
    { advertiser: "Company B", amount: 3.4 },
    { advertiser: "Company C", amount: 1.8 },
  ];

  const [winner, setWinner] = useState<Bid | null>(null);

  //simulate auction by iterating through array and finding highest bid
  const runAuction = () => {
    const highest = bids.reduce((prev, curr) =>
      curr.amount > prev.amount ? curr : prev
    );
    setWinner(highest);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Simulated Real-Time Bidding</h2>
      <button onClick={runAuction}>Run Auction</button>

      <ul>
        {bids.map((b, index) => (
          <li key={index}>
            {b.advertiser}: €{b.amount.toFixed(2)}
          </li>
        ))}
      </ul>

      {winner && (
        <h3> Winner: {winner.advertiser} with €{winner.amount.toFixed(2)}</h3>
      )}
    </div>
  );
}
