import React, { useEffect, useState } from 'react';

// Typendefinition
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
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const isAdmin = currentUser?.role === 'Admin';

  // Admin State
  const [allUsers, setAllUsers] = useState<UserData[]>([]); 

  // User State (Formular)
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: ''
  });

  // === DATEN LADEN ===
  useEffect(() => {
    if (isAdmin) {
      fetch('http://localhost:3001/api/users')
        .then(res => res.json())
        .then(data => setAllUsers(data))
        .catch(err => console.error("Fehler:", err));
    } else if (currentUser) {
      fetch(`http://localhost:3001/api/users/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            firstname: data.firstname || '',
            lastname: data.lastname || '',
            email: data.email || '',
            password: '' 
          });
        })
        .catch(err => console.error("Fehler beim Laden meiner Daten:", err));
    }
  }, [isAdmin, currentUser.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Profil erfolgreich aktualisiert!");
        localStorage.setItem('user', JSON.stringify(data.user));
        setFormData(prev => ({ ...prev, password: '' }));
        window.location.reload();
      } else {
        alert("Fehler: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Serverfehler beim Speichern.");
    }
  };

  if (!currentUser) return <div style={{ padding: '2rem' }}>Bitte einloggen.</div>;

  return (
    <div style={styles.container}>
      
      {/* ADMIN ANSICHT */}
      {isAdmin ? (
        <div style={styles.card}>
          <h1 style={styles.heading}>👥 Verwaltung aller Profile</h1>
          <table style={styles.table}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Benutzername</th>
                <th style={styles.th}>Rolle</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>E-Mail</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={styles.td}>{u.id}</td>
                  <td style={styles.td}><strong>{u.username}</strong></td>
                  <td style={styles.td}>{u.role}</td>
                  <td style={styles.td}>{u.firstname} {u.lastname}</td>
                  <td style={styles.td}>{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        
        /* USER ANSICHT (Jetzt volle Breite) */
        <div style={styles.card}>
          <h2 style={{marginBottom: '20px'}}>Mein Profil bearbeiten</h2>
          
          <div style={styles.headerInfo}>
            <div style={styles.infoBadge}>👤 {currentUser.username}</div>
            <div style={{...styles.infoBadge, backgroundColor: '#dbeafe', color: '#1e40af'}}>
              {currentUser.role}
            </div>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Vorname</label>
              <input 
                style={styles.input} 
                name="firstname" 
                value={formData.firstname} 
                onChange={handleChange} 
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nachname</label>
              <input 
                style={styles.input} 
                name="lastname" 
                value={formData.lastname} 
                onChange={handleChange} 
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
              <label style={styles.label}>E-Mail Adresse</label>
              <input 
                style={styles.input} 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Neues Passwort setzen</label>
              <input 
                style={styles.input} 
                type="password"
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Leer lassen, um altes zu behalten"
              />
            </div>
          </div>

          <button onClick={handleUpdateProfile} style={styles.button}>
            Änderungen speichern
          </button>
        </div>
      )}
    </div>
  );
}

// === STYLES (Korrigiert für Padding rechts) ===
const styles: { [key: string]: React.CSSProperties } = {
  container: { 
    padding: '40px', // Etwas mehr Abstand zum Rand
    fontFamily: 'Arial, sans-serif', 
    backgroundColor: '#f9fafb', 
    minHeight: '90vh',
    boxSizing: 'border-box', // WICHTIG: Verhindert Überlauf nach rechts
    width: '100%',
    display: 'flex',
    justifyContent: 'center' // Zentriert den Inhalt
  },
  
  heading: { marginBottom: '1.5rem', color: '#111827' },
  
  // Card nimmt jetzt fast die ganze Breite, aber mit Max-Limit für Ästhetik
  card: { 
    backgroundColor: 'white', 
    padding: '2rem', 
    borderRadius: '10px', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)', 
    width: '100%', 
    maxWidth: '1400px', // Verhindert, dass es auf riesigen Monitoren unlesbar breit wird
    boxSizing: 'border-box' // WICHTIG!
  },
  
  cardFullWidth: { 
    backgroundColor: 'white', 
    padding: '2rem', 
    borderRadius: '10px', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
    width: '100%', 
    boxSizing: 'border-box'
  },
  
  headerInfo: { display: 'flex', gap: '15px', marginBottom: '30px' },
  infoBadge: { padding: '5px 12px', borderRadius: '20px', backgroundColor: '#f3f4f6', fontSize: '0.9rem', fontWeight: '500', color: '#374151' },
  
  formGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '20px',
    boxSizing: 'border-box'
  },
  
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '5px', fontWeight: 'bold', fontSize: '0.85rem', color: '#4b5563' },
  
  input: { 
    padding: '10px', 
    borderRadius: '6px', 
    border: '1px solid #d1d5db', 
    fontSize: '1rem',
    width: '100%', // Input füllt die Spalte
    boxSizing: 'border-box' // WICHTIG: Damit Padding nicht die Breite sprengt
  },
  
  button: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '20px' },
  
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { padding: '12px', borderBottom: '2px solid #ddd' },
  td: { padding: '12px' },
  // Ich habe cardFullWidth entfernt und benutze oben nur noch "card" für beides, da beides breit sein soll.
  
};