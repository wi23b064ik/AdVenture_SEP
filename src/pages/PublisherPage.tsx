import React, { useState, useEffect } from "react";

// === TYPES ===

interface AdInventory {
  id: number;
  name: string;
  width: number;
  height: number;
  category?: string;
  min_bid?: number; 
  description?: string;
  website_url?: string;
  media_url?: string;
  publisher_id?: number; 
}


interface WinningBid {
  id: number;
  bid_amount: number;
  status: string;
  creative_url?: string;
  creative_status: 'pending_upload' | 'pending_review' | 'approved' | 'rejected';
  campaign_name: string;
  advertiser_name: string;
  ad_space_name: string;
  created_at: string;
  publisher_id?: string; 
}


interface AuctionAPIResponse {
  id: number;
  adSpaceName: string;
  winningBid?: {
    id: number;
    bidAmountCPM: number;
    status: string;
    creative_url?: string;
    creative_status?: 'pending_upload' | 'pending_review' | 'approved' | 'rejected';
    campaignName: string;
    advertiserName: string;
    submitTime: string;
  };
}

export default function PublisherPage() {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  
  const isAdmin = user?.role === 'Admin';

  const [adSpaces, setAdSpaces] = useState<AdInventory[]>([]);
  const [winningBids, setWinningBids] = useState<WinningBid[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Technology",
    width: 728,
    height: 90,
    minimumBidFloor: 0.5,
    description: "",
    websiteUrl: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // === 1. DATEN LADEN ===
  useEffect(() => {
    if (user && (user.role === 'Publisher' || isAdmin)) {
      fetchAdSpaces();
      fetchDashboardData();
    }
  }, [user?.id, isAdmin]);

  const fetchAdSpaces = async () => {
    try {
      
      const url = isAdmin 
        ? `http://localhost:3001/api/ad-spaces` 
        : `http://localhost:3001/api/ad-spaces/publisher/${user.id}`;

      const res = await fetch(url);
      const data = await res.json();
      setAdSpaces(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Loading error:", err); }
  };

const fetchDashboardData = async () => {
    try {
      if (isAdmin) {
        
        const res = await fetch(`http://localhost:3001/api/auctions`);
        
        
        const auctions = (await res.json()) as AuctionAPIResponse[];
        
        
        const allWinners: WinningBid[] = auctions
          .filter((a) => a.winningBid && a.winningBid.status === 'won') 
          .map((a) => {
            
             const win = a.winningBid!; 
             
             return {
               id: win.id,
               bid_amount: win.bidAmountCPM,
               status: win.status,
               creative_url: win.creative_url,
               
               creative_status: win.creative_status || 'pending_upload', 
               campaign_name: win.campaignName,
               advertiser_name: win.advertiserName,
               ad_space_name: a.adSpaceName,
               created_at: win.submitTime
            };
          });
          
        setWinningBids(allWinners);

      } else {
       
        const res = await fetch(`http://localhost:3001/api/publisher/${user.id}/winning-bids`);
        if (!res.ok) throw new Error("Failed to load bids");
        const data = await res.json();
        setWinningBids(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  // === 2. AD SPACE ERSTELLEN ===
  const addAdSpace = async () => {
    if (!formData.name || !formData.websiteUrl) return alert("Please enter Name and Website URL");

    try {
      const data = new FormData();
      data.append('publisherId', user.id); 
      data.append('name', formData.name);
      data.append('width', formData.width.toString());
      data.append('height', formData.height.toString());
      data.append('category', formData.category);
      data.append('minimumBidFloor', formData.minimumBidFloor.toString());
      data.append('description', formData.description);
      data.append('websiteUrl', formData.websiteUrl);
      
      if (selectedFile) {
        data.append('media', selectedFile);
      }

      const res = await fetch('http://localhost:3001/api/ad-spaces', {
        method: 'POST',
        body: data 
      });

      if (res.ok) {
        alert("Ad space created successfully!");
        setFormData({
          name: "", category: "Technology", width: 728, height: 90,
          minimumBidFloor: 0.5, description: "", websiteUrl: ""
        });
        setSelectedFile(null);
        fetchAdSpaces(); 
      } else {
        alert("Error saving ad space");
      }
    } catch (err) { console.error(err); }
  };

  // === 3. CREATIVE REVIEW ===
  const handleDecision = async (bidId: number, decision: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`http://localhost:3001/api/bids/${bidId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision })
      });

      if (res.ok) {
        alert(`Creative ${decision} successfully!`);
        fetchDashboardData(); 
      } else {
        alert("Error updating status");
      }
    } catch (e) {
      console.error(e);
      alert("System error");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      case 'rejected': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'pending_review': return { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' };
      default: return { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' };
    }
  };

  // === ZUGRIFFSPRÜFUNG ===
  if (!user || (user.role !== 'Publisher' && !isAdmin)) {
      return <div style={{padding:'40px', textAlign:'center'}}>⛔ Access denied. Publishers or Admins only.</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
            <h2 style={{margin: 0, color: '#1e293b'}}>{isAdmin ? "Admin Publisher View" : "Publisher Portal"}</h2>
            <p style={{margin: '5px 0 0', color: '#64748b'}}>Logged in as {user.username}</p>
        </div>
        <span style={isAdmin ? styles.adminBadge : styles.roleBadge}>
            {isAdmin ? "Admin Mode" : "Publisher Account"}
        </span>
      </div>
      
      {/* --- CREATE NEW AD SPACE --- */}
      <div style={styles.formSection}>
        <h3 style={{marginTop: 0}}>Create New Ad Space</h3>
        <p style={{marginBottom: '20px', color: '#666', fontSize: '0.9rem'}}>Define your ad inventory here.</p>
        <div style={styles.formGrid}>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} placeholder="e.g. Header Banner" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Website URL *</label>
            <input type="text" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} style={styles.input} placeholder="https://mysite.com" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
              <option>Technology</option><option>Fashion</option><option>Gaming</option><option>Finance</option>
            </select>
          </div>

          <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Upload preview image (optional)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} style={styles.input} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Width (px)</label>
            <input type="number" name="width" value={formData.width} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Height (px)</label>
            <input type="number" name="height" value={formData.height} onChange={handleChange} style={styles.input} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Min Bid (CPM €)</label>
            <input type="number" step="0.1" name="minimumBidFloor" value={formData.minimumBidFloor} onChange={handleChange} style={styles.input} />
          </div>

          <div style={{...styles.formGroup, gridColumn: "1 / -1"}}>
             <label style={styles.label}>Description</label>
             <input type="text" name="description" value={formData.description} onChange={handleChange} style={styles.input} placeholder="High visibility area..." />
          </div>
        </div>
        <button onClick={addAdSpace} style={styles.button}>Create Ad Space</button>
      </div>

      {/* --- CREATIVE REVIEW DASHBOARD --- */}
      <div style={styles.reviewSection}>
        <div style={{marginBottom: '20px'}}>
            <h3 style={{margin: 0}}>{isAdmin ? "Global Creative Review (All Users)" : "Creative Review Dashboard"}</h3>
            <p style={{color: '#666', margin: '5px 0'}}>Manage ads from winning advertisers.</p>
        </div>
        
        {winningBids.length === 0 ? (
            <div style={styles.emptyState}>No winning bids pending review.</div>
        ) : (
            <div style={styles.reviewGrid}>
                {winningBids.map(bid => {
                    const status = bid.creative_status || 'pending_upload';
                    const statusStyle = getStatusColor(status);

                    return (
                        <div key={bid.id} style={styles.reviewCard}>
                            <div style={styles.reviewHeader}>
                                <div style={{flex: 1, paddingRight: '10px'}}>
                                  <strong style={{fontSize: '1.05rem', display:'block', color: '#1e293b'}}>{bid.ad_space_name}</strong>
                                  <span style={{fontSize: '0.75rem', color: '#94a3b8'}}>Campaign: {bid.campaign_name}</span>
                                </div>
                                <span style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`}}>
                                  {status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>

                            <div style={styles.reviewContent}>
                                <div style={styles.infoRow}>
                                  <span>Advertiser:</span>
                                  <strong>{bid.advertiser_name}</strong>
                                </div>
                                <div style={styles.infoRow}>
                                  <span>Win Price:</span>
                                  <strong style={{color: '#2563eb'}}>€{Number(bid.bid_amount).toFixed(2)}</strong>
                                </div>
                                
                                <hr style={styles.divider} />

                                {status === 'pending_review' && bid.creative_url ? (
                                    <div style={styles.actionBox}>
                                            <p style={{margin:'0 0 10px 0', fontSize: '0.85rem', fontWeight: 'bold', color:'#9a3412'}}>📷 Review Creative:</p>
                                            <div style={styles.imagePreviewWrapper}>
                                              <img src={`http://localhost:3001${bid.creative_url}`} alt="Ad Creative" style={styles.previewImage} />
                                            </div>
                                            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                              <a href={`http://localhost:3001${bid.creative_url}`} target="_blank" rel="noreferrer" style={{fontSize:'0.8rem', flex:1, textAlign:'center'}}>View Full</a>
                                            </div>
                                            <div style={styles.btnRow}>
                                                <button onClick={() => handleDecision(bid.id, 'approved')} style={{...styles.actionBtn, backgroundColor: '#16a34a'}}>Approve</button>
                                                <button onClick={() => handleDecision(bid.id, 'rejected')} style={{...styles.actionBtn, backgroundColor: '#dc2626'}}>Reject</button>
                                            </div>
                                    </div>
                                ) : status === 'approved' ? (
                                    <div style={styles.successBox}>
                                        <div style={{fontSize:'1.2rem', marginBottom:'5px'}}>✅</div>
                                        <div>Ad is live & active.</div>
                                        {bid.creative_url && <a href={`http://localhost:3001${bid.creative_url}`} target="_blank" rel="noreferrer" style={styles.linkSmall}>View Creative</a>}
                                    </div>
                                ) : status === 'pending_upload' ? (
                                    <div style={styles.pendingBox}>
                                        <div style={{fontSize:'1.5rem', marginBottom:'5px'}}>⏳</div>
                                        <div>Waiting for Advertiser upload...</div>
                                    </div>
                                ) : (
                                    <div style={styles.rejectedBox}>❌ Creative rejected.</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* --- AD SPACES LIST --- */}
      <div style={styles.listSection}>
        <h3 style={{color: '#475569'}}>{isAdmin ? "All Ad Spaces (Global)" : `Your Ad Inventory (${adSpaces.length})`}</h3>
        <div style={styles.grid}>
          {adSpaces.map((space) => (
            <div key={space.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h4 style={{margin:0, color: '#1e293b'}}>{space.name}</h4>
                <span style={styles.categoryBadge}>{space.category}</span>
              </div>
              
              {space.media_url ? (
                <div style={styles.mediaContainer}>
                  {space.media_url.endsWith('.mp4') ? (
                    <video src={`http://localhost:3001${space.media_url}`} controls style={styles.media} />
                  ) : (
                    <img src={`http://localhost:3001${space.media_url}`} alt="Preview" style={styles.media} />
                  )}
                </div>
              ) : (
                <div style={styles.placeholder}>No image</div>
              )}

              <div style={{paddingTop: '10px'}}>
                <p style={styles.cardText}><strong>URL:</strong> <a href={space.website_url} target="_blank" rel="noreferrer" style={{color: '#2563eb'}}>{space.website_url}</a></p>
                <p style={styles.cardText}>Size: {space.width}x{space.height} | Floor: €{space.min_bid}</p>
                {isAdmin && space.publisher_id && <p style={{fontSize:'0.75rem', color: 'red'}}>Publisher ID: {space.publisher_id}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "40px 20px", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Inter', sans-serif, Arial", color: '#334155' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' },
  roleBadge: { backgroundColor: '#fff7ed', color: '#c2410c', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #ffedd5' },
  adminBadge: { backgroundColor: "#fee2e2", color: "#991b1b", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold", border: '1px solid #fecaca' },
  
  // Form Styles
  formSection: { backgroundColor: "#ffffff", padding: "30px", borderRadius: "16px", marginBottom: "50px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "25px" },
  formGroup: { display: "flex", flexDirection: "column", gap: '6px' },
  label: { fontSize: '0.9rem', fontWeight: 600, color: '#475569' },
  input: { padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", transition: "border 0.2s" },
  button: { backgroundColor: "#2563eb", color: "white", padding: "12px 24px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" },
  
  // Review Styles
  reviewSection: { marginBottom: "60px" },
  reviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  reviewCard: { border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  reviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  statusBadge: { fontSize: '0.7rem', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', letterSpacing: '0.5px' },
  reviewContent: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' },
  infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#334155' },
  divider: { margin: '15px 0', border: '0', borderTop: '1px solid #f1f5f9' },
  
  actionBox: { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '15px', borderRadius: '8px', marginTop: 'auto' },
  imagePreviewWrapper: { backgroundColor: '#fff', padding: '5px', border: '1px solid #e2e8f0', borderRadius: '4px', display:'flex', justifyContent:'center', minHeight: '100px' },
  previewImage: { maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '15px' },
  actionBtn: { flex: 1, padding: '8px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  
  successBox: { backgroundColor: '#f0fdf4', color: '#166534', padding: '20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', border: '1px solid #bbf7d0', marginTop: 'auto' },
  pendingBox: { backgroundColor: '#f8fafc', color: '#64748b', padding: '20px', borderRadius: '8px', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', border: '1px dashed #cbd5e1', marginTop: 'auto' },
  rejectedBox: { backgroundColor: '#fef2f2', color: '#991b1b', padding: '20px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #fecaca', marginTop: 'auto' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' },
  linkSmall: { display:'inline-block', fontSize:'0.8rem', marginTop:'5px', color: '#166534', textDecoration: 'underline' },

  // List Styles
  listSection: { marginTop: "30px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" },
  card: { backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: 'transform 0.2s' },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: "15px" },
  categoryBadge: { backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold" },
  cardText: { fontSize: "0.9rem", margin: "6px 0", color: "#334155" },
  
  mediaContainer: { width: '100%', height: '160px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  media: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { width: '100%', height: '160px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', marginBottom: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' },
};