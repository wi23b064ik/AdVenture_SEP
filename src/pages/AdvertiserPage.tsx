import React, { useState, useEffect } from "react";

// Types
interface Campaign {
  id: number;
  campaign_name: string;
  total_budget: number;
  daily_budget: number;
  start_date: string;
  status: "active" | "paused" | "ended";
  creative_headline: string;
  advertiser_name?: string; 
}

interface Bid {
  id: number;
  campaign_name: string;
  ad_space_name: string;
  bid_amount: number;
  status: string;        // 'won', 'lost', 'accepted' (Auction Status)
  media_url?: string;
  creative_url?: string;
  creative_status?: string; // 'pending_upload', 'pending_review', 'approved', 'rejected'
}

export default function AdvertiserPage() {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const isAdmin = user?.role === 'Admin';

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [loadingBids, setLoadingBids] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // State für Datei-Upload
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File>>({});

  // Form States
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    budget: 1000,
    dailyBudget: 50,
    startDate: "",
    endDate: "",
    targetCategories: ["Technology"],
    targetCountries: ["DE"],
    targetDevices: ["desktop"],
    creativeHeadline: "",
    creativeDescription: "",
    landingUrl: "",
  });

  // === 1. LOAD DATA ===
  useEffect(() => {
    if (user && user.id) {
      fetchCampaigns();
      if (!isAdmin) fetchBids();
    }
  }, [user?.id, isAdmin]);

  const fetchCampaigns = async () => {
    try {
      const url = isAdmin 
        ? `http://localhost:3001/api/campaigns-all`
        : `http://localhost:3001/api/campaigns/${user.id}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchBids = async () => {
    if (loadingBids) return;
    setLoadingBids(true);
    setBidError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/bids/${user.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBids(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setBidError(err instanceof Error ? err.message : "Failed to load bids");
    } finally {
      setLoadingBids(false);
    }
  };

  // === UPLOAD HANDLER ===
  const handleFileChange = (bidId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles(prev => ({ ...prev, [bidId]: e.target.files![0] }));
    }
  };

  const uploadCreative = async (bidId: number) => {
    const file = selectedFiles[bidId];
    if (!file) { alert("Bitte wähle zuerst ein Foto aus."); return; }

    const formData = new FormData();
    formData.append('creative', file);
    formData.append('bidId', bidId.toString());

    try {
      const response = await fetch('http://localhost:3001/api/bids/upload-creative', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert("Foto hochgeladen! Warte auf Bestätigung des Publishers.");
        fetchBids(); 
        const newFiles = { ...selectedFiles };
        delete newFiles[bidId];
        setSelectedFiles(newFiles);
      } else {
        alert("Upload fehlgeschlagen.");
      }
    } catch (err) { console.error(err); }
  };

  // === HELPER ===
  const handleDownloadImage = async (mediaUrl: string) => {
    try {
      const response = await fetch(`http://localhost:3001${mediaUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = mediaUrl.split('/').pop() || 'ad-space-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) { console.error("Download failed:", error); }
  };

  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCampaignForm({
      ...campaignForm,
      [name]: name === "budget" || name === "dailyBudget" ? parseFloat(value) : value,
    });
  };

  const createCampaign = async () => {
    if (!campaignForm.name) { alert("Please enter a campaign name"); return; }
    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advertiser_id: user.id, ...campaignForm })
      });
      if (response.ok) {
        alert("Campaign created successfully!");
        setShowCampaignForm(false);
        fetchCampaigns(); 
      } else { alert("Error creating campaign"); }
    } catch (err) { console.error(err); }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'won': return { bg: '#dcfce7', text: '#166534' }; 
      case 'pending_approval': return { bg: '#fef9c3', text: '#854d0e' }; 
      case 'approved': return { bg: '#dbeafe', text: '#1e40af' }; 
      case 'active': return { bg: '#dcfce7', text: '#166534' };
      default: return { bg: '#f3f4f6', text: '#374151' }; 
    }
  };

  if (!user) return <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>Please log in.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
            <h2 style={styles.pageTitle}>{isAdmin ? "Admin Overview" : "Advertiser Portal"}</h2>
            <p style={styles.subTitle}>Welcome back, {user.username}</p>
        </div>
        {isAdmin && <span style={styles.adminBadge}>Admin Mode</span>}
      </div>
      
      {/* --- CAMPAIGN SECTION --- */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>{isAdmin ? "All Active Campaigns" : "My Campaigns"}</h3>
          {!isAdmin && (
            <button 
                onClick={() => setShowCampaignForm(!showCampaignForm)} 
                style={showCampaignForm ? styles.buttonSecondary : styles.buttonPrimary}
            >
              {showCampaignForm ? "Cancel Creation" : "+ New Campaign"}
            </button>
          )}
        </div>

        {showCampaignForm && !isAdmin && (
          <div style={styles.formCard}>
            <h4 style={{marginTop: 0, marginBottom: '20px', color: '#1f2937'}}>Create New Campaign</h4>
            <div style={styles.formGrid}>
               <div style={styles.formGroup}>
                 <label style={styles.label}>Campaign Name</label>
                 <input style={styles.input} name="name" value={campaignForm.name} onChange={handleCampaignChange} />
               </div>
               {/* Restliche Formularfelder hier... (gekürzt für Übersicht) */}
               <div style={styles.formGroup}>
                 <label style={styles.label}>Total Budget (€)</label>
                 <input style={styles.input} type="number" name="budget" value={campaignForm.budget} onChange={handleCampaignChange} />
               </div>
               <div style={styles.formGroup}>
                 <label style={styles.label}>Daily Budget (€)</label>
                 <input style={styles.input} type="number" name="dailyBudget" value={campaignForm.dailyBudget} onChange={handleCampaignChange} />
               </div>
               <div style={styles.formGroup}>
                 <label style={styles.label}>Start Date</label>
                 <input style={styles.input} type="date" name="startDate" value={campaignForm.startDate} onChange={handleCampaignChange} />
               </div>
               <div style={styles.formGroup}>
                 <label style={styles.label}>End Date</label>
                 <input style={styles.input} type="date" name="endDate" value={campaignForm.endDate} onChange={handleCampaignChange} />
               </div>
               <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                 <label style={styles.label}>Headline</label>
                 <input style={styles.input} name="creativeHeadline" value={campaignForm.creativeHeadline} onChange={handleCampaignChange} />
               </div>
            </div>
            <div style={{marginTop: '20px', textAlign: 'right'}}>
                <button onClick={createCampaign} style={styles.buttonPrimary}>Save Campaign</button>
            </div>
          </div>
        )}

        <div style={styles.grid}>
          {campaigns.length === 0 && <p style={{color: '#9ca3af', fontStyle: 'italic'}}>No campaigns found.</p>}
          {campaigns.map((c) => {
            const statusStyle = getStatusColor(c.status);
            return (
              <div key={c.id} style={styles.card}>
                <div style={styles.cardHeader}>
                    <h4 style={styles.cardTitle}>{c.campaign_name}</h4>
                    <span style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text}}>
                        {c.status.toUpperCase()}
                    </span>
                </div>
                <p style={styles.cardHeadline}>"{c.creative_headline}"</p>
                <div style={styles.cardFooter}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total</span>
                    <span style={styles.statValue}>€{c.total_budget}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Daily</span>
                    <span style={styles.statValue}>€{c.daily_budget}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- BIDDING SECTION --- */}
      {!isAdmin && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Active Auctions & Bidding</h3>
          </div>
          
          <div style={styles.infoBanner}>
            <span style={{fontSize: '1.2rem'}}>💡</span>
            <p style={{margin: 0}}>
               Go to the <strong><a href="/bidding" style={styles.link}>Bidding Page</a></strong> to place new bids in real-time auctions!
            </p>
          </div>

          <h4 style={{marginTop: '30px', color: '#4b5563'}}>Your Bid History</h4>
          {loadingBids && <p>Loading...</p>}
          {bidError && <p style={{color: 'red'}}>{bidError}</p>}
          
          <div style={styles.bidListContainer}>
            {bids.length > 0 ? (
              bids.map(bid => {
                const creativeStatus = bid.creative_status || 'pending_upload';
                
                return (
                 <div key={bid.id} style={styles.bidRow}>
                   <div style={{flex: 1}}>
                     <strong style={{fontSize: '1.1rem', color: '#1f2937'}}>{bid.ad_space_name}</strong>
                     <p style={styles.metaText}>Campaign: {bid.campaign_name}</p>
                     {bid.media_url && (
                       <button onClick={() => handleDownloadImage(bid.media_url!)} style={styles.linkButton}>
                         📷 View Ad Space Image
                       </button>
                     )}
                   </div>

                   <div style={styles.bidActions}>
                     <div style={styles.priceTag}>€{Number(bid.bid_amount).toFixed(2)}</div>
                     
                     {/* --- STATUS LOGIK START --- */}
                     
                     {/* 1. Wenn Bid 'won' ist aber noch kein Foto da ist ODER wenn Foto abgelehnt wurde (Retry) */}
                     {bid.status === 'won' && (creativeStatus === 'pending_upload' || creativeStatus === 'rejected') && (
                        <div style={styles.uploadZone}>
                           <div style={{marginBottom: '8px', fontWeight: '600', color: creativeStatus === 'rejected' ? '#dc2626' : '#166534'}}>
                              {creativeStatus === 'rejected' ? '❌ Upload Rejected - Try Again' : '🎉 You Won!'}
                           </div>
                           
                           <input 
                              type="file" 
                              id={`file-${bid.id}`}
                              accept="image/*" 
                              onChange={(e) => handleFileChange(bid.id, e)} 
                              style={{display: 'none'}}
                           />
                           
                           <div style={{display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end'}}>
                               <label htmlFor={`file-${bid.id}`} style={styles.fileLabel}>
                                  {selectedFiles[bid.id] ? selectedFiles[bid.id].name : "📁 Choose Image"}
                               </label>
                               <button 
                                 onClick={() => uploadCreative(bid.id)}
                                 disabled={!selectedFiles[bid.id]}
                                 style={!selectedFiles[bid.id] ? styles.uploadBtnDisabled : styles.uploadBtn}
                               >
                                 Upload
                               </button>
                           </div>
                        </div>
                     )}

                     {/* 2. Anzeige für Review Status */}
                     <div style={{marginTop: '10px'}}>
                        {creativeStatus === 'pending_review' && (
                          <span style={{...styles.statusBadge, backgroundColor: '#fff7ed', color: '#c2410c'}}>
                             ⏳ Waiting for Approval
                          </span>
                        )}

                        {creativeStatus === 'approved' && (
                          <span style={{...styles.statusBadge, backgroundColor: '#dcfce7', color: '#166534'}}>
                             ✅ Approved & Live
                          </span>
                        )}

                        {creativeStatus === 'rejected' && (
                          <span style={{...styles.statusBadge, backgroundColor: '#fee2e2', color: '#991b1b'}}>
                             ❌ Rejected
                          </span>
                        )}

                        {/* Fallback für normale Auction Status (Accepted, etc) wenn nicht gewonnen */}
                        {bid.status !== 'won' && (
                          <span style={styles.statusBadgeDefault}>
                            {bid.status.toUpperCase()}
                          </span>
                        )}
                     </div>
                     {/* --- STATUS LOGIK ENDE --- */}

                   </div>
                 </div>
                );
              })
            ) : (
              <div style={styles.emptyState}>No bids yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// === STYLES ===
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "40px", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Inter', sans-serif", color: '#1f2937' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' },
  pageTitle: { margin: 0, fontSize: '1.8rem', fontWeight: 700, color: '#111827' },
  subTitle: { margin: '5px 0 0 0', color: '#6b7280' },
  adminBadge: { backgroundColor: "#fee2e2", color: "#991b1b", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold" },
  section: { marginBottom: "60px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  sectionTitle: { fontSize: '1.4rem', fontWeight: 600, margin: 0 },
  formCard: { backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb", marginBottom: "30px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.9rem", fontWeight: 600, color: "#374151" },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.95rem" },
  buttonPrimary: { backgroundColor: "#2563eb", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
  buttonSecondary: { backgroundColor: "white", color: "#374151", padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "25px" },
  card: { backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  cardTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' },
  cardHeadline: { fontStyle: 'italic', color: '#6b7280', marginBottom: '20px', fontSize: '0.95rem' },
  cardFooter: { borderTop: '1px solid #f3f4f6', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' },
  statItem: { display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 },
  statValue: { fontSize: '1rem', fontWeight: 700, color: '#1f2937' },
  statusBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: '0.5px' },
  statusBadgeDefault: { padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: '#f3f4f6', color: '#374151' },
  infoBanner: { backgroundColor: "#fffbeb", borderLeft: "4px solid #f59e0b", padding: "15px 20px", borderRadius: "4px", display: 'flex', alignItems: 'center', gap: '15px', color: '#92400e' },
  link: { color: '#0066cc', textDecoration: 'underline', fontWeight: 600 },
  bidListContainer: { border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", backgroundColor: 'white', boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" },
  bidRow: { display: "flex", justifyContent: "space-between", padding: "20px 25px", borderBottom: "1px solid #f3f4f6", alignItems: 'flex-start' },
  bidActions: { textAlign: "right", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '250px' },
  priceTag: { fontSize: '1.2rem', fontWeight: 800, color: '#111827' },
  metaText: { fontSize: "0.85rem", color: "#6b7280", margin: '4px 0 8px 0' },
  linkButton: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline' },
  uploadZone: { marginTop: '10px', padding: '15px', border: '2px dashed #86efac', borderRadius: '8px', backgroundColor: '#f0fdf4', textAlign: 'right', width: '100%', boxSizing: 'border-box' },
  fileLabel: { backgroundColor: 'white', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#374151', display: 'inline-block' },
  uploadBtn: { backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, marginLeft: '10px' },
  uploadBtnDisabled: { backgroundColor: '#9ca3af', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'not-allowed', fontSize: '0.8rem', fontWeight: 600, marginLeft: '10px' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }
};