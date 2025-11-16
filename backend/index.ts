// backend/index.ts
import express from 'express';
import mysql, { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';

const app = express();
const port = 3001;

// === Konfiguration ===
app.use(cors());
app.use(express.json());

// Datenbank-Konfiguration (Hier einmalig definieren für Wiederverwendung)
const dbConfig = {
  host: 'localhost',
  user: 'myuser',
  password: 'mypass',           // Dein DB-Passwort (oft leer bei XAMPP)
  database: 'myapp' // <--- WICHTIG: Hier deinen echten DB-Namen eintragen!
};

// ==========================================
// 1. LOGIN ROUTE
// ==========================================
app.post('/api/login', async (req, res) => {
  let connection: mysql.Connection | undefined;
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ message: 'Bitte alle Felder ausfüllen.' });

    connection = await mysql.createConnection(dbConfig);

    const query = 'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1';
    const [rows] = await connection.execute<RowDataPacket[]>(query, [identifier, identifier]);

    if (rows.length === 0) return res.status(401).json({ message: 'Benutzername oder Passwort falsch.' });

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) return res.status(401).json({ message: 'Benutzername oder Passwort falsch.' });

    return res.status(200).json({
      message: 'Login erfolgreich',
      id: user.id,
      username: user.username,
      role: user.rolle
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    return res.status(500).json({ message: 'Serverfehler beim Login.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 2. REGISTER ROUTE (Korrigiert)
// ==========================================
app.post('/api/register', async (req, res) => {
  let connection: mysql.Connection | undefined;
  try {
    const { 
      salutation, firstname, lastname, date_of_birth, 
      role, username, email, password 
    } = req.body;

    // Validierung
    if (!username || !email || !password || !role || !firstname || !lastname) {
      return res.status(400).json({ message: 'Bitte alle Pflichtfelder ausfüllen.' });
    }

    connection = await mysql.createConnection(dbConfig);

    // Prüfen, ob User schon existiert
    const checkQuery = 'SELECT id FROM users WHERE email = ? OR username = ?';
    const [existingUsers] = await connection.execute<RowDataPacket[]>(checkQuery, [email, username]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Benutzername oder E-Mail bereits vergeben.' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

  // User anlegen
    // ÄNDERUNG: Wir fügen 'created_at' hinzu und nutzen SQL-Funktion NOW()
    const insertQuery = `
      INSERT INTO users 
      (salutation, firstname, lastname, username, email, password, date_of_birth, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await connection.execute(insertQuery, [
      salutation, firstname, lastname, username, email, hashedPassword, date_of_birth, role
    ]);

    return res.status(201).json({ message: 'Registrierung erfolgreich!' });

  } catch (error) {
    console.error('Register-Fehler:', error);
    return res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
  } finally {
    if (connection) await connection.end();
  }
});

// === Server starten ===
app.listen(port, () => {
  console.log(`🚀 Backend-Server läuft auf http://localhost:${port}`);
});