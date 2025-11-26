import React, { useState, useEffect } from "react";

// Typendefinitionen
interface Campaign {
  id: number;
  campaign_name: string;
  total_budget: number;
  daily_budget: number;
  start_date: string;
  status: "active" | "paused" | "ended";
  creative_headline: string;
}

interface AdSpace {
  id: number;
  name: string;
  width: number;
  height: number;
}

interface Bid {
  id: number;
  campaign_name: string;
  ad_space_name: string;
  bid_amount: number;
  status: string;
}

export default function AdvertiserPage() {
  // User aus localStorage holen
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSpaces, setAdSpaces] = useState<AdSpace[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);

  // Formular States (Alle Felder!)
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

  const [bidForm, setBidForm] = useState({
    campaignId: "",
    adSpaceId: "",
    bidAmountCPM: 2.5,
  });

  // === 1. DATEN LADEN ===
  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchAdSpaces();
      fetchBids();
    }
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/campaigns/${user.id}`);
      const data = await res.json();
      setCampaigns(data);
    } catch (err) { console.error(err); }
  };

  const fetchAdSpaces = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/ad-spaces`);
      const data = await res.json();
      setAdSpaces(data);
    } catch (err) { console.error(err); }
  };

  const fetchBids = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/bids/${user.id}`);
      const data = await res.json();
      setBids(data);
    } catch (err) { console.error(err); }
  };

  // === HANDLER ===
  const handleCampaignChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Spezialbehandlung für Mehrfachauswahl (Select) ist hier vereinfacht -> nimmt nur einen Wert
    // Für echte Mehrfachauswahl bräuchte man e.target.selectedOptions
    
    setCampaignForm({
      ...campaignForm,
      [name]: name === "budget" || name === "dailyBudget" ? parseFloat(value) : value,
    });
  };

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBidForm({
      ...bidForm,
      [name]: name === "bidAmountCPM" ? parseFloat(value) : value,
    });
  };

  // === CREATE CAMPAIGN (POST) ===
  const createCampaign = async () => {
    if (!campaignForm.name) {
      alert("Please enter a campaign name");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiser_id: user.id,
          ...campaignForm
        })
      });

      if (response.ok) {
        alert("Kampagne erstellt!");
        setShowCampaignForm(false);
        fetchCampaigns(); // Liste aktualisieren
      } else {
        alert("Fehler beim Erstellen");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // === PLACE BID (POST) ===
  const placeBid = async () => {
    if (!bidForm.campaignId || !bidForm.adSpaceId) {
      alert("Please select campaign and ad space");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: bidForm.campaignId,
          adSpaceId: bidForm.adSpaceId,
          bidAmount: bidForm.bidAmountCPM
        })
      });

      if (response.ok) {
        alert("Gebot platziert!");
        fetchBids(); // Liste aktualisieren
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div style={{padding: '2rem'}}>Bitte einloggen</div>;

  return (
    <div style={styles.container}>
      <h2>Advertiser Portal (Angemeldet: {user.username})</h2>
      
      {/* --- CAMPAIGN SECTION --- */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3>My Campaigns</h3>
          <button onClick={() => setShowCampaignForm(!showCampaignForm)} style={styles.button}>
            {showCampaignForm ? "Cancel" : "Create Campaign"}
          </button>
        </div>

        {showCampaignForm && (
          <div style={styles.formSection}>
            <h4>New Campaign</h4>
            
            {/* HIER SIND JETZT WIEDER ALLE FELDER */}
            <div style={styles.formGrid}>
               
               {/* Zeile 1: Name */}
               <div style={styles.formGroup}>
                 <label>Campaign Name *</label>
                 <input style={styles.input} name="name" value={campaignForm.name} onChange={handleCampaignChange} placeholder="e.g. Summer Sale" />
               </div>

               {/* Zeile 2: Budgets */}
               <div style={styles.formGroup}>
                 <label>Total Budget (€)</label>
                 <input style={styles.input} type="number" name="budget" value={campaignForm.budget} onChange={handleCampaignChange} />
               </div>
               <div style={styles.formGroup}>
                 <label>Daily Budget (€)</label>
                 <input style={styles.input} type="number" name="dailyBudget" value={campaignForm.dailyBudget} onChange={handleCampaignChange} />
               </div>

               {/* Zeile 3: Datum */}
               <div style={styles.formGroup}>
                 <label>Start Date</label>
                 <input style={styles.input} type="date" name="startDate" value={campaignForm.startDate} onChange={handleCampaignChange} />
               </div>
               <div style={styles.formGroup}>
                 <label>End Date</label>
                 <input style={styles.input} type="date" name="endDate" value={campaignForm.endDate} onChange={handleCampaignChange} />
               </div>

               {/* Zeile 4: Targeting */}
               <div style={styles.formGroup}>
                 <label>Target Category</label>
                 <select name="targetCategories" onChange={handleCampaignChange} style={styles.input}>
                    <option>Technology</option>
                    <option>Fashion</option>
                    <option>Finance</option>
                 </select>
               </div>
               <div style={styles.formGroup}>
                 <label>Target Country</label>
                 <select name="targetCountries" onChange={handleCampaignChange} style={styles.input}>
                    <option value="DE">Germany</option>
                    <option value="AT">Austria</option>
                    <option value="CH">Switzerland</option>
                 </select>
               </div>
               <div style={styles.formGroup}>
                 <label>Target Device</label>
                 <select name="targetDevices" onChange={handleCampaignChange} style={styles.input}>
                    <option value="desktop">Desktop</option>
                    <option value="mobile">Mobile</option>
                 </select>
               </div>

               {/* Zeile 5: Creative & URL (Volle Breite) */}
               <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                 <label>Creative Headline</label>
                 <input style={styles.input} name="creativeHeadline" value={campaignForm.creativeHeadline} onChange={handleCampaignChange} placeholder="e.g. Buy now!" />
               </div>
               
               <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                 <label>Creative Description</label>
                 <input style={styles.input} name="creativeDescription" value={campaignForm.creativeDescription} onChange={handleCampaignChange} placeholder="Description..." />
               </div>

               <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                 <label>Landing URL</label>
                 <input style={styles.input} name="landingUrl" value={campaignForm.landingUrl} onChange={handleCampaignChange} placeholder="https://..." />
               </div>

            </div>
            <button onClick={createCampaign} style={styles.button}>Save Campaign</button>
          </div>
        )}

        {/* Liste der existierenden Kampagnen */}
        <div style={styles.grid}>
          {campaigns.map((c) => (
            <div key={c.id} style={styles.card}>
              <h4>{c.campaign_name}</h4>
              <p>Budget: €{c.total_budget}</p>
              <p><i>{c.creative_headline}</i></p>
              <span style={styles.activeBadge}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- BIDDING SECTION --- */}
      <div style={styles.section}>
        <h3>Place Bids</h3>
        <div style={styles.formSection}>
          <div style={styles.formGrid}>
            
            {/* Kampagne auswählen (Daten aus DB) */}
            <div style={styles.formGroup}>
              <label>Select Campaign</label>
              <select name="campaignId" value={bidForm.campaignId} onChange={handleBidChange} style={styles.input}>
                <option value="">-- Choose --</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.campaign_name}</option>
                ))}
              </select>
            </div>

            {/* Ad Space auswählen (Daten aus DB) */}
            <div style={styles.formGroup}>
              <label>Ad Space</label>
              <select name="adSpaceId" value={bidForm.adSpaceId} onChange={handleBidChange} style={styles.input}>
                <option value="">-- Choose Ad Space --</option>
                {adSpaces.map(space => (
                  <option key={space.id} value={space.id}>
                    {space.name} ({space.width}x{space.height})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Bid Amount (€)</label>
              <input type="number" name="bidAmountCPM" value={bidForm.bidAmountCPM} onChange={handleBidChange} style={styles.input} />
            </div>
          </div>
          <button onClick={placeBid} style={styles.button}>Place Bid</button>
        </div>

        <h4>Bid History</h4>
        <div style={styles.bidTable}>
          {bids.map(bid => (
             <div key={bid.id} style={styles.bidRow}>
               <div>
                 <strong>{bid.ad_space_name}</strong>
                 <p style={styles.smallText}>Campaign: {bid.campaign_name}</p>
               </div>
               <div style={styles.bidDetails}>
                 <strong>€{Number(bid.bid_amount).toFixed(2)}</strong>
                 <p style={styles.smallText}>{bid.status}</p>
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
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
  section: { marginBottom: "40px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  formSection: { backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e5e7eb" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" },
  formGroup: { display: "flex", flexDirection: "column" },
  input: { padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" },
  button: { backgroundColor: "#2563eb", color: "white", padding: "10px 20px", border: "none", borderRadius: "4px", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" },
  card: { backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px", padding: "15px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  activeBadge: { backgroundColor: "#d1fae5", color: "#065f46", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" },
  bidTable: { backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" },
  bidRow: { display: "flex", justifyContent: "space-between", padding: "15px", borderBottom: "1px solid #f3f4f6" },
  bidDetails: { textAlign: "right" },
  smallText: { fontSize: "0.85rem", color: "#9ca3af" },
};