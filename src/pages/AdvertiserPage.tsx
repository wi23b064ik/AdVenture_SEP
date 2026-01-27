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
  status: string;        
  media_url?: string;
  creative_url?: string;
  creative_status?: string; 
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

  const [selectedFiles, setSelectedFiles] = useState<Record<number, File>>({});

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

      const res = await fetch(url);
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
      const data = await res.json();
      setBids(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err); // Fehler loggen
      setBidError("Failed to load bids"); // Fix: Nicht auf err.message zugreifen, da err 'unknown' ist
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

  // FIX: Typ erweitert um HTMLTextAreaElement
  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      case 'won': return { bg: '#dcfce7', text: '#166534', label: 'WON' }; 
      case 'pending_approval': return { bg: '#fef9c3', text: '#854d0e', label: 'PENDING APPROVAL' }; 
      case 'approved': return { bg: '#dbeafe', text: '#1e40af', label: 'APPROVED & LIVE' }; 
      case 'active': return { bg: '#dcfce7', text: '#166534', label: 'ACTIVE' };
      case 'rejected': return { bg: '#fee2e2', text: '#991b1b', label: 'REJECTED' };
      default: return { bg: '#f3f4f6', text: '#374151', label: status.toUpperCase() }; 
    }
  };

  if (!user) return <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>Please log in.</div>;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.headerRow}>
          <div>
              <h2 style={styles.pageTitle}>{isAdmin ? "Admin Dashboard" : "Advertiser Portal"}</h2>
              <p style={styles.subTitle}>Welcome back, <span style={{fontWeight: '600', color: '#111827'}}>{user.username}</span></p>
          </div>
          {isAdmin && <span style={styles.adminBadge}>ADMIN MODE</span>}
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
              <h4 style={styles.formTitle}>Create New Campaign</h4>
              <div style={styles.formGrid}>
                 
                 {/* Basic Info */}
                 <div style={styles.formSectionTitle}>Basic Information</div>
                 
                 <div style={styles.formGroup}>
                   <label style={styles.label}>Campaign Name</label>
                   <input style={styles.input} name="name" value={campaignForm.name} onChange={handleCampaignChange} placeholder="e.g. Summer Sale 2024" />
                 </div>

                 <div style={styles.gridRow}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Total Budget (€)</label>
                        <input style={styles.input} type="number" name="budget" value={campaignForm.budget} onChange={handleCampaignChange} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Daily Budget (€)</label>
                        <input style={styles.input} type="number" name="dailyBudget" value={campaignForm.dailyBudget} onChange={handleCampaignChange} />
                    </div>
                 </div>

                 <div style={styles.gridRow}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Start Date</label>
                        <input style={styles.input} type="date" name="startDate" value={campaignForm.startDate} onChange={handleCampaignChange} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>End Date</label>
                        <input style={styles.input} type="date" name="endDate" value={campaignForm.endDate} onChange={handleCampaignChange} />
                    </div>
                 </div>

                 {/* Targeting */}
                 <div style={{...styles.formSectionTitle, marginTop: '20px'}}>Targeting</div>
                 
                 <div style={styles.gridRow3}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Category</label>
                        <select name="targetCategories" onChange={handleCampaignChange} style={styles.select}>
                            <option value="Technology">Technology</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Finance">Finance</option>
                            <option value="Gaming">Gaming</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Country</label>
                        <select name="targetCountries" onChange={handleCampaignChange} style={styles.select}>
                            <option value="DE">Germany</option>
                            <option value="AT">Austria</option>
                            <option value="CH">Switzerland</option>
                            <option value="US">USA</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Device</label>
                        <select name="targetDevices" onChange={handleCampaignChange} style={styles.select}>
                            <option value="desktop">Desktop</option>
                            <option value="mobile">Mobile</option>
                            <option value="all">All Devices</option>
                        </select>
                    </div>
                 </div>

                 {/* Creative */}
                 <div style={{...styles.formSectionTitle, marginTop: '20px'}}>Creative Details</div>

                 <div style={styles.formGroup}>
                   <label style={styles.label}>Ad Headline</label>
                   <input style={styles.input} name="creativeHeadline" value={campaignForm.creativeHeadline} onChange={handleCampaignChange} placeholder="Catchy headline..." />
                 </div>

                 <div style={styles.formGroup}>
                   <label style={styles.label}>Description</label>
                   <textarea style={styles.textarea} name="creativeDescription" value={campaignForm.creativeDescription} onChange={handleCampaignChange} placeholder="Describe your ad..." rows={3} />
                 </div>

                 <div style={styles.formGroup}>
                   <label style={styles.label}>Landing Page URL</label>
                   <input style={styles.input} name="landingUrl" value={campaignForm.landingUrl} onChange={handleCampaignChange} placeholder="https://..." />
                 </div>
              </div>
              
              <div style={styles.formActions}>
                  <button onClick={() => setShowCampaignForm(false)} style={styles.buttonGhost}>Cancel</button>
                  <button onClick={createCampaign} style={styles.buttonPrimary}>Create Campaign</button>
              </div>
            </div>
          )}

          <div style={styles.grid}>
            {campaigns.length === 0 && <p style={styles.emptyText}>No active campaigns found. Create one to get started.</p>}
            {campaigns.map((c) => {
              const statusStyle = getStatusColor(c.status);
              return (
                <div key={c.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                      <div>
                          <h4 style={styles.cardTitle}>{c.campaign_name}</h4>
                          <span style={styles.idBadge}>ID: #{c.id}</span>
                      </div>
                      <span style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text}}>
                          {statusStyle.label}
                      </span>
                  </div>
                  <div style={styles.cardBody}>
                      <p style={styles.cardHeadline}>"{c.creative_headline}"</p>
                  </div>
                  <div style={styles.cardFooter}>
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Total Budget</span>
                      <span style={styles.statValue}>€{c.total_budget.toLocaleString()}</span>
                    </div>
                    <div style={styles.statSeparator}></div>
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Daily Budget</span>
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
              <h3 style={styles.sectionTitle}>Bidding Overview</h3>
            </div>
            
            <div style={styles.infoBanner}>
              <span style={{fontSize: '1.2rem', marginRight: '10px'}}>🚀</span>
              <p style={{margin: 0}}>
                 Ready to bid? Go to the <strong><a href="/bidding" style={styles.link}>Live Bidding Arena</a></strong> to place new bids on premium ad inventory.
              </p>
            </div>

            <h4 style={styles.subHeader}>Your Bid History & Results</h4>
            {loadingBids && <p style={{color: '#666'}}>Loading history...</p>}
            {bidError && <p style={{color: '#ef4444'}}>{bidError}</p>}
            
            <div style={styles.bidListContainer}>
              {bids.length > 0 ? (
                bids.map(bid => {
                  const creativeStatus = bid.creative_status || 'pending_upload';
                  const isWon = bid.status === 'won';
                  const statusInfo = getStatusColor(isWon ? creativeStatus : bid.status);
                  
                  return (
                   <div key={bid.id} style={styles.bidRow}>
                     <div style={styles.bidInfoCol}>
                       <strong style={styles.bidTitle}>{bid.ad_space_name}</strong>
                       <p style={styles.bidMeta}>Campaign: <span style={{color: '#111827'}}>{bid.campaign_name}</span></p>
                       {bid.media_url && (
                         <button onClick={() => handleDownloadImage(bid.media_url!)} style={styles.linkButton}>
                           View Ad Space Image ↗
                         </button>
                       )}
                     </div>

                     <div style={styles.bidActionCol}>
                       <div style={styles.priceTag}>€{Number(bid.bid_amount).toFixed(2)}</div>
                       
                       {/* --- STATUS LOGIC --- */}
                       <div style={{marginTop: '8px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                          
                          {/* STATUS BADGE */}
                          <span style={{
                              ...styles.statusBadge, 
                              backgroundColor: statusInfo.bg, 
                              color: statusInfo.text,
                              marginBottom: '8px'
                          }}>
                              {isWon && creativeStatus === 'pending_upload' ? 'ACTION REQUIRED' : statusInfo.label}
                          </span>

                          {/* UPLOAD ZONE */}
                          {isWon && (creativeStatus === 'pending_upload' || creativeStatus === 'rejected') && (
                              <div style={styles.uploadContainer}>
                                 <p style={styles.uploadHint}>
                                    {creativeStatus === 'rejected' ? 'Upload rejected. Please try again.' : 'Upload your creative to go live:'}
                                 </p>
                                 <div style={styles.uploadRow}>
                                     <label htmlFor={`file-${bid.id}`} style={styles.fileInputLabel}>
                                        {selectedFiles[bid.id] ? selectedFiles[bid.id].name : "Choose File"}
                                     </label>
                                     <input 
                                        type="file" 
                                        id={`file-${bid.id}`}
                                        accept="image/*" 
                                        onChange={(e) => handleFileChange(bid.id, e)} 
                                        style={{display: 'none'}}
                                     />
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
                       </div>
                     </div>
                   </div>
                  );
                })
              ) : (
                <div style={styles.emptyState}>
                    <p>No bids placed yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// === IMPROVED STYLES ===
const styles: { [key: string]: React.CSSProperties } = {
  pageWrapper: { backgroundColor: '#f9fafb', minHeight: '100vh', width: '100%' },
  container: { padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1f2937' },
  
  // Header
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  pageTitle: { margin: 0, fontSize: '2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em' },
  subTitle: { margin: '5px 0 0 0', color: '#6b7280', fontSize: '1rem' },
  adminBadge: { backgroundColor: "#1f2937", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", letterSpacing: '0.05em' },

  // Section
  section: { marginBottom: "60px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  sectionTitle: { fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' },
  subHeader: { fontSize: '1.1rem', fontWeight: 600, color: '#374151', margin: '30px 0 15px 0' },

  // Buttons
  buttonPrimary: { backgroundColor: "#2563eb", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: '0.95rem', transition: 'background 0.2s', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  buttonSecondary: { backgroundColor: "white", color: "#374151", padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: '0.95rem' },
  buttonGhost: { backgroundColor: "transparent", color: "#6b7280", padding: "10px 20px", border: "none", cursor: "pointer", fontWeight: 500, fontSize: '0.95rem', marginRight: '10px' },

  // Form
  formCard: { backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", border: "1px solid #e5e7eb", marginBottom: "30px" },
  formTitle: { marginTop: 0, marginBottom: '25px', fontSize: '1.25rem', fontWeight: 700, color: '#111827' },
  formGrid: { display: "flex", flexDirection: "column", gap: "20px" },
  formSectionTitle: { fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '10px' },
  
  gridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  gridRow3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.9rem", fontWeight: 600, color: "#374151" },
  input: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.95rem", width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' },
  select: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.95rem", backgroundColor: "white", width: '100%', boxSizing: 'border-box' },
  textarea: { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.95rem", width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  
  formActions: { marginTop: '30px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', paddingTop: '20px' },

  // Cards
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" },
  card: { backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", display: 'flex', flexDirection: 'column', transition: 'transform 0.1s, box-shadow 0.1s', overflow: 'hidden' },
  cardHeader: { padding: '20px 20px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' },
  idBadge: { fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 },
  statusBadge: { padding: "4px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' },
  
  cardBody: { padding: '0 20px 20px', flex: 1 },
  cardHeadline: { margin: 0, fontSize: '0.95rem', color: '#4b5563', fontStyle: 'italic', lineHeight: '1.5' },
  
  cardFooter: { borderTop: '1px solid #f3f4f6', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#fafafa', alignItems: 'center' },
  statItem: { display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.025em' },
  statValue: { fontSize: '1rem', fontWeight: 700, color: '#111827' },
  statSeparator: { width: '1px', height: '25px', backgroundColor: '#e5e7eb' },
  emptyText: { color: '#6b7280', fontStyle: 'italic' },

  // Bidding Styles
  infoBanner: { backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "15px 20px", display: 'flex', alignItems: 'center', color: '#92400e', marginBottom: '30px' },
  link: { color: '#b45309', textDecoration: 'underline', fontWeight: 700 },
  
  bidListContainer: { border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", backgroundColor: 'white', boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" },
  bidRow: { display: "flex", justifyContent: "space-between", padding: "20px 25px", borderBottom: "1px solid #f3f4f6", alignItems: 'flex-start' },
  bidInfoCol: { flex: 1 },
  bidActionCol: { textAlign: "right", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '280px' },
  
  bidTitle: { fontSize: '1rem', color: '#111827', fontWeight: 600 },
  bidMeta: { fontSize: "0.85rem", color: "#6b7280", margin: '4px 0 8px 0' },
  linkButton: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontWeight: 500 },
  
  priceTag: { fontSize: '1.25rem', fontWeight: 700, color: '#111827' },
  
  // Upload Zone Improved
  uploadContainer: { marginTop: '10px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px dashed #22c55e', width: '100%' },
  uploadHint: { margin: '0 0 8px 0', fontSize: '0.75rem', color: '#166534', fontWeight: 500, textAlign: 'right' },
  uploadRow: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  fileInputLabel: { backgroundColor: 'white', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#374151', fontWeight: 500 },
  uploadBtn: { backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 },
  uploadBtnDisabled: { backgroundColor: '#9ca3af', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'not-allowed', fontSize: '0.8rem', fontWeight: 600 },
  
  emptyState: { padding: '40px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }
};