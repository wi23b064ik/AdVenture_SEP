import React, { useEffect, useState } from "react";

// Typen
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
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const isAdmin = currentUser?.role === 'Admin';

  // --- STATE FÜR ADMINS ---
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    username: "", email: "", role: "Publisher", firstname: "", lastname: "", salutation: "Herr"
  });

  // --- STATE FÜR USER (Hier fehlten vorher Username & Co) ---
  const [myProfileForm, setMyProfileForm] = useState({
    username: '', // Neu: Muss mitgeschickt werden
    role: '',     // Neu: Muss mitgeschickt werden
    salutation: '', // Neu: Muss mitgeschickt werden
    firstname: '', 
    lastname: '', 
    email: '', 
    password: ''
  });

  // =========================================================
  // LOGIK FÜR ADMINS
  // =========================================================
  const fetchUsers = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users?requesterId=${currentUser.id}`);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error("Keine Berechtigung (Nur Admins).");
      }
      if (!response.ok) throw new Error("Fehler beim Laden der Benutzer");
      
      const data = await response.json();
      setUsers(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unbekannter Fehler");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setAdminFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      firstname: user.firstname,
      lastname: user.lastname,
      salutation: user.salutation
    });
    setShowModal(true);
  };

  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminFormData),
      });

      if (response.ok) {
        alert("Benutzer aktualisiert!");
        setShowModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        alert("Fehler beim Speichern");
      }
    } catch (err) {
      console.error(err);
      alert("Serverfehler");
    }
  };

  // =========================================================
  // LOGIK FÜR USER
  // =========================================================
  const fetchMyProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/api/users/${currentUser.id}`);
      const data = await res.json();
      
      // WICHTIG: Wir laden ALLE Daten in den State, auch die, die man nicht sieht
      setMyProfileForm({
        username: data.username || '',
        role: data.role || '',
        salutation: data.salutation || 'Herr',
        firstname: data.firstname || '',
        lastname: data.lastname || '',
        email: data.email || '',
        password: '' 
      });
    } catch (err) { console.error(err); }
  };

  const handleMyProfileUpdate = async () => {
    try {
      // Jetzt senden wir auch username, role und salutation mit!
      const res = await fetch(`http://localhost:3001/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(myProfileForm)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Profil gespeichert!");
        // Update LocalStorage
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
        // Passwortfeld leeren
        setMyProfileForm(prev => ({ ...prev, password: '' }));
      } else {
        alert("Fehler: " + (data.message || "Speichern fehlgeschlagen"));
      }
    } catch (error) {
      console.error("Update Fehler:", error);
      alert("Fehler beim Speichern (Server nicht erreichbar)");
    }
  };

  // === EFFEKTE ===
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      fetchMyProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!currentUser) return <div style={{ padding: "20px" }}>Bitte einloggen</div>;

  // =========================================================
  // RENDER: ADMIN
  // =========================================================
  if (isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <h2>👥 Verwaltung aller Profile</h2>
          <button onClick={fetchUsers} style={styles.refreshButton}>🔄 Refresh</button>
        </div>

        {loading && <p>Lade...</p>}
        {error && <p style={{color:'red'}}>{error}</p>}

        <table style={styles.table}>
          <thead>
            <tr style={styles.trHead}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Username</th>
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
                  <button onClick={() => handleEditClick(user)} style={styles.editButton}>
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && editingUser && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3>Benutzer bearbeiten: {editingUser.username}</h3>
              <form onSubmit={handleAdminSave} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rolle:</label>
                  <select 
                    value={adminFormData.role} 
                    onChange={e => setAdminFormData({...adminFormData, role: e.target.value})}
                    style={styles.select}
                  >
                    <option value="Publisher">Publisher</option>
                    <option value="Advertiser">Advertiser</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Username:</label>
                  <input style={styles.input} type="text" value={adminFormData.username} onChange={e => setAdminFormData({...adminFormData, username: e.target.value})} />
                </div>
                <div style={styles.row}>
                  <div style={{...styles.formGroup, flex: 1}}>
                    <label style={styles.label}>Vorname:</label>
                    <input style={styles.input} type="text" value={adminFormData.firstname} onChange={e => setAdminFormData({...adminFormData, firstname: e.target.value})} />
                  </div>
                  <div style={{...styles.formGroup, flex: 1}}>
                    <label style={styles.label}>Nachname:</label>
                    <input style={styles.input} type="text" value={adminFormData.lastname} onChange={e => setAdminFormData({...adminFormData, lastname: e.target.value})} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>E-Mail:</label>
                  <input style={styles.input} type="email" value={adminFormData.email} onChange={e => setAdminFormData({...adminFormData, email: e.target.value})} />
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

  // =========================================================
  // RENDER: USER (Mein Profil)
  // =========================================================
  return (
    <div style={styles.container}>
      <h2>Mein Profil bearbeiten</h2>
      <div style={styles.headerRow}>
         <span style={styles.badge}>Angemeldet als: {currentUser.username}</span>
         <span style={{...styles.badge, marginLeft: '10px'}}>{currentUser.role}</span>
      </div>
      
      <div style={styles.form}>
        <div style={styles.row}>
          <div style={{...styles.formGroup, flex: 1}}>
             <label style={styles.label}>Vorname</label>
             <input style={styles.input} value={myProfileForm.firstname} onChange={e => setMyProfileForm({...myProfileForm, firstname: e.target.value})} />
          </div>
          <div style={{...styles.formGroup, flex: 1}}>
             <label style={styles.label}>Nachname</label>
             <input style={styles.input} value={myProfileForm.lastname} onChange={e => setMyProfileForm({...myProfileForm, lastname: e.target.value})} />
          </div>
        </div>
        
        <div style={styles.formGroup}>
           <label style={styles.label}>E-Mail</label>
           <input style={styles.input} value={myProfileForm.email} onChange={e => setMyProfileForm({...myProfileForm, email: e.target.value})} />
        </div>

        <div style={styles.formGroup}>
           <label style={styles.label}>Neues Passwort (optional)</label>
           <input type="password" style={styles.input} value={myProfileForm.password} onChange={e => setMyProfileForm({...myProfileForm, password: e.target.value})} placeholder="Leer lassen um zu behalten" />
        </div>

        <button onClick={handleMyProfileUpdate} style={styles.saveButton}>Änderungen speichern</button>
      </div>
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
  input: { padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "1rem", width: '100%', boxSizing: 'border-box' },
  select: { padding: "10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "1rem", backgroundColor: "white", width: '100%' },
  buttonGroup: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" },
  saveButton: { padding: "10px 20px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  cancelButton: { padding: "10px 20px", backgroundColor: "#9ca3af", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }
};