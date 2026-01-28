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
  
  
  width: number;
  height: number;
  category?: string;
  description?: string;
  websiteUrl?: string; 

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
        <div>
            <h1 style={{margin: 0, fontSize: '1.8rem', color: '#111827'}}>
              {auction.adSpaceName} 
            </h1>
            <div style={{display:'flex', gap:'10px', alignItems:'center', marginTop:'5px'}}>
                <span style={styles.idBadge}>Auction ID: #{auction.id}</span>
                <span style={styles.idBadge}>|</span>
                <span style={styles.idBadge}>Space ID: #{auction.adSpaceId}</span>
            </div>
        </div>
        <span style={{
            ...styles.statusBadge, 
            backgroundColor: auction.status === 'open' ? '#dcfce7' : '#f3f4f6',
            color: auction.status === 'open' ? '#166534' : '#374151',
            border: auction.status === 'open' ? '1px solid #86efac' : '1px solid #d1d5db'
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
                    <div style={styles.placeholder}>No Preview Image</div>
                )}
            </div>

            <div style={styles.detailsContent}>
                <h3 style={{marginTop:0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Ad Space Specification</h3>
                
                {/* --- SPECS GRID --- */}
                <div style={styles.specsGrid}>
                    <div style={styles.specItem}>
                        <div style={styles.specLabel}>Format</div>
                        <div style={styles.specValue}>{auction.width} x {auction.height} px</div>
                    </div>
                    <div style={styles.specItem}>
                        <div style={styles.specLabel}>Category</div>
                        <div style={styles.specValue}>
                            <span style={styles.tag}>{auction.category || 'General'}</span>
                        </div>
                    </div>
                    <div style={styles.specItem}>
                        <div style={styles.specLabel}>Floor Price</div>
                        <div style={styles.specValue}><span style={{color: '#dc2626'}}>€{Number(auction.minimumBidFloor).toFixed(2)}</span> CPM</div>
                    </div>
                    <div style={styles.specItem}>
                        <div style={styles.specLabel}>Publisher</div>
                        <div style={styles.specValue}>{auction.publisherName}</div>
                    </div>
                </div>

                {/* --- WEBSITE URL (NEU) --- */}
                {auction.websiteUrl && (
                    <div style={{marginTop: '20px'}}>
                        <div style={styles.specLabel}>Target Website</div>
                        <a href={auction.websiteUrl} target="_blank" rel="noreferrer" style={styles.link}>
                            {auction.websiteUrl} ↗
                        </a>
                    </div>
                )}

                {/* --- DESCRIPTION --- */}
                {auction.description && (
                    <div style={{marginTop: '20px'}}>
                        <div style={styles.specLabel}>Description</div>
                        <p style={{color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.6', marginTop: '5px', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px'}}>
                            {auction.description}
                        </p>
                    </div>
                )}

                <hr style={styles.divider} />

                <div style={styles.timeInfo}>
                    <div style={{flex:1}}>
                        <span style={styles.timeLabel}>Start Time</span>
                        <div style={styles.timeValue}>{formatDate(auction.startTime)}</div>
                    </div>
                    <div style={{flex:1}}>
                        <span style={styles.timeLabel}>End Time</span>
                        <div style={styles.timeValue}>{formatDate(auction.endTime)}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: BID HISTORY */}
        <div style={styles.card}>
            <div style={{padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa'}}>
                <h3 style={{margin:0}}>Bid History ({auction.allBids.length})</h3>
            </div>
            
            {auction.allBids.length === 0 ? (
                <div style={{padding: '40px', textAlign: 'center'}}>
                    <div style={{fontSize: '2rem', marginBottom: '10px'}}>📭</div>
                    <p style={{color: '#6b7280', fontStyle: 'italic'}}>No bids placed yet.</p>
                </div>
            ) : (
                <div style={styles.bidList}>
                    {auction.allBids.map((bid, index) => (
                        <div key={bid.id} style={{
                            ...styles.bidRow,
                            backgroundColor: index === 0 ? '#f0fdf4' : 'transparent',
                            borderLeft: index === 0 ? '4px solid #22c55e' : '4px solid transparent'
                        }}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <span style={{fontWeight: '700', color: '#1f2937'}}>
                                        {bid.advertiserName}
                                    </span>
                                    {index === 0 && <span style={styles.winnerLabel}>CURRENT LEADER</span>}
                                </div>
                                <span style={{fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px'}}>
                                    {formatDate(bid.submitTime)}
                                </span>
                                {/* STATS ANZEIGE */}
                                <div style={styles.statsRow}>
                                    <span title="Impressions">👁️ {bid.impressions || 0}</span>
                                    <span title="Clicks">👆 {bid.clicks || 0}</span>
                                </div>
                            </div>
                            <div style={{textAlign: 'right'}}>
                                <div style={styles.bidAmount}>€{Number(bid.bidAmountCPM).toFixed(2)}</div>
                                {bid.status !== 'accepted' && bid.status !== 'pending' && (
                                    <div style={{fontSize:'0.7rem', marginTop: '4px', color: '#6b7280', fontWeight: 'bold'}}>
                                        {bid.status.toUpperCase()}
                                    </div>
                                )}
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
  backButton: { background: 'white', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px', fontWeight: '600', color: '#4b5563', transition: 'background 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' },
  idBadge: { fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' },
  statusBadge: { padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.05em' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '30px', alignItems: 'start' },
  
  card: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
  
  imageContainer: { width: '100%', height: '300px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', objectFit: 'contain' },
  placeholder: { color: '#9ca3af', fontWeight: '600', fontSize: '1.1rem' },
  
  detailsContent: { padding: '30px' },
  
  // Specs Grid
  specsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  specItem: { display: 'flex', flexDirection: 'column' },
  specLabel: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.05em' },
  specValue: { fontSize: '1rem', fontWeight: '600', color: '#111827' },
  
  tag: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' },
  link: { color: '#2563eb', textDecoration: 'underline', fontWeight: '500' },
  
  divider: { border: 0, borderTop: '1px solid #e5e7eb', margin: '25px 0' },
  
  timeInfo: { display: 'flex', gap: '20px' },
  timeLabel: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: '700' },
  timeValue: { fontSize: '0.95rem', color: '#374151' },
  
  // Bid List
  bidList: { padding: '0' },
  bidRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #f3f4f6' },
  bidAmount: { fontWeight: '800', color: '#111827', fontSize: '1.2rem' },
  winnerLabel: { fontSize: '0.65rem', color: '#166534', fontWeight: '800', textTransform: 'uppercase', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' },
  statsRow: { fontSize: '0.75rem', marginTop: '6px', color: '#4b5563', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', width: 'fit-content', display: 'flex', gap: '10px' }
};