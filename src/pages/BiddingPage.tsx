import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom"; 

// === INTERFACES & TYPES ===

interface BidSubmission {
  id: string; 
  auctionId: string;
  advertiserId: string;
  advertiserName?: string;
  campaignName: string;
  campaignId: string; 
  bidAmountCPM: number;
  submitTime: Date;
  status: "pending" | "accepted" | "rejected" | "won" | "lost";
  impressions?: number;
  clicks?: number;
}

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
  winningBid?: BidSubmission; 
  allBids: BidSubmission[];
}

interface AdSpace {
  id: number;
  name: string;
  width: number;
  height: number;
  min_bid: number;
  category: string;
}

// Typ für die Dropdown-Liste der Kampagnen
interface AdvertiserCampaign {
  id: number;
  campaign_name: string;
}

// Helper Interfaces for Raw Data
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
  impressions?: number;
  clicks?: number;
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
  winningBid?: RawBid; 
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
  
  // Daten für Dropdowns
  const [publisherAdSpaces, setPublisherAdSpaces] = useState<AdSpace[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<AdvertiserCampaign[]>([]); // NEU: Kampagnen des Advertisers
  
  const [auctionFormData, setAuctionFormData] = useState({ adSpaceId: "", durationSeconds: "3600" });
  
  const [creatingAuction, setCreatingAuction] = useState(false);
  const [expandedBidResults, setExpandedBidResults] = useState<{ [key: string]: boolean }>({});

  const hasTrackedImpressions = useRef(false);

  // User Role & ID ermitteln
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role);
        
        // Wenn Advertiser: Eigene Kampagnen laden
        if (user.role === 'Advertiser') {
            fetchMyCampaigns(user.id);
        }
      } catch { console.log("User parse error"); }
    }
  }, []);

  // NEU: Funktion zum Laden der Kampagnen für das Dropdown
  const fetchMyCampaigns = async (advertiserId: number) => {
    try {
        const res = await fetch(`http://localhost:3001/api/campaigns/${advertiserId}`);
        if(res.ok) {
            const data = await res.json();
            // Wir erwarten ein Array von Kampagnen
            setMyCampaigns(Array.isArray(data) ? data : []);
        }
    } catch (err) {
        console.error("Failed to load campaigns", err);
    }
  };

  const fetchPublisherAdSpaces = async (publisherId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/ad-spaces/publisher/${publisherId}`);
      if (!response.ok) throw new Error("Failed to fetch ad spaces");
      const data = await response.json();
      setPublisherAdSpaces(data);
    } catch (err) { console.error(err); }
  };

  const fetchAuctions = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/auctions");
      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Server Error (${response.status}): ${errText}`);
      }
      
      const data = await response.json() as RawAuction[];
      
      const auctionsWithDates: Auction[] = data.map((auction) => {
        const mapBid = (bid: RawBid): BidSubmission => ({
          id: bid.id,
          auctionId: auction.id,
          advertiserId: bid.advertiserId,
          advertiserName: bid.advertiserName,
          campaignName: bid.campaignName || 'Unknown',
          campaignId: bid.campaignId || "", 
          bidAmountCPM: typeof bid.bidAmountCPM === 'string' ? parseFloat(bid.bidAmountCPM) : bid.bidAmountCPM,
          submitTime: new Date(bid.submitTime),
          status: bid.status,
          impressions: bid.impressions || 0,
          clicks: bid.clicks || 0
        });

        return {
          id: auction.id,
          adSpaceId: auction.adSpaceId,
          adSpaceName: auction.adSpaceName,
          publisherId: auction.publisherId,
          startTime: new Date(auction.startTime), 
          endTime: new Date(auction.endTime),
          status: auction.status,
          minimumBidFloor: typeof auction.minimumBidFloor === 'string' ? parseFloat(auction.minimumBidFloor) : auction.minimumBidFloor,
          totalBids: auction.totalBids || 0,
          allBids: (auction.allBids || []).map(mapBid),
          winningBid: auction.winningBid ? mapBid(auction.winningBid) : undefined
        };
      });
      
      setAuctions(auctionsWithDates);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching auctions:", err);
      setLoading((prev) => prev ? false : prev);
      const msg = err instanceof Error ? err.message : "Connection failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []); 

  // === IMPRESSION TRACKING ===
  useEffect(() => {
    if (auctions.length > 0 && !hasTrackedImpressions.current) {
        auctions.forEach(auction => {
            let bidIdToTrack: string | undefined;
            if (auction.winningBid?.id) {
                bidIdToTrack = auction.winningBid.id;
            } else if (auction.allBids.length > 0) {
                 const highestBid = [...auction.allBids].sort((a,b) => b.bidAmountCPM - a.bidAmountCPM)[0];
                 bidIdToTrack = highestBid.id;
            }

            if (bidIdToTrack) {
                fetch(`http://localhost:3001/api/stats/view/${bidIdToTrack}`, { method: 'POST' })
                    .catch(e => console.error(e));
            }
        });
        hasTrackedImpressions.current = true;
    }
  }, [auctions]);

  // === CLICK TRACKING ===
  const handleViewDetails = async (auctionId: string, bidId?: string) => {
    if (bidId) {
        try {
            await fetch(`http://localhost:3001/api/stats/click/${bidId}`, { method: 'POST' });
        } catch (error) { console.error(error); }
    }
    navigate(`/auction/${auctionId}`);
  };

  const handleStartAuction = async () => {
    if (!auctionFormData.adSpaceId || !auctionFormData.durationSeconds) { alert("Please select space/duration"); return; }
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
      if (response.ok) {
        alert("Auction started!");
        setAuctionFormData({ adSpaceId: "", durationSeconds: "3600" });
        fetchAuctions();
      } else { alert("Error starting auction"); }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert("Error: " + msg);
    } finally {
      setCreatingAuction(false);
    }
  };

  const handlePlaceBid = async (auctionId: string) => {
    const bidData = bidFormData[auctionId];
    if (!bidData?.campaignId || !bidData?.bidAmount) { alert("Please select a campaign and enter an amount"); return; }
    
    try {
      setPlacingBid({ ...placingBid, [auctionId]: true });
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      if (!user?.id) { alert("Login required"); return; }

      const response = await fetch(`http://localhost:3001/api/auctions/${auctionId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          campaign_id: parseInt(bidData.campaignId), // ID kommt jetzt aus dem Select
          advertiser_id: user.id, 
          bid_amount: parseFloat(bidData.bidAmount),
        }),
      });
      if (response.ok) {
        alert("Bid placed successfully!");
        setBidFormData({ ...bidFormData, [auctionId]: { campaignId: "", bidAmount: "" } });
        fetchAuctions();
      } else { 
        const errJson = await response.json();
        alert("Error: " + (errJson.message || "Could not place bid")); 
      }
    } catch (err: unknown) { 
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert("System Error: " + msg);
    } finally { 
      setPlacingBid({ ...placingBid, [auctionId]: false }); 
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 3000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  useEffect(() => {
    if (userRole === "Publisher") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          fetchPublisherAdSpaces(user.id);
        } catch { console.log("User parse error"); }
      }
    }
  }, [userRole]);

  useEffect(() => {
    const timer = setInterval(() => {
      const updated: { [key: string]: string } = {};
      const now = new Date().getTime();
      auctions.forEach((auction) => {
        if (auction.status === "open") {
          const diff = auction.endTime.getTime() - now;
          if (diff > 0) {
            const seconds = Math.floor((diff / 1000) % 60);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const hours = Math.floor((diff / (1000 * 60 * 60)));
            updated[auction.id] = `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
          } else { updated[auction.id] = "Closing..."; }
        } else { updated[auction.id] = "Closed"; }
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
      <p>Advertisers compete in real-time. Prices are CPM.</p>

      {userRole === "Publisher" && (
        <div style={styles.publisherSection}>
          <h3>🎯 Start New Auction</h3>
          <div style={styles.formRow}>
            <select value={auctionFormData.adSpaceId} onChange={(e) => setAuctionFormData({...auctionFormData, adSpaceId: e.target.value})} style={styles.select}>
               <option value="">-- Select Ad Space --</option>
               {publisherAdSpaces.map(s => <option key={s.id} value={s.id}>{s.name} (Min: €{s.min_bid})</option>)}
            </select>
            
            <select value={auctionFormData.durationSeconds} onChange={(e) => setAuctionFormData({...auctionFormData, durationSeconds: e.target.value})} style={styles.select}>
               <option value="60">1 Minute (Test)</option>
               <option value="300">5 Minutes</option>
               <option value="1800">30 Minutes</option>
               <option value="3600">1 Hour</option>
               <option value="10800">3 Hours</option>
               <option value="43200">12 Hours</option>
               <option value="86400">24 Hours</option>
            </select>

            <button onClick={handleStartAuction} disabled={creatingAuction || !auctionFormData.adSpaceId} style={styles.startAuctionButton}>
               {creatingAuction ? "Starting..." : "🚀 Start Auction"}
            </button>
          </div>
        </div>
      )}

      {loading && <p style={styles.loadingBox}>Loading...</p>}
      {error && <div style={styles.errorBox}><strong>Error:</strong> {error} <br/><button onClick={()=>fetchAuctions()} style={styles.retryButton}>Retry</button></div>}

      <div style={styles.section}>
        <h3>🔴 Active Auctions ({openAuctions.length})</h3>
        <div style={styles.grid}>
          {openAuctions.map((auction) => {
            const highestBid = auction.allBids.length > 0 
                ? [...auction.allBids].sort((a,b) => b.bidAmountCPM - a.bidAmountCPM)[0] 
                : null;

            return (
              <div key={auction.id} style={styles.auctionCard}>
                <div style={styles.auctionHeader}>
                  <h4>{auction.adSpaceName}</h4>
                  <div style={styles.timer}>{timeLeft[auction.id]}</div>
                </div>
                <div style={styles.auctionInfo}>
                  <p>Floor: €{auction.minimumBidFloor.toFixed(2)} | Bids: {auction.totalBids}</p>
                  
                  {highestBid ? (
                      <div style={{marginTop: '5px'}}>
                         <p>Current Highest: <span style={styles.highestBid}>€{highestBid.bidAmountCPM.toFixed(2)}</span></p>
                         <div style={styles.liveStats}>
                             <span title="Live Impressions">👁️ {highestBid.impressions || 0}</span>
                             <span title="Live Clicks">👆 {highestBid.clicks || 0}</span>
                         </div>
                      </div>
                  ) : (
                      <p style={{color: '#9ca3af', fontStyle: 'italic'}}>No bids yet</p>
                  )}
                </div>
                
                <button 
                  style={styles.detailsButton} 
                  onClick={() => handleViewDetails(auction.id, highestBid?.id)}
                >
                  View Details
                </button>

                {/* === ÄNDERUNG: SELECT STATT INPUT FÜR KAMPAGNE === */}
                {auction.status === "open" && userRole === "Advertiser" && (
                  <div style={styles.bidFormContainer}>
                      {myCampaigns.length > 0 ? (
                          <select 
                            value={bidFormData[auction.id]?.campaignId || ""} 
                            onChange={(e) => setBidFormData({...bidFormData, [auction.id]: {...(bidFormData[auction.id]||{}), campaignId: e.target.value}})} 
                            style={styles.selectInput}
                          >
                            <option value="">-- Select Your Campaign --</option>
                            {myCampaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.campaign_name}</option>
                            ))}
                          </select>
                      ) : (
                          <p style={{fontSize: '0.8rem', color: 'red'}}>No active campaigns found. Please create one.</p>
                      )}

                      <input type="number" placeholder="€ CPM" step="0.01" onChange={(e) => setBidFormData({...bidFormData, [auction.id]: {...(bidFormData[auction.id]||{}), bidAmount: e.target.value}})} style={{...styles.input, marginTop: '5px'}} />
                      
                      <button onClick={() => handlePlaceBid(auction.id)} disabled={placingBid[auction.id]} style={{...styles.bidButton, marginTop: '5px'}}>
                        {placingBid[auction.id] ? "..." : "Bid"}
                      </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.section}>
        <h3>✅ Completed Auctions ({closedAuctions.length})</h3>
        <div>
          {closedAuctions.map((auction) => {
            const winner = auction.winningBid || (auction.allBids.length > 0 ? auction.allBids[0] : null);
            const isWinner = winner && localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')!).id === winner.advertiserId;
            
            return (
              <div key={auction.id} style={styles.completedAuctionCard}>
                <div style={{...styles.completedHeader, backgroundColor: isWinner ? '#f0fdf4' : '#f9fafb', borderLeft: isWinner ? '4px solid #16a34a' : '1px solid #e5e7eb'}}>
                  <h4>{auction.adSpaceName}</h4>
                  <div style={{...styles.winnerBadge, background: isWinner ? '#16a34a' : '#4f46e5'}}>
                    {winner ? (
                      <>
                        <p style={styles.winnerLabel}>{isWinner ? 'YOU WON!' : 'WINNER'}</p>
                        <p style={styles.winningPrice}>€{winner.bidAmountCPM.toFixed(2)}</p>
                        <p style={{color:'white', fontSize:'0.8rem'}}>{winner.campaignName}</p>
                        <div style={styles.statsRow}>
                           <span title="Total Views">👁️ {winner.impressions || 0}</span>
                           <span title="Total Clicks">👆 {winner.clicks || 0}</span>
                        </div>
                      </>
                    ) : <p style={{color:'white'}}>No bids</p>}
                  </div>
                </div>
                
                <button style={{...styles.detailsButton, marginBottom:'10px'}} onClick={() => handleViewDetails(auction.id, winner?.id)}>View Details</button>

                {auction.allBids.length > 0 && (
                   <button onClick={() => setExpandedBidResults({...expandedBidResults, [auction.id]: !expandedBidResults[auction.id]})} style={styles.bidResultsToggle}>
                     {expandedBidResults[auction.id] ? "Hide" : "Show"} Results
                   </button>
                )}
                
                {expandedBidResults[auction.id] && (
                  <div style={styles.bidsList}>
                    {auction.allBids.map((bid, i) => (
                      <div key={bid.id} style={{...styles.bidResultRow, backgroundColor: i===0 || bid.status==='won' ? '#d1fae5' : '#f3f4f6'}}>
                        <span>#{i+1} {bid.campaignName}</span>
                        <span>€{bid.bidAmountCPM.toFixed(2)}</span>
                        <span style={{fontSize:'0.8rem', color:'#666'}}>({bid.impressions || 0}v / {bid.clicks || 0}c)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily:'Arial, sans-serif' },
  section: { marginBottom: "40px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  auctionCard: { backgroundColor: "white", border: "2px solid #60a5fa", borderRadius: "8px", padding: "15px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  auctionHeader: { display: "flex", justifyContent: "space-between", marginBottom: "15px" },
  timer: { backgroundColor: "#fee2e2", color: "#dc2626", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" },
  auctionInfo: { marginBottom: "15px" },
  detailsButton: { backgroundColor: "#3b82f6", color: "white", padding: "8px", border: "none", borderRadius: "4px", cursor: "pointer", width: "100%", fontWeight: "bold" },
  completedAuctionCard: { backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "15px", marginBottom: "15px" },
  completedHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", padding: "15px", borderRadius: "8px" },
  winnerBadge: { padding: "15px", borderRadius: "8px", color: "white", textAlign: "right", minWidth: "180px" },
  winnerLabel: { fontSize: "0.7rem", fontWeight: "800", margin: 0 },
  winningPrice: { fontSize: "1.5rem", fontWeight: "bold", margin: "5px 0" },
  statsRow: { display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '8px', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '5px' },
  liveStats: { display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.9rem', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '5px', borderRadius: '4px', width: 'fit-content' },
  bidResultsToggle: { backgroundColor: '#6b7280', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  bidsList: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' },
  bidResultRow: { display: 'flex', justifyContent: 'space-between', padding: '8px', borderRadius: '4px', fontSize: '0.9rem' },
  highestBid: { color: "#dc2626", fontWeight: "bold" },
  loadingBox: { textAlign: 'center', padding: '20px', color: '#666' },
  errorBox: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '4px', textAlign: 'center' },
  retryButton: { marginTop: '10px', padding: '5px 10px', cursor: 'pointer' },
  bidFormContainer: { marginTop: '10px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '4px' },
  input: { width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
  selectInput: { width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: 'white' },
  bidButton: { width: '100%', backgroundColor: '#22c55e', color: 'white', padding: '6px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  publisherSection: { marginBottom: '20px', padding: '15px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px' },
  formRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  select: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
  startAuctionButton: { padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};