import React, { useEffect, useState } from 'react';

// Wir definieren, wie ein User aussieht
interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  firstname: string;
  lastname: string;
  salutation: string;
}

export default function ProfilePage() {
  // 1. Eingeloggten User auslesen
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const isAdmin = currentUser?.role === 'Admin';

  // State für die Admin-Tabelle (Jetzt mit echtem Typ statt 'any')
  const [allUsers, setAllUsers] = useState<UserData[]>([]); 

  // ... der Rest bleibt gleich ...

  // Wenn man Admin ist: Daten vom Server laden
  useEffect(() => {
    if (isAdmin) {
      fetch('http://localhost:3001/api/users')
        .then(res => res.json())
        .then(data => setAllUsers(data))
        .catch(err => console.error("Fehler beim Laden der User:", err));
    }
  }, [isAdmin]);

  if (!currentUser) return <div style={{ padding: '2rem' }}>Bitte einloggen.</div>;

  return (
    <div style={styles.container}>
      
      {/* === ANSICHT FÜR DEN ADMIN (Tabelle aller User) === */}
      {isAdmin ? (
        <div style={styles.cardFullWidth}>
          <h1 style={styles.heading}>👥 Verwaltung aller Profile</h1>
          <p>Hier sehen Sie alle registrierten Benutzer der Plattform.</p>
          
          <table style={styles.table}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Benutzername</th>
                <th style={styles.th}>Rolle</th>
                <th style={styles.th}>E-Mail</th>
                <th style={styles.th}>Name</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={styles.td}>{u.id}</td>
                  <td style={styles.td}><strong>{u.username}</strong></td>
                  <td style={styles.td}>
                    <span style={{ 
                      ...styles.badge, 
                      backgroundColor: u.role === 'Admin' ? '#fee2e2' : '#e0f2fe',
                      color: u.role === 'Admin' ? '#991b1b' : '#075985'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>{u.salutation} {u.firstname} {u.lastname}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        
        /* === ANSICHT FÜR NORMALE USER (Eigenes Profil) === */
        <div style={styles.card}>
          <h1 style={styles.heading}>Mein Profil</h1>
          <div style={styles.infoRow}>
            <strong>Benutzername:</strong> <span>{currentUser.username}</span>
          </div>
          <div style={styles.infoRow}>
            <strong>Meine Rolle:</strong> <span>{currentUser.role}</span>
          </div>
          <div style={styles.infoRow}>
            <strong>User-ID:</strong> <span>{currentUser.id}</span>
          </div>
        </div>
      )}

    </div>
  );
}

// === STYLES ===
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '2rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '90vh' },
  heading: { marginBottom: '1.5rem', color: '#111827' },
  card: { backgroundColor: 'white', padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', maxWidth: '500px' },
  cardFullWidth: { backgroundColor: 'white', padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', width: '100%', overflowX: 'auto' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { padding: '12px', borderBottom: '2px solid #ddd' },
  td: { padding: '12px' },
  badge: { padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }
};