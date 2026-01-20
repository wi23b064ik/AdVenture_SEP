import { useEffect, useState } from "react";

// Typen für unsere Benutzer
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstname: string;
  lastname: string;
  salutation: string;
}

export default function ProfilePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State für das Bearbeiten
  const [editingUser, setEditingUser] = useState<User | null>(null); // Welcher User wird gerade bearbeitet?
  const [showModal, setShowModal] = useState(false); // Ist das Fenster offen?

  // Hilfs-State für das Formular
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "Publisher",
    firstname: "",
    lastname: "",
    salutation: "Herr"
  });

  // 1. Benutzer laden beim Start
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/users");
      if (!response.ok) throw new Error("Fehler beim Laden der Benutzer");
      const data = await response.json();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Bearbeiten-Button geklickt
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    // Formular mit den aktuellen Daten füllen
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      firstname: user.firstname,
      lastname: user.lastname,
      salutation: user.salutation
    });
    setShowModal(true);
  };

  // 3. Speichern (an das Backend senden)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Wir senden alle Daten aus formData, aber KEIN Passwort
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Benutzer erfolgreich aktualisiert!");
        setShowModal(false);
        setEditingUser(null);
        fetchUsers(); // Tabelle neu laden
      } else {
        alert("Fehler beim Speichern");
      }
    } catch (err) {
      console.error(err);
      alert("Serverfehler beim Speichern");
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Lade Profile...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2>👥 Verwaltung aller Profile</h2>
        <button onClick={fetchUsers} style={styles.refreshButton}>🔄 Aktualisieren</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr style={styles.trHead}>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Benutzername</th>
            <th style={styles.th}>Rolle</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>E-Mail</th>
            <th style={styles.th}>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={styles.tr}>
              <td style={styles.td}>{user.id}</td>
              <td style={styles.td}><strong>{user.username}</strong></td>
              <td style={styles.td}>
                <span style={user.role === 'Admin' ? styles.badgeAdmin : styles.badge}>
                  {user.role}
                </span>
              </td>
              <td style={styles.td}>{user.firstname} {user.lastname}</td>
              <td style={styles.td}>{user.email}</td>
              <td style={styles.td}>
                <button 
                  onClick={() => handleEditClick(user)} 
                  style={styles.editButton}
                >
                  ✏️ Bearbeiten
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- MODAL (BEARBEITEN FENSTER) --- */}
      {showModal && editingUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Benutzer bearbeiten: {editingUser.username}</h3>
            
            <form onSubmit={handleSave} style={styles.form}>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Rolle:</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  style={styles.select}
                >
                  <option value="Publisher">Publisher</option>
                  <option value="Advertiser">Advertiser</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Benutzername:</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>Vorname:</label>
                  <input 
                    type="text" 
                    value={formData.firstname}
                    onChange={e => setFormData({...formData, firstname: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={{...styles.formGroup, flex: 1}}>
                  <label style={styles.label}>Nachname:</label>
                  <input 
                    type="text" 
                    value={formData.lastname}
                    onChange={e => setFormData({...formData, lastname: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>E-Mail:</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.buttonGroup}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelButton}>Abbrechen</button>
                <button type="submit" style={styles.saveButton}>Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// === STYLES ===
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: "1000px", margin: "40px auto", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  refreshButton: { padding: "8px 16px", backgroundColor: "#e5e7eb", border: "none", borderRadius: "4px", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" },
  trHead: { backgroundColor: "#f9fafb", textAlign: "left", borderBottom: "2px solid #e5e7eb" },
  th: { padding: "12px 15px", color: "#374151", fontWeight: "600" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 15px", color: "#4b5563" },
  badge: { backgroundColor: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold" },
  badgeAdmin: { backgroundColor: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold" },
  editButton: { backgroundColor: "transparent", border: "1px solid #d1d5db", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" },
  
  // Modal Styles
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
  },
  modalContent: {
    backgroundColor: "white", padding: "30px", borderRadius: "8px", width: "100%", maxWidth: "500px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
  },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  formGroup: { display: "flex", flexDirection: "column" },
  row: { display: "flex", gap: "15px" },
  label: { fontSize: "0.9rem", fontWeight: "bold", marginBottom: "5px", color: "#374151" },
  input: { padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "1rem" },
  select: { padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "1rem", backgroundColor: "white" },
  buttonGroup: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" },
  saveButton: { padding: "10px 20px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  cancelButton: { padding: "10px 20px", backgroundColor: "#9ca3af", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }
};