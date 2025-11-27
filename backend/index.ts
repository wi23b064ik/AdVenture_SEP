import express, { Request, Response } from 'express';
import mysql, { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import multer from 'multer'; 
import path from 'path';

const app = express();
const port = 3001;

// === Konfiguration ===
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Datenbank-Konfiguration
const dbConfig = {
  host: 'localhost',
  user: 'myuser',
  password: 'mypass',           
  database: 'myapp' // <--- WICHTIG: Namen anpassen!
};

// === MULTER KONFIGURATION (Für Datei-Uploads) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Speicherort
  },
  filename: (req, file, cb) => {
    // Wir hängen den Zeitstempel an, damit Dateinamen einzigartig sind
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage: storage });

// ==========================================
// 1. LOGIN ROUTE
// ==========================================
app.post('/api/login', async (req: Request, res: Response) => {
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
      role: user.role 
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    return res.status(500).json({ message: 'Serverfehler beim Login.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 2. REGISTER ROUTE
// ==========================================
app.post('/api/register', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { 
      salutation, firstname, lastname, date_of_birth, 
      role, username, email, password 
    } = req.body;

    if (!username || !email || !password || !role || !firstname || !lastname) {
      return res.status(400).json({ message: 'Bitte alle Pflichtfelder ausfüllen.' });
    }

    connection = await mysql.createConnection(dbConfig);

    const checkQuery = 'SELECT id FROM users WHERE email = ? OR username = ?';
    const [existingUsers] = await connection.execute<RowDataPacket[]>(checkQuery, [email, username]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Benutzername oder E-Mail bereits vergeben.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

// ==========================================
// 3. ADMIN ROUTE
// ==========================================
app.get('/api/users', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = 'SELECT id, username, email, role, firstname, lastname, salutation FROM users';
    const [rows] = await connection.execute<RowDataPacket[]>(query);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    return res.status(500).json({ message: 'Serverfehler.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 4. ADVERTISER ROUTEN
// ==========================================

// A) Kampagne erstellen
app.post('/api/campaigns', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { 
      advertiser_id, name, budget, dailyBudget, startDate, endDate, 
      targetCategories, targetCountries, targetDevices, 
      creativeHeadline, creativeDescription, landingUrl 
    } = req.body;

    connection = await mysql.createConnection(dbConfig);

    // Arrays in Strings umwandeln
    const catStr = Array.isArray(targetCategories) ? targetCategories.join(',') : targetCategories;
    const countryStr = Array.isArray(targetCountries) ? targetCountries.join(',') : targetCountries;
    const deviceStr = Array.isArray(targetDevices) ? targetDevices.join(',') : targetDevices;

    const query = `
      INSERT INTO campaigns 
      (advertiser_id, campaign_name, total_budget, daily_budget, start_date, end_date, 
       target_category, target_country, target_device, creative_headline, creative_description, landing_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await connection.execute(query, [
      advertiser_id, name, budget, dailyBudget, startDate, endDate,
      catStr, countryStr, deviceStr, creativeHeadline, creativeDescription, landingUrl
    ]);

    res.status(201).json({ message: 'Kampagne erstellt' });
  } catch (error) {
    console.error("Fehler Kampagne:", error); // Fehler nutzen!
    res.status(500).json({ message: 'Fehler beim Erstellen der Kampagne' });
  } finally {
    if (connection) await connection.end();
  }
});

// B) Kampagnen eines Advertisers laden
app.get('/api/campaigns/:advertiserId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { advertiserId } = req.params;
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM campaigns WHERE advertiser_id = ?', 
      [advertiserId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Fehler beim Laden der Kampagnen:", error); // Fehler nutzen!
    res.status(500).json({ message: 'Fehler beim Laden der Kampagnen' });
  } finally {
    if (connection) await connection.end();
  }
});

// C) Verfügbare Ad Spaces laden
app.get('/api/ad-spaces', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM ad_spaces');
    res.status(200).json(rows);
  } catch (error) {
    console.error("Fehler beim Laden der Ad Spaces:", error); // Fehler nutzen!
    res.status(500).json({ message: 'Fehler beim Laden der Ad Spaces' });
  } finally {
    if (connection) await connection.end();
  }
});

// D) Gebot abgeben
app.post('/api/bids', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { campaignId, adSpaceId, bidAmount } = req.body;
    connection = await mysql.createConnection(dbConfig);

    await connection.execute(
      'INSERT INTO bids (campaign_id, ad_space_id, bid_amount) VALUES (?, ?, ?)',
      [campaignId, adSpaceId, bidAmount]
    );

    res.status(201).json({ message: 'Gebot platziert' });
  } catch (error) {
    console.error("Fehler beim Bieten:", error); // Fehler nutzen!
    res.status(500).json({ message: 'Fehler beim Bieten' });
  } finally {
    if (connection) await connection.end();
  }
});

// E) Gebots-Historie laden
app.get('/api/bids/:advertiserId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { advertiserId } = req.params;
    connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT bids.id, bids.bid_amount, bids.status, bids.created_at,
             campaigns.campaign_name, ad_spaces.name as ad_space_name
      FROM bids
      JOIN campaigns ON bids.campaign_id = campaigns.id
      JOIN ad_spaces ON bids.ad_space_id = ad_spaces.id
      WHERE campaigns.advertiser_id = ?
      ORDER BY bids.created_at DESC
    `;
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, [advertiserId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Fehler beim Laden der Gebote:", error); // Fehler nutzen!
    res.status(500).json({ message: 'Fehler beim Laden der Gebote' });
  } finally {
    if (connection) await connection.end();
  }
});

// F) Neuen Ad Space erstellen (JETZT MIT BILD!)
// 'upload.single("media")' bedeutet: Wir erwarten eine Datei im Feld "media"
app.post('/api/ad-spaces', upload.single('media'), async (req, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    // req.body enthält die Textfelder
    const { publisherId, name, width, height, category, minimumBidFloor, description } = req.body;
    
    // req.file enthält die Datei-Infos (falls eine hochgeladen wurde)
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    connection = await mysql.createConnection(dbConfig);

    const query = `
      INSERT INTO ad_spaces (publisher_id, name, width, height,created_at, category, min_bid, description, media_url) 
      VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)
    `;

    await connection.execute(query, [
      publisherId, name, width, height, 
      category || 'General',        
      minimumBidFloor || 0,         
      description || '',
      mediaUrl // <--- Hier speichern wir den Pfad
    ]);

    res.status(201).json({ message: 'Werbefläche erstellt' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Erstellen der Werbefläche' });
  } finally {
    if (connection) await connection.end();
  }
});

// G) Ad Spaces laden (Bleibt fast gleich, holt aber jetzt auch media_url)
app.get('/api/ad-spaces/publisher/:publisherId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { publisherId } = req.params;
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM ad_spaces WHERE publisher_id = ? ORDER BY id DESC', 
      [publisherId]
    );
    res.status(200).json(rows);
  // ...
    res.status(200).json(rows);
  } catch (error) {
    console.error(error); // <--- DIESE ZEILE HINZUFÜGEN
    res.status(500).json({ message: 'Fehler beim Laden der Werbeflächen' });
  } finally {
    if (connection) await connection.end();
  }
});

// === Server starten ===
app.listen(port, () => {
  console.log(`🚀 Backend-Server läuft auf http://localhost:${port}`);
});