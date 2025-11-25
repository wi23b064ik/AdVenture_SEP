import { useState } from "react";

interface AdInventory {
  id: string;
  name: string;
  category: string;
  placement: string; // e.g., "banner_top", "sidebar", "video"
  dimensions: string; // e.g., "728x90", "300x250"
  estimatedDailyImpressions: number;
  minimumBidFloor: number; // CPM floor price (€ per 1000 impressions)
  description: string;
  createdAt: Date;
  auctions: number; // count of active auctions
}

export default function PublisherPage() {
  const [adSpaces, setAdSpaces] = useState<AdInventory[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "Technology",
    placement: "banner_top",
    dimensions: "728x90",
    estimatedDailyImpressions: 10000,
    minimumBidFloor: 0.5,
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "estimatedDailyImpressions" || name === "minimumBidFloor" 
        ? parseFloat(value) 
        : value,
    });
  };

  const addAdSpace = () => {
    if (!formData.name) {
      alert("Please fill in the Ad Space name");
      return;
    }
    const newAd: AdInventory = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date(),
      auctions: 0,
    };
    setAdSpaces([...adSpaces, newAd]);
    setFormData({
      name: "",
      category: "Technology",
      placement: "banner_top",
      dimensions: "728x90",
      estimatedDailyImpressions: 10000,
      minimumBidFloor: 0.5,
      description: "",
    });
  };

  const calculateEstimatedRevenue = (space: AdInventory) => {
    return ((space.estimatedDailyImpressions * space.minimumBidFloor) / 1000).toFixed(2);
  };

  return (
    <div style={styles.container}>
      <h2>Publisher Portal</h2>
      <p>Create and manage ad spaces for advertisers to bid on.</p>

      {/* Form Section */}
      <div style={styles.formSection}>
        <h3>Create New Ad Space</h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label>Ad Space Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Homepage Banner"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
              <option>Technology</option>
              <option>Fashion</option>
              <option>Finance</option>
              <option>Gaming</option>
              <option>News</option>
              <option>Other</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>Placement Type</label>
            <select name="placement" value={formData.placement} onChange={handleChange} style={styles.input}>
              <option value="banner_top">Top Banner (728x90)</option>
              <option value="banner_side">Side Banner (300x250)</option>
              <option value="video_pre">Pre-roll Video</option>
              <option value="native">Native Ad</option>
              <option value="interstitial">Interstitial</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>Dimensions</label>
            <input
              type="text"
              name="dimensions"
              placeholder="e.g., 728x90"
              value={formData.dimensions}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Est. Daily Impressions</label>
            <input
              type="number"
              name="estimatedDailyImpressions"
              value={formData.estimatedDailyImpressions}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Minimum Bid Floor (€ CPM)</label>
            <input
              type="number"
              step="0.1"
              name="minimumBidFloor"
              value={formData.minimumBidFloor}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
            <label>Description</label>
            <input
              type="text"
              name="description"
              placeholder="Describe the audience and context"
              value={formData.description}
              onChange={handleChange}
              style={styles.input}
            />
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
                  <span style={styles.badge}>{space.placement}</span>
                </div>
                <p style={styles.cardText}>
                  <strong>Category:</strong> {space.category}
                </p>
                <p style={styles.cardText}>
                  <strong>Dimensions:</strong> {space.dimensions}
                </p>
                <p style={styles.cardText}>
                  <strong>Daily Impressions:</strong> {space.estimatedDailyImpressions.toLocaleString()}
                </p>
                <p style={styles.cardText}>
                  <strong>Min. Bid Floor (CPM):</strong> €{space.minimumBidFloor.toFixed(2)}
                </p>
                <p style={styles.cardText}>
                  <strong>Est. Daily Revenue:</strong> €{calculateEstimatedRevenue(space)}
                </p>
                <p style={styles.cardText}>
                  <strong>Active Auctions:</strong> {space.auctions}
                </p>
                <p style={styles.description}>{space.description}</p>
                <button style={styles.secondaryButton}>Start Auction</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
  formSection: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "30px",
    border: "1px solid #e5e7eb",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
    marginBottom: "15px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "0.9rem",
  },
  button: {
    backgroundColor: "#2563eb",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  listSection: { marginTop: "30px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  badge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  cardText: { fontSize: "0.9rem", margin: "8px 0", color: "#4b5563" },
  description: { fontSize: "0.85rem", color: "#9ca3af", marginTop: "10px", fontStyle: "italic" },
  secondaryButton: {
    backgroundColor: "#10b981",
    color: "white",
    padding: "8px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
    width: "100%",
  },
  emptyState: { color: "#9ca3af", textAlign: "center", padding: "20px" },
};
