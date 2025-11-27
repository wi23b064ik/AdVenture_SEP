import React, { useState, useEffect } from "react";

interface AdInventory {
  id: number;
  name: string;
  width: number;
  height: number;
  category?: string;
  min_bid?: number; // Achtung: DB Name ist min_bid, nicht minimumBidFloor
  description?: string;
  media_url?: string; // <--- NEU
}

export default function PublisherPage() {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const [adSpaces, setAdSpaces] = useState<AdInventory[]>([]);
  
  // State für Textfelder
  const [formData, setFormData] = useState({
    name: "",
    category: "Technology",
    width: 728,
    height: 90,
    minimumBidFloor: 0.5,
    description: "",
  });

  // State für die Datei
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) fetchMyAdSpaces();
  }, []);

  const fetchMyAdSpaces = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/ad-spaces/publisher/${user.id}`);
      const data = await res.json();
      setAdSpaces(data);
    } catch (err) { console.error("Ladefehler:", err); }
  };

  const addAdSpace = async () => {
    if (!formData.name) return alert("Bitte Namen eingeben");

    try {
      // WICHTIG: Wir nutzen FormData für Datei-Uploads
      const data = new FormData();
      data.append('publisherId', user.id);
      data.append('name', formData.name);
      data.append('width', formData.width.toString());
      data.append('height', formData.height.toString());
      data.append('category', formData.category);
      data.append('minimumBidFloor', formData.minimumBidFloor.toString());
      data.append('description', formData.description);
      
      // Datei anhängen, falls vorhanden
      if (selectedFile) {
        data.append('media', selectedFile);
      }

      // WICHTIG: Kein 'Content-Type': 'application/json' Header setzen!
      // Der Browser setzt automatisch den richtigen Header für FormData.
      const res = await fetch('http://localhost:3001/api/ad-spaces', {
        method: 'POST',
        body: data 
      });

      if (res.ok) {
        alert("Werbefläche erstellt!");
        // Reset
        setFormData({
          name: "", category: "Technology", width: 728, height: 90,
          minimumBidFloor: 0.5, description: ""
        });
        setSelectedFile(null);
        fetchMyAdSpaces();
      } else {
        alert("Fehler beim Speichern");
      }
    } catch (err) { console.error(err); }
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

  if (!user) return <div style={{padding:'2rem'}}>Bitte einloggen.</div>;

  return (
    <div style={styles.container}>
      <h2>Publisher Portal (Angemeldet: {user.username})</h2>
      
      <div style={styles.formSection}>
        <h3>Create New Ad Space</h3>
        <div style={styles.formGrid}>
          
          {/* Name */}
          <div style={styles.formGroup}>
            <label>Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} />
          </div>

          {/* Kategorie */}
          <div style={styles.formGroup}>
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
              <option>Technology</option><option>Fashion</option><option>Gaming</option>
            </select>
          </div>

          {/* Datei Upload */}
          <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
            <label>Vorschau-Bild oder Video hochladen</label>
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={styles.input} />
          </div>

          {/* Größe */}
          <div style={styles.formGroup}>
            <label>Width</label>
            <input type="number" name="width" value={formData.width} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label>Height</label>
            <input type="number" name="height" value={formData.height} onChange={handleChange} style={styles.input} />
          </div>

          <div style={styles.formGroup}>
            <label>Min Bid (€)</label>
            <input type="number" step="0.1" name="minimumBidFloor" value={formData.minimumBidFloor} onChange={handleChange} style={styles.input} />
          </div>

          <div style={{...styles.formGroup, gridColumn: "1 / -1"}}>
             <label>Description</label>
             <input type="text" name="description" value={formData.description} onChange={handleChange} style={styles.input} />
          </div>
        </div>
        <button onClick={addAdSpace} style={styles.button}>Create Ad Space</button>
      </div>

      {/* LISTE ANZEIGEN */}
      <div style={styles.listSection}>
        <h3>Your Ad Spaces ({adSpaces.length})</h3>
        <div style={styles.grid}>
          {adSpaces.map((space) => (
            <div key={space.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h4>{space.name}</h4>
                <span style={styles.badge}>{space.category}</span>
              </div>
              
              {/* BILD / VIDEO ANZEIGEN */}
              {space.media_url ? (
                <div style={styles.mediaContainer}>
                  {space.media_url.endsWith('.mp4') || space.media_url.endsWith('.webm') ? (
                    <video src={`http://localhost:3001${space.media_url}`} controls style={styles.media} />
                  ) : (
                    <img src={`http://localhost:3001${space.media_url}`} alt="Preview" style={styles.media} />
                  )}
                </div>
              ) : (
                <div style={styles.placeholder}>Kein Bild</div>
              )}

              <p style={styles.cardText}>Größe: {space.width}x{space.height}</p>
              <p style={styles.cardText}>Min. Bid: €{space.min_bid}</p>
              <p style={{fontSize:'0.8rem', color:'#666'}}>{space.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: 'Arial' },
  formSection: { backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #e5e7eb" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" },
  formGroup: { display: "flex", flexDirection: "column" },
  input: { padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" },
  button: { backgroundColor: "#2563eb", color: "white", padding: "10px 20px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  listSection: { marginTop: "30px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  card: { backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px", padding: "15px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  badge: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" },
  cardText: { fontSize: "0.9rem", margin: "5px 0", color: "#4b5563" },
  
  // Styles für Medien
  mediaContainer: { width: '100%', height: '150px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  media: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { width: '100%', height: '150px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', marginBottom: '10px', borderRadius: '4px' }
};