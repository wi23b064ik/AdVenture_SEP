import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// === INTERFACES ===
interface Bid {
  id: string;
  advertiserName: string;
  bidAmountCPM: number;
  submitTime: string;
  status: string;
  impressions?: number;
  clicks?: number;
}

// UPDATE: Interface erweitert um Details
interface AuctionDetail {
  id: string;
  adSpaceName: string;
  adSpaceId: number;
  publisherName: string;
  startTime: string;
  endTime: string;
  status: string;
  minimumBidFloor: number;
  mediaUrl?: string;
  
  // NEUE FELDER
  width: number;
  height: number;
  category?: string;
  description?: string;

  allBids: Bid[];
}

export default function AuctionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/auctions/${id}`);
        if (!res.ok) throw new Error("Auction not found");
        const data = await res.json();
        setAuction(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading auction";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
    
    const interval = setInterval(fetchAuction, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (error || !auction) return <div style={styles.container}>Error: {error}</div>;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button onClick={() => navigate("/bidding")} style={styles.backButton}>
        ← Back to Overview
      </button>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={{margin: 0}}>
          {auction.adSpaceName} <span style={styles.idBadge}>#{auction.id}</span>
        </h1>
        <span style={{
            ...styles.statusBadge, 
            backgroundColor: auction.status === 'open' ? '#d1fae5' : '#e5e7eb',
            color: auction.status === 'open' ? '#065f46' : '#374151'
        }}>
            {auction.status.toUpperCase()}
        </span>
      </div>

      <div style={styles.grid}>
        {/* LEFT COLUMN: DETAILS */}
        <div style={styles.card}>
            {/* Image */}
            <div style={styles.imageContainer}>
                {auction.mediaUrl ? (
                    <img src={`http://localhost:3001${auction.mediaUrl}`} alt="Ad Space" style={styles.image} />
                ) : (
                    <div style={styles.placeholder}>No Image Available</div>
                )}
            </div>

            <div style={styles.detailsContent}>
                <h3>Ad Space Details</h3>
                
                {/* --- NEUE DETAILS: SIZE & CATEGORY --- */}
                <div style={styles.detailRow}>
                    <strong>Format (Size):</strong>
                    <span style={{fontFamily: 'monospace', fontSize: '1.1rem'}}>
                        {auction.width} x {auction.height} px
                    </span>
                </div>
                <div style={styles.detailRow}>
                    <strong>Category:</strong>
                    <span style={styles.tag}>{auction.category || 'General'}</span>
                </div>
                {/* -------------------------------------- */}

                <hr style={styles.divider} />

                <div style={styles.detailRow}>
                    <strong>Publisher:</strong>
                    <span>{auction.publisherName}</span>
                </div>
                <div style={styles.detailRow}>
                    <strong>Ad Space ID:</strong>
                    <span>#{auction.adSpaceId}</span>
                </div>

                <hr style={styles.divider} />

                <div style={styles.detailRow}>
                    <strong>Start Time:</strong>
                    <span>{formatDate(auction.startTime)}</span>
                </div>
                <div style={styles.detailRow}>
                    <strong>End Time:</strong>
                    <span>{formatDate(auction.endTime)}</span>
                </div>
                <div style={styles.detailRow}>
                    <strong>Floor Price:</strong>
                    <span style={{color: '#dc2626', fontWeight: 'bold'}}>€{Number(auction.minimumBidFloor).toFixed(2)} CPM</span>
                </div>

                {/* --- NEU: DESCRIPTION --- */}
                {auction.description && (
                    <div style={{marginTop: '20px'}}>
                        <strong>Description:</strong>
                        <p style={{color: '#666', fontSize: '0.9rem', lineHeight: '1.5', marginTop: '5px'}}>
                            {auction.description}
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: BID HISTORY */}
        <div style={styles.card}>
            <h3>Bid History ({auction.allBids.length})</h3>
            
            {auction.allBids.length === 0 ? (
                <p style={{color: '#888', fontStyle: 'italic', padding: '20px'}}>No bids placed yet.</p>
            ) : (
                <div style={styles.bidList}>
                    {auction.allBids.map((bid, index) => (
                        <div key={bid.id} style={{
                            ...styles.bidRow,
                            backgroundColor: index === 0 ? '#f0fdf4' : 'transparent',
                            borderLeft: index === 0 ? '4px solid #22c55e' : 'none'
                        }}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <span style={{fontWeight: 'bold'}}>
                                    #{index + 1} {bid.advertiserName}
                                </span>
                                <span style={{fontSize: '0.8rem', color: '#666'}}>
                                    {formatDate(bid.submitTime)}
                                </span>
                                {/* STATS ANZEIGE */}
                                <div style={{fontSize: '0.75rem', marginTop: '4px', color: '#4b5563', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', width: 'fit-content'}}>
                                    👁️ {bid.impressions || 0} &nbsp; 👆 {bid.clicks || 0}
                                </div>
                            </div>
                            <div style={{textAlign: 'right'}}>
                                <div style={styles.bidAmount}>€{Number(bid.bidAmountCPM).toFixed(2)}</div>
                                {index === 0 && <span style={styles.winnerLabel}>Highest</span>}
                                <div style={{fontSize:'0.7rem', color: '#999'}}>{bid.status.toUpperCase()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: "1100px", margin: "0 auto", padding: "40px 20px", fontFamily: "'Inter', sans-serif, Arial", color: '#1f2937' },
  backButton: { background: 'white', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px', fontWeight: '600', color: '#4b5563', transition: 'background 0.2s' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' },
  idBadge: { fontSize: '1.2rem', color: '#94a3b8', fontWeight: 'normal', marginLeft: '10px' },
  statusBadge: { padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.5px' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', alignItems: 'start' },
  card: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  
  imageContainer: { width: '100%', height: '300px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', objectFit: 'contain' },
  placeholder: { color: '#cbd5e1', fontWeight: 'bold', fontSize: '1.2rem' },
  
  detailsContent: { padding: '25px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed #f1f5f9' },
  divider: { border: '0', borderTop: '1px solid #e5e7eb', margin: '20px 0' },
  tag: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' },
  
  bidList: { padding: '0' },
  bidRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #f1f5f9' },
  bidAmount: { fontWeight: '800', color: '#2563eb', fontSize: '1.2rem' },
  winnerLabel: { fontSize: '0.7rem', color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }
};