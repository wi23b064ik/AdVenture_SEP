import React, { useState, useEffect } from "react";

// Typdefinition passend zu deiner Datenbank
interface AdInventory {
  id: number;
  name: string;
  width: number;
  height: number;
  // Optional: Falls du diese Felder später in der DB ergänzt
  category?: string;
  placement?: string;
  estimatedDailyImpressions?: number;
  minimumBidFloor?: number;
  description?: string;
}

export default function PublisherPage() {
  // User aus localStorage holen
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const [adSpaces, setAdSpaces] = useState<AdInventory[]>([]);
  
  // Formular State
  const [formData, setFormData] = useState({
    name: "",
    category: "Technology",
    placement: "banner_top",
    width: 728,  // Wir speichern Breite/Höhe separat für die DB
    height: 90,
    estimatedDailyImpressions: 10000,
    minimumBidFloor: 0.5,
    description: "",
  });

  // === 1. DATEN LADEN ===
  useEffect(() => {
    if (user) {
      fetchMyAdSpaces();
    }
  }, []);

  const fetchMyAdSpaces = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/ad-spaces/publisher/${user.id}`);
      const data = await res.json();
      setAdSpaces(data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  };

  // === 2. NEUE FLÄCHE ERSTELLEN ===
  const addAdSpace = async () => {
    if (!formData.name) {
      alert("Please fill in the Ad Space name");
      return;
    }

    try {
      // Wir senden die Daten an das Backend
      const res = await fetch('http://localhost:3001/api/ad-spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publisherId: user.id,
          name: formData.name,
          width: formData.width,   // Diese Werte nutzen wir
          height: formData.height
          // Hinweis: Deine DB Tabelle "ad_spaces" hat aktuell nur name, width, height.
          // Felder wie Category, Placement, BidFloor werden hier gesendet, aber vom Backend ignoriert,
          // solange du die DB-Tabelle nicht erweiterst. Das ist okay für den Anfang!
        })
      });

      if (res.ok) {
        alert("Werbefläche erfolgreich erstellt!");
        // Reset Formular
        setFormData({
          name: "", category: "Technology", placement: "banner_top",
          width: 728, height: 90,
          estimatedDailyImpressions: 10000, minimumBidFloor: 0.5, description: ""
        });
        fetchMyAdSpaces(); // Liste neu laden
      } else {
        alert("Fehler beim Speichern.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "estimatedDailyImpressions" || name === "minimumBidFloor" || name === "width" || name === "height"
        ? parseFloat(value) 
        : value,
    });
  };

  if (!user) return <div style={{padding: '2rem'}}>Bitte erst einloggen.</div>;

  return (
    <div style={styles.container}>
      <h2>Publisher Portal (Angemeldet: {user.username})</h2>
      <p>Create and manage ad spaces for advertisers to bid on.</p>

      {/* Form Section */}
      <div style={styles.formSection}>
        <h3>Create New Ad Space</h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label>Ad Space Name *</label>
            <input
              type="text" name="name" placeholder="e.g., Homepage Banner"
              value={formData.name} onChange={handleChange} style={styles.input}
            />
          </div>

          {/* Wir haben width/height getrennt, damit es sauber in die DB geht */}
          <div style={styles.formGroup}>
            <label>Width (px)</label>
            <input type="number" name="width" value={formData.width} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label>Height (px)</label>
            <input type="number" name="height" value={formData.height} onChange={handleChange} style={styles.input} />
          </div>

          {/* Diese Felder sind nur UI-Dummies, solange die DB sie nicht speichert */}
          <div style={styles.formGroup}>
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
              <option>Technology</option>
              <option>Fashion</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>Min. Bid Floor (€)</label>
            <input type="number" step="0.1" name="minimumBidFloor" value={formData.minimumBidFloor} onChange={handleChange} style={styles.input} />
          </div>
        </div>

        <button onClick={addAdSpace} style={styles.button}>
          Create Ad Space
        </button>
      </div>

      {/* Ad Spaces List */}
      <div style={styles.listSection}>
        <h3>Your Ad Spaces ({adSpaces.length})</h3>
        {adSpaces.length === 0 ? (
          <p style={styles.emptyState}>No ad spaces created yet.</p>
        ) : (
          <div style={styles.grid}>
            {adSpaces.map((space) => (
              <div key={space.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h4>{space.name}</h4>
                  <span style={styles.badge}>{space.width}x{space.height}</span>
                </div>
                <p style={styles.cardText}><strong>ID:</strong> {space.id}</p>
                <button style={styles.secondaryButton}>Manage</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Deine Styles (unverändert, sehen gut aus!)
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
  formSection: { backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #e5e7eb" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" },
  formGroup: { display: "flex", flexDirection: "column" },
  input: { padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.9rem" },
  button: { backgroundColor: "#2563eb", color: "white", padding: "10px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  listSection: { marginTop: "30px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  card: { backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px", padding: "15px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  badge: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" },
  cardText: { fontSize: "0.9rem", margin: "8px 0", color: "#4b5563" },
  secondaryButton: { backgroundColor: "#10b981", color: "white", padding: "8px 12px", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "10px", width: "100%" },
  emptyState: { color: "#9ca3af", textAlign: "center", padding: "20px" },
};