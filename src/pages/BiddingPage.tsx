import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 

// === TYPEN & INTERFACES ===

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
    advertiserName: string;
  };
  allBids: BidSubmission[];
}

interface BidSubmission {
  id: string;
  auctionId: string;
  advertiserId: string;
  advertiserName?: string;
  campaignName: string;
  bidAmountCPM: number;
  submitTime: Date;
  status: "pending" | "accepted" | "rejected" | "won" | "lost";
}

interface AdSpace {
  id: number;
  name: string;
  width: number;
  height: number;
  min_bid: number;
  category: string;
}

// Hilfs-Interfaces für die "rohen" Daten vom Server
interface RawBid {
  id: string;
  auctionId: string;
  advertiserId: string;
  advertiserName?: string;
  campaignName: string;
  campaignId: string;
  bidAmountCPM: number | string;
  submitTime: string;
  status: "pending" | "accepted" | "rejected" | "won" | "lost";
}

interface RawAuction {
  id: string;
  adSpaceName: string;
  adSpaceId: string;
  publisherId: string;
  startTime: string;
  endTime: string;
  status: "open" | "closed";
  minimumBidFloor: number | string;
  totalBids: number;
  allBids: RawBid[];
  winningBid?: unknown; 
}

// === COMPONENT ===

export default function BiddingPage() {
  const navigate = useNavigate(); 
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});
  const [bidFormData, setBidFormData] = useState<{ [key: string]: { campaignId: string; bidAmount: string } }>({});
  const [placingBid, setPlacingBid] = useState<{ [key: string]: boolean }>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [publisherAdSpaces, setPublisherAdSpaces] = useState<AdSpace[]>([]);
  const [auctionFormData, setAuctionFormData] = useState({ adSpaceId: "", durationSeconds: "60" });
  const [creatingAuction, setCreatingAuction] = useState(false);
  const [expandedBidResults, setExpandedBidResults] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      } catch {
        console.log("Could not parse user data");
      }
    }
  }, []);

  const fetchPublisherAdSpaces = async (publisherId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/ad-spaces/publisher/${publisherId}`);
      if (!response.ok) throw new Error("Failed to fetch ad spaces");
      const data = await response.json();
      setPublisherAdSpaces(data);
    } catch (err: unknown) {
      console.error("Error fetching ad spaces:", err);
    }
  };

  const fetchAuctions = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/auctions");
      if (!response.ok) throw new Error("Failed to fetch auctions");
      
      const data = await response.json() as RawAuction[];
      
      const auctionsWithDates: Auction[] = data.map((auction) => ({
        id: auction.id,
        adSpaceId: auction.adSpaceId,
        adSpaceName: auction.adSpaceName,
        publisherId: auction.publisherId,
        startTime: new Date(auction.startTime), 
        endTime: new Date(auction.endTime),
        status: auction.status,
        minimumBidFloor: typeof auction.minimumBidFloor === 'string' ? parseFloat(auction.minimumBidFloor) : auction.minimumBidFloor,
        totalBids: auction.totalBids || 0,
        allBids: (auction.allBids || []).map((bid) => ({
          id: bid.id,
          auctionId: auction.id,
          advertiserId: bid.advertiserId,
          advertiserName: bid.advertiserName,
          campaignName: bid.campaignName || 'Unknown',
          campaignId: bid.campaignId || "", 
          bidAmountCPM: typeof bid.bidAmountCPM === 'string' ? parseFloat(bid.bidAmountCPM) : bid.bidAmountCPM,
          submitTime: new Date(bid.submitTime),
          status: bid.status,
        })),
        winningBid: auction.winningBid as Auction['winningBid']
      }));
      
      setAuctions(auctionsWithDates);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching auctions:", err);
      setLoading((prev) => {
          if(prev) {
             const message = err instanceof Error ? err.message : "An error occurred";
             setError(message);
          }
          return false;
      });
    } finally {
      setLoading(false);
    }
  }, []); 

  const handleStartAuction = async () => {
    if (!auctionFormData.adSpaceId || !auctionFormData.durationSeconds) {
      alert("Please select an ad space and set duration");
      return;
    }

    try {
      setCreatingAuction(true);
      const now = new Date();
      const endTime = new Date(now.getTime() + parseInt(auctionFormData.durationSeconds) * 1000);

      const response = await fetch("http://localhost:3001/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          ad_space_id: parseInt(auctionFormData.adSpaceId),
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          minimum_bid_floor: publisherAdSpaces.find(a => a.id === parseInt(auctionFormData.adSpaceId))?.min_bid || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error: ${result.message}`);
      } else {
        alert("Auction started successfully!");
        setAuctionFormData({ adSpaceId: "", durationSeconds: "60" });
        fetchAuctions();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert("Failed to start auction: " + message);
    } finally {
      setCreatingAuction(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAuctions();
    const refreshInterval = setInterval(fetchAuctions, 3000);
    return () => clearInterval(refreshInterval);
  }, [fetchAuctions]);

  useEffect(() => {
    if (userRole === "Publisher") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          fetchPublisherAdSpaces(user.id);
        } catch {
          console.log("Could not parse user data");
        }
      }
    }
  }, [userRole]);

  const handlePlaceBid = async (auctionId: string) => {
    const bidData = bidFormData[auctionId];
    if (!bidData || !bidData.campaignId || !bidData.bidAmount) {
      alert("Please fill in all bid fields");
      return;
    }

    try {
      setPlacingBid({ ...placingBid, [auctionId]: true });
      
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user || !user.id) {
        alert("You must be logged in to place a bid");
        return;
      }

      const response = await fetch(`http://localhost:3001/api/auctions/${auctionId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          campaign_id: parseInt(bidData.campaignId),
          advertiser_id: user.id, 
          bid_amount: parseFloat(bidData.bidAmount),
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        alert(`Error: ${result.message}`);
      } else {
        alert("Bid placed successfully!");
        setBidFormData({ ...bidFormData, [auctionId]: { campaignId: "", bidAmount: "" } });
        fetchAuctions();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert("Failed to place bid: " + message);
    } finally {
      setPlacingBid({ ...placingBid, [auctionId]: false });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const updated: { [key: string]: string } = {};
      const now = new Date().getTime();

      auctions.forEach((auction) => {
        if (auction.status === "open") {
          const diff = auction.endTime.getTime() - now;
          
          if (diff > 0) {
            const seconds = Math.floor((diff / 1000) % 60);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            updated[auction.id] = `${minutes}m ${seconds}s`;
          } else {
            updated[auction.id] = "Closing..."; 
          }
        } else {
          updated[auction.id] = "Closed";
        }
      });
      setTimeLeft(updated);
    }, 1000);

    return () => clearInterval(timer);
  }, [auctions]);

  const closedAuctions = auctions.filter((a) => a.status === "closed");
  const openAuctions = auctions.filter((a) => a.status === "open");

  return (
    <div style={styles.container}>
      <h2>Real-Time Bidding Auctions (OpenRTB)</h2>
      <p>
        Advertisers compete in real-time auctions for ad spaces. Prices are based on CPM (Cost Per 1000 Impressions).
      </p>

      {/* Start Auction Section (Publisher Only) */}
      {userRole === "Publisher" && (
        <div style={styles.publisherSection}>
          <h3>🎯 Start New Auction</h3>
          <div style={styles.auctionFormGroup}>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Select Ad Space:</label>
                <select
                  value={auctionFormData.adSpaceId}
                  onChange={(e) =>
                    setAuctionFormData({ ...auctionFormData, adSpaceId: e.target.value })
                  }
                  style={styles.select}
                >
                  <option value="">-- Choose an ad space --</option>
                  {publisherAdSpaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name} ({space.width}x{space.height}) - Min: €{space.min_bid}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formField}>
                <label style={styles.label}>Auction Duration:</label>
                <select
                  value={auctionFormData.durationSeconds}
                  onChange={(e) =>
                    setAuctionFormData({ ...auctionFormData, durationSeconds: e.target.value })
                  }
                  style={styles.select}
                >
                  <option value="60">1 Minute (60 sec)</option>
                  <option value="120">2 Minutes (120 sec)</option>
                  <option value="180">3 Minutes (180 sec)</option>
                  <option value="300">5 Minutes (300 sec)</option>
                  <option value="600">10 Minutes (600 sec)</option>
                </select>
              </div>

              <button
                onClick={handleStartAuction}
                disabled={creatingAuction || !auctionFormData.adSpaceId}
                style={{
                  ...styles.startAuctionButton,
                  opacity: creatingAuction || !auctionFormData.adSpaceId ? 0.6 : 1,
                }}
              >
                {creatingAuction ? "Starting..." : "🚀 Start Auction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={styles.errorBox}>
          <p>⚠️ Error: {error}</p>
          <button onClick={() => fetchAuctions()} style={styles.retryButton}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && auctions.length === 0 && (
        <div style={styles.loadingBox}>
          <p>Loading auctions...</p>
        </div>
      )}

      {/* No Auctions */}
      {!loading && auctions.length === 0 && !error && (
        <div style={styles.emptyState}>
          <p>No auctions available at the moment.</p>
        </div>
      )}

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

                {/* Button zu Details */}
                <button 
                  style={styles.detailsButton}
                  onClick={() => navigate(`/auction/${auction.id}`)}
                >
                  View Details
                </button>

                {/* Bid Placement Form - ONLY FOR ADVERTISERS */}
                {auction.status === "open" && userRole === "Advertiser" && (
                  <div style={styles.bidFormContainer}>
                    <h5 style={styles.bidFormTitle}>Place Your Bid</h5>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Campaign ID:</label>
                      <input
                        type="number"
                        placeholder="Enter campaign ID"
                        value={bidFormData[auction.id]?.campaignId || ""}
                        onChange={(e) =>
                          setBidFormData({
                            ...bidFormData,
                            [auction.id]: {
                              ...(bidFormData[auction.id] || { bidAmount: "" }),
                              campaignId: e.target.value,
                            },
                          })
                        }
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Bid Amount (CPM €):</label>
                      <input
                        type="number"
                        placeholder="Must be >= €0.50"
                        step="0.01"
                        value={bidFormData[auction.id]?.bidAmount || ""}
                        onChange={(e) =>
                          setBidFormData({
                            ...bidFormData,
                            [auction.id]: {
                              ...(bidFormData[auction.id] || { campaignId: "" }),
                              bidAmount: e.target.value,
                            },
                          })
                        }
                        style={styles.input}
                      />
                    </div>
                    <button
                      onClick={() => handlePlaceBid(auction.id)}
                      disabled={placingBid[auction.id]}
                      style={{
                        ...styles.bidButton,
                        opacity: placingBid[auction.id] ? 0.6 : 1,
                      }}
                    >
                      {placingBid[auction.id] ? "Placing Bid..." : "Place Bid"}
                    </button>
                  </div>
                )}

                {/* Message for Publishers */}
                {auction.status === "open" && userRole === "Publisher" && (
                  <div style={{
                    backgroundColor: "#fef3c7",
                    border: "1px solid #fbbf24",
                    padding: "12px",
                    borderRadius: "6px",
                    marginTop: "12px",
                    color: "#92400e",
                    fontSize: "0.9rem"
                  }}>
                    📊 Advertisers are bidding on this auction. Final winner will be determined when the timer ends.
                  </div>
                )}
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
              const winner = auction.winningBid || (auction.allBids.length > 0 ? auction.allBids[0] : null);
              const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
              const isCurrentUserWinner = winner && currentUser && winner.advertiserId === currentUser.id;
              
              return (
                <div key={auction.id} style={styles.completedAuctionCard}>
                  <div style={{
                    ...styles.completedHeader,
                    backgroundColor: isCurrentUserWinner ? '#f0fdf4' : '#f9fafb',
                    borderLeft: isCurrentUserWinner ? '4px solid #16a34a' : '1px solid #e5e7eb'
                  }}>
                    <div>
                      <h4>{auction.adSpaceName}</h4>
                      <p style={styles.smallText}>{auction.adSpaceId}</p>
                    </div>
                    <div style={{
                      ...styles.winnerBadge,
                      background: isCurrentUserWinner 
                        ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                        : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
                    }}>
                      {winner ? (
                        <>
                          <p style={styles.winnerLabel}>
                            {isCurrentUserWinner ? '🎉 YOU WON!' : '🏆 Winner'}
                          </p>
                          <p style={styles.winningPrice}>
                            €{winner.bidAmountCPM.toFixed(2)} CPM
                          </p>
                          <p style={{...styles.smallText, color: 'rgba(255, 255, 255, 0.95)', margin: '10px 0 0 0', fontWeight: '600', fontSize: '0.95rem'}}>
                            {winner.campaignName}
                          </p>
                          <p style={{...styles.smallText, color: 'rgba(255, 255, 255, 0.8)', margin: '4px 0 0 0', fontSize: '0.85rem'}}>
                            {winner.advertiserName && `by ${winner.advertiserName}`}
                          </p>
                        </>
                      ) : (
                        <p style={{color: 'white', fontWeight: 'bold'}}>No bids</p>
                      )}
                    </div>
                  </div>

                  <div style={styles.bidComparison}>
                    {/* --- NEU: HIER WURDE DER BUTTON HINZUGEFÜGT --- */}
                    <button 
                      style={{...styles.detailsButton, marginBottom: '15px'}}
                      onClick={() => navigate(`/auction/${auction.id}`)}
                    >
                      View Details
                    </button>

                    {auction.allBids.length > 0 && (
                      <>
                        <button
                          onClick={() => setExpandedBidResults({...expandedBidResults, [auction.id]: !expandedBidResults[auction.id]})}
                          style={{
                            ...styles.bidResultsToggle,
                            backgroundColor: expandedBidResults[auction.id] ? "#3b82f6" : "#6b7280",
                          }}
                        >
                          <span>{expandedBidResults[auction.id] ? "▼" : "▶"}</span> Bid Results ({auction.allBids.length})
                        </button>
                        
                        {expandedBidResults[auction.id] && (
                          <div style={styles.bidsList}>
                            {auction.allBids
                              .sort((a, b) => b.bidAmountCPM - a.bidAmountCPM)
                              .map((bid, idx) => (
                                <div
                                  key={bid.id}
                                  style={{
                                    ...styles.bidResultRow,
                                    backgroundColor:
                                      bid.status === "won" || idx === 0 ? "#d1fae5" : "#f3f4f6",
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
                                      color: bid.status === "won" || idx === 0 ? "#16a34a" : "#9ca3af",
                                      fontWeight: bid.status === "won" || idx === 0 ? "bold" : "normal",
                                    }}
                                  >
                                    {bid.status === "won" || idx === 0 ? "🏆 Won" : "Lost"}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
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
    padding: "15px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  winnerBadge: {
    padding: "20px 24px",
    borderRadius: "12px",
    textAlign: "right",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    minWidth: "220px",
  },
  winnerLabel: { 
    fontSize: "0.75rem", 
    color: "white", 
    margin: "0",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  winningPrice: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "white",
    margin: "10px 0 8px 0",
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
  errorBox: {
    backgroundColor: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "20px",
  },
  retryButton: {
    backgroundColor: "#dc2626",
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
  },
  loadingBox: {
    backgroundColor: "#f0f9ff",
    padding: "20px",
    borderRadius: "6px",
    textAlign: "center",
    color: "#3b82f6",
  },
  bidFormContainer: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "12px",
    marginTop: "12px",
  },
  bidFormTitle: {
    margin: "0 0 10px 0",
    fontSize: "0.95rem",
    color: "#1e40af",
  },
  formGroup: {
    marginBottom: "10px",
  },
  label: {
    display: "block",
    fontSize: "0.8rem",
    color: "#1f2937",
    marginBottom: "4px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #bfdbfe",
    borderRadius: "4px",
    fontSize: "0.9rem",
    boxSizing: "border-box" as const,
  },
  bidButton: {
    backgroundColor: "#22c55e",
    color: "white",
    padding: "8px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
  publisherSection: {
    backgroundColor: "#fef3c7",
    border: "2px solid #fbbf24",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "30px",
  },
  auctionFormGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  formRow: {
    display: "flex",
    gap: "15px",
    alignItems: "flex-end",
    flexWrap: "wrap" as const,
  },
  formField: {
    flex: 1,
    minWidth: "200px",
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #fbbf24",
    borderRadius: "4px",
    fontSize: "0.9rem",
    backgroundColor: "white",
    boxSizing: "border-box" as const,
  },
  startAuctionButton: {
    backgroundColor: "#f59e0b",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1rem",
    whiteSpace: "nowrap" as const,
  },
  bidResultsToggle: {
    color: "white",
    padding: "10px 15px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.95rem",
    width: "100%",
    textAlign: "left" as const,
    marginBottom: "10px",
    transition: "background-color 0.3s",
  },
};