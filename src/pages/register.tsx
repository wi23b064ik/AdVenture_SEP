import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  // State für alle Formularfelder
  const [formData, setFormData] = useState({
    salutation: 'Herr',
    firstname: '',
    lastname: '',
    date_of_birth: '',
    role: 'Publisher', // Standardwert
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handler für Änderungen in den Inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Passwort-Bestätigung prüfen
    if (formData.password !== formData.confirmPassword) {
      setError('The passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salutation: formData.salutation,
          firstname: formData.firstname,
          lastname: formData.lastname,
          date_of_birth: formData.date_of_birth,
          role: formData.role,
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successfull! Please login.');
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create new Account</h2>
        <p style={styles.subtitle}>Be a part of AdVenture</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          
          {/* Rolle und Anrede */}
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>I am:</label>
              <select name="role" value={formData.role} onChange={handleChange} style={styles.input}>
                <option value="Publisher">Publisher</option>
                <option value="Advertiser">Advertiser</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Salutation</label>
              <select name="salutation" value={formData.salutation} onChange={handleChange} style={styles.input}>
                <option value="Herr">Mr.</option>
                <option value="Frau">Ms.</option>
                <option value="Divers">Diverse</option>
              </select>
            </div>
          </div>

          {/* Name */}
          <div style={styles.row}>
            <input name="firstname" placeholder="Firstname" required onChange={handleChange} style={styles.input} />
            <input name="lastname" placeholder="Lastname" required onChange={handleChange} style={styles.input} />
          </div>

          {/* Geburtsdatum */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Date of birth</label>
            <input type="date" name="date_of_birth" required onChange={handleChange} style={styles.input} />
          </div>

          {/* Login Daten */}
          <input name="username" placeholder="Username" required onChange={handleChange} style={styles.input} />
          <input type="email" name="email" placeholder="E-Mail" required onChange={handleChange} style={styles.input} />
          
          <input type="password" name="password" placeholder="Password" required onChange={handleChange} style={styles.input} />
          <input type="password" name="confirmPassword" placeholder="Repeat password" required onChange={handleChange} style={styles.input} />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Registration...' : 'Free Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif', padding: '20px' },
  card: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem', color: '#1f2937' },
  subtitle: { textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'flex', gap: '1rem' }, // Für nebeneinanderliegende Felder
  inputGroup: { display: 'flex', flexDirection: 'column', flex: 1 },
  label: { fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' },
  input: { padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  button: { backgroundColor: '#10b981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }, // Grün für Registration
  errorBox: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid #fca5a5' },
};