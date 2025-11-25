import { useState, useEffect } from "react";

interface Auction {
  id: string;
  adSpaceName: string;
  adSpaceId: string;
  publisherId: string;
  startTime: Date;
  endTime: Date;
  status: "open" | "closed";
  minimumBidFloor: number;
  totalBids: number;
  winningBid?: {
    advertiserId: string;
    bidAmountCPM: number;
    campaignName: string;
  };
  allBids: BidSubmission[];
}

interface BidSubmission {
  id: string;
  auctionId: string;
  advertiserId: string;
  campaignName: string;
  bidAmountCPM: number;
  submitTime: Date;
  status: "pending" | "accepted" | "rejected" | "won" | "lost";
}

export default function BiddingPage() {
  const [auctions, setAuctions] = useState<Auction[]>([
    {
      id: "auction_1",
      adSpaceName: "Homepage Banner",
      adSpaceId: "space_1",
      publisherId: "pub_1",
      startTime: new Date(Date.now() - 10000),
      endTime: new Date(Date.now() + 50000),
      status: "open",
      minimumBidFloor: 0.5,
      totalBids: 3,
      allBids: [
        {
          id: "bid_1",
          auctionId: "auction_1",
          advertiserId: "adv_1",
          campaignName: "Spring Launch",
          bidAmountCPM: 2.1,
          submitTime: new Date(Date.now() - 8000),
          status: "accepted",
        },
        {
          id: "bid_2",
          auctionId: "auction_1",
          advertiserId: "adv_2",
          campaignName: "Summer Sale",
          bidAmountCPM: 2.5,
          submitTime: new Date(Date.now() - 5000),
          status: "accepted",
        },
        {
          id: "bid_3",
          auctionId: "auction_1",
          advertiserId: "adv_3",
          campaignName: "Mega Deal",
          bidAmountCPM: 1.8,
          submitTime: new Date(Date.now() - 2000),
          status: "accepted",
        },
      ],
    },
    {
      id: "auction_2",
      adSpaceName: "Sidebar Ad (300x250)",
      adSpaceId: "space_2",
      publisherId: "pub_1",
      startTime: new Date(Date.now() - 30000),
      endTime: new Date(Date.now() - 5000),
      status: "closed",
      minimumBidFloor: 1.0,
      totalBids: 2,
      winningBid: {
        advertiserId: "adv_1",
        bidAmountCPM: 3.2,
        campaignName: "Spring Launch",
      },
      allBids: [
        {
          id: "bid_4",
          auctionId: "auction_2",
          advertiserId: "adv_1",
          campaignName: "Spring Launch",
          bidAmountCPM: 3.2,
          submitTime: new Date(Date.now() - 25000),
          status: "won",
        },
        {
          id: "bid_5",
          auctionId: "auction_2",
          advertiserId: "adv_2",
          campaignName: "Summer Sale",
          bidAmountCPM: 2.8,
          submitTime: new Date(Date.now() - 20000),
          status: "lost",
        },
      ],
    },
  ]);

  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const updated: { [key: string]: string } = {};
      auctions.forEach((auction) => {
        if (auction.status === "open") {
          const diff = auction.endTime.getTime() - Date.now();
          if (diff > 0) {
            const seconds = Math.floor((diff / 1000) % 60);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            updated[auction.id] = `${minutes}m ${seconds}s`;
          } else {
            updated[auction.id] = "Closed";
          }
        } else {
          updated[auction.id] = "Closed";
        }
      });
      setTimeLeft(updated);
    }, 1000);

    return () => clearInterval(timer);
  }, [auctions]);

  const getWinningBid = (auction: Auction): BidSubmission | null => {
    if (auction.allBids.length === 0) return null;
    return auction.allBids.reduce((prev, curr) =>
      curr.bidAmountCPM > prev.bidAmountCPM ? curr : prev
    );
  };

  const closedAuctions = auctions.filter((a) => a.status === "closed");
  const openAuctions = auctions.filter((a) => a.status === "open");

  return (
    <div style={styles.container}>
      <h2>Real-Time Bidding Auctions (OpenRTB)</h2>
      <p>
        Advertisers compete in real-time auctions for ad spaces. Prices are based on CPM (Cost Per 1000 Impressions).
      </p>

      {/* Open Auctions */}
      <div style={styles.section}>
        <h3>🔴 Active Auctions ({openAuctions.length})</h3>
        {openAuctions.length === 0 ? (
          <p style={styles.emptyState}>No active auctions at the moment.</p>
        ) : (
          <div style={styles.grid}>
            {openAuctions.map((auction) => (
              <div key={auction.id} style={styles.auctionCard}>
                <div style={styles.auctionHeader}>
                  <div>
                    <h4>{auction.adSpaceName}</h4>
                    <p style={styles.smallText}>{auction.adSpaceId}</p>
                  </div>
                  <div style={styles.timer}>{timeLeft[auction.id]}</div>
                </div>

                <div style={styles.auctionInfo}>
                  <p>
                    <strong>Floor Price (CPM):</strong> €{auction.minimumBidFloor.toFixed(2)}
                  </p>
                  <p>
                    <strong>Active Bids:</strong> {auction.totalBids}
                  </p>
                  {auction.allBids.length > 0 && (
                    <p>
                      <strong>Highest Bid:</strong>{" "}
                      <span style={styles.highestBid}>
                        €{Math.max(...auction.allBids.map((b) => b.bidAmountCPM)).toFixed(2)} CPM
                      </span>
                    </p>
                  )}
                </div>

                {/* Live Bid Feed */}
                <div style={styles.bidFeed}>
                  <h5>Latest Bids</h5>
                  {auction.allBids.length === 0 ? (
                    <p style={styles.noBidsText}>Waiting for bids...</p>
                  ) : (
                    auction.allBids
                      .sort((a, b) => b.submitTime.getTime() - a.submitTime.getTime())
                      .slice(0, 3)
                      .map((bid) => (
                        <div key={bid.id} style={styles.bidItem}>
                          <span>{bid.campaignName}</span>
                          <span style={styles.bidAmount}>€{bid.bidAmountCPM.toFixed(2)}</span>
                        </div>
                      ))
                  )}
                </div>

                <button style={styles.detailsButton}>View Details</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed Auctions */}
      <div style={styles.section}>
        <h3>✅ Completed Auctions ({closedAuctions.length})</h3>
        {closedAuctions.length === 0 ? (
          <p style={styles.emptyState}>No completed auctions yet.</p>
        ) : (
          <div>
            {closedAuctions.map((auction) => {
              const winner = getWinningBid(auction);
              return (
                <div key={auction.id} style={styles.completedAuctionCard}>
                  <div style={styles.completedHeader}>
                    <div>
                      <h4>{auction.adSpaceName}</h4>
                      <p style={styles.smallText}>{auction.adSpaceId}</p>
                    </div>
                    <div style={styles.winnerBadge}>
                      {winner ? (
                        <>
                          <p style={styles.winnerLabel}>Winner</p>
                          <p style={styles.winningPrice}>
                            €{winner.bidAmountCPM.toFixed(2)} CPM
                          </p>
                        </>
                      ) : (
                        <p>No bids</p>
                      )}
                    </div>
                  </div>

                  <div style={styles.bidComparison}>
                    {auction.allBids.length > 0 && (
                      <>
                        <h5>Bid Results</h5>
                        <div style={styles.bidsList}>
                          {auction.allBids
                            .sort((a, b) => b.bidAmountCPM - a.bidAmountCPM)
                            .map((bid, idx) => (
                              <div
                                key={bid.id}
                                style={{
                                  ...styles.bidResultRow,
                                  backgroundColor:
                                    bid.status === "won" ? "#d1fae5" : "#f3f4f6",
                                }}
                              >
                                <span>
                                  #{idx + 1} {bid.campaignName}
                                </span>
                                <span style={styles.bidResultPrice}>
                                  €{bid.bidAmountCPM.toFixed(2)}
                                </span>
                                <span
                                  style={{
                                    color: bid.status === "won" ? "#16a34a" : "#9ca3af",
                                    fontWeight: bid.status === "won" ? "bold" : "normal",
                                  }}
                                >
                                  {bid.status === "won" ? "🏆 Won" : "Lost"}
                                </span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OpenRTB Info */}
      <div style={styles.infoSection}>
        <h3>📊 How OpenRTB Works</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <h5>1. Publisher Creates Inventory</h5>
            <p>Publishers define ad spaces with specs: placement, size, audience, and floor price.</p>
          </div>
          <div style={styles.infoCard}>
            <h5>2. Advertiser Places Campaign</h5>
            <p>
              Advertisers create campaigns with budget, targeting (country, device, category), and
              creative assets.
            </p>
          </div>
          <div style={styles.infoCard}>
            <h5>3. Real-Time Auction</h5>
            <p>
              When a user visits a site, an auction opens. Advertisers bid in real-time (milliseconds).
            </p>
          </div>
          <div style={styles.infoCard}>
            <h5>4. Winner Determined</h5>
            <p>Highest CPM bid that meets floor price wins. Ad is shown to user instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
  section: { marginBottom: "40px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
  },
  auctionCard: {
    backgroundColor: "white",
    border: "2px solid #60a5fa",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  auctionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "15px",
  },
  timer: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "8px 12px",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "1rem",
  },
  auctionInfo: { marginBottom: "15px" },
  bidFeed: {
    backgroundColor: "#f9fafb",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "15px",
    border: "1px solid #e5e7eb",
  },
  bidItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "0.9rem",
  },
  bidAmount: { fontWeight: "bold", color: "#2563eb" },
  noBidsText: { color: "#9ca3af", fontSize: "0.85rem", fontStyle: "italic" },
  detailsButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
  },
  completedAuctionCard: {
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  completedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  winnerBadge: {
    backgroundColor: "#d1fae5",
    padding: "10px 15px",
    borderRadius: "4px",
    textAlign: "right",
  },
  winnerLabel: { fontSize: "0.75rem", color: "#065f46", margin: "0" },
  winningPrice: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#059669",
    margin: "5px 0 0 0",
  },
  bidComparison: { marginTop: "15px" },
  bidsList: { display: "flex", flexDirection: "column", gap: "8px" },
  bidResultRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "0.9rem",
  },
  bidResultPrice: { fontWeight: "bold", color: "#2563eb" },
  infoSection: {
    backgroundColor: "#f0f9ff",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #bfdbfe",
    marginTop: "40px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
    marginTop: "15px",
  },
  infoCard: {
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "6px",
    border: "1px solid #dbeafe",
  },
  smallText: { fontSize: "0.85rem", color: "#9ca3af", margin: "4px 0 0 0" },
  highestBid: { color: "#dc2626", fontWeight: "bold" },
  emptyState: { color: "#9ca3af", textAlign: "center", padding: "20px" },
};
