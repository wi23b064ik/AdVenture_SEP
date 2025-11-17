import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Standard Navigation für Vite/React

export default function Login() {
  const navigate = useNavigate(); // Hook für die Weiterleitung

  // State für die Eingabefelder
  const [identifier, setIdentifier] = useState(''); // Benutzername oder E-Mail
  const [password, setPassword] = useState('');
  
  // State für Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // WICHTIG: Hier muss die volle URL zu Ihrem Backend stehen (Port 3001)
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          identifier: identifier, 
          password: password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login erfolgreich:', data);
        
        // === WEITERLEITUNG BASIEREND AUF ROLLE ===
        // Passen Sie die Pfade an die Namen Ihrer anderen .tsx Dateien an
        // (z.B. wenn AdvertiserPage.tsx unter der Route '/advertiser' erreichbar ist)
        
        switch (data.role) {
          case 'Publisher':
            navigate('/publisher'); // Leitet zur PublisherPage weiter
            break;
          case 'Advertiser':
            navigate('/advertiser'); // Leitet zur AdvertiserPage weiter
            break;
          case 'Admin':
            navigate('/admin');
            break;
          default:
            navigate('/'); // Fallback zur Homepage
        }

      } else {
        // Fehler vom Server anzeigen
        setError(data.message || 'Login fehlgeschlagen');
      }

    } catch (err) {
      console.error("Login Fehler:", err);
      setError('Keine Verbindung zum Server möglich. Läuft das Backend auf Port 3001?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Willkommen zurück</h2>
        <p style={styles.subtitle}>Bitte melden Sie sich an</p>

        {/* Fehlermeldung Box */}
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          
          {/* Benutzername / Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="identifier">Benutzername oder E-Mail</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              style={styles.input}
              placeholder="Ihr Benutzername"
            />
          </div>

          {/* Passwort */}
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Wird geladen...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}

// === STYLING (CSS-in-JS) ===
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '0.5rem',
    color: '#1f2937',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.25rem',
    color: '#374151',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background-color 0.2s',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    textAlign: 'center',
    border: '1px solid #fca5a5'
  },
};