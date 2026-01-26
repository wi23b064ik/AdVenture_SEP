import express, { Request, Response } from 'express';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import multer from 'multer'; 
import path from 'path';
import jwt from 'jsonwebtoken';        
import cookieParser from 'cookie-parser';

const app = express();
const port = 3001;
const JWT_SECRET = 'super-geheimes-geheimnis'; // In Produktion unbedingt in .env auslagern!

// === Konfiguration ===
app.use(cors({
  origin: 'http://localhost:5173', // Vite Frontend Port
  credentials: true                
}));
app.use(express.json());
app.use(cookieParser());           
app.use('/uploads', express.static('uploads'));

// Datenbank-Konfiguration
const dbConfig = {
  host: 'localhost',
  user: 'myuser',
  password: 'mypass',           
  database: 'myapp' 
};

// === MULTER KONFIGURATION ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage: storage });

// ==========================================
// 1. LOGIN ROUTE (Remember Me Logik)
// ==========================================
app.post('/api/login', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { identifier, password, rememberMe } = req.body;
    
    if (!identifier || !password) return res.status(400).json({ message: 'Bitte alle Felder ausfüllen.' });

    connection = await mysql.createConnection(dbConfig);

    const query = 'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1';
    const [rows] = await connection.execute<RowDataPacket[]>(query, [identifier, identifier]);

    if (rows.length === 0) return res.status(401).json({ message: 'Benutzername oder Passwort falsch.' });

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) return res.status(401).json({ message: 'Benutzername oder Passwort falsch.' });

    // --- JWT Token erstellen ---
    const durationString = '1h'; 
    const durationMs = 3600000; // 1 Stunde

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: durationString }
    );

    // --- Cookie Optionen ---
    const cookieOptions = {
      httpOnly: true, 
      secure: false,  
      sameSite: 'lax' as const, 
      maxAge: rememberMe ? durationMs : undefined 
    };

    res.cookie('token', token, cookieOptions);

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

// Logout Route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Erfolgreich ausgeloggt' });
});

// ==========================================
// 2. REGISTER ROUTE
// ==========================================
app.post('/api/register', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { salutation, firstname, lastname, date_of_birth, role, username, email, password } = req.body;

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
      INSERT INTO users (salutation, firstname, lastname, username, email, password, date_of_birth, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await connection.execute(insertQuery, [salutation, firstname, lastname, username, email, hashedPassword, date_of_birth, role]);

    return res.status(201).json({ message: 'Registrierung erfolgreich!' });

  } catch (error) { 
    console.error('Register-Fehler:', error);
    return res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 3. ADMIN / USER ROUTEN (GESICHERT)
// ==========================================

// A) Alle User laden (GESCHÜTZT: Nur für Admins!)
app.get('/api/users', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    // 1. Wer fragt an? (Wir lesen die ID aus der URL: /api/users?requesterId=5)
    const { requesterId } = req.query;

    if (!requesterId) {
      return res.status(401).json({ message: 'Keine Berechtigung (ID fehlt).' });
    }

    connection = await mysql.createConnection(dbConfig);

    // 2. Prüfen: Ist diese ID ein Admin?
    const [adminCheck] = await connection.execute<RowDataPacket[]>(
      'SELECT role FROM users WHERE id = ?', 
      [requesterId]
    );

    if (adminCheck.length === 0 || adminCheck[0].role !== 'Admin') {
      return res.status(403).json({ message: 'Zugriff verweigert. Nur für Admins.' });
    }

    // 3. Wenn Admin: Alle User laden
    const query = 'SELECT id, username, email, role, firstname, lastname, salutation FROM users';
    const [rows] = await connection.execute<RowDataPacket[]>(query);
    
    return res.status(200).json(rows);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Serverfehler.' });
  } finally {
    if (connection) await connection.end();
  }
});

// B) Einzelnen User laden (Für das eigene Profil)
// Das ist okay so: Der User ruft /api/users/SEINE_EIGENE_ID auf.
app.get('/api/users/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, username, email, role, firstname, lastname, salutation FROM users WHERE id = ?', 
      [id]
    );
    
    if (rows.length === 0) return res.status(404).json({ message: 'User nicht gefunden' });
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Laden des Users' });
  } finally {
    if (connection) await connection.end();
  }
});

// C) User bearbeiten (Update)
app.put('/api/users/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    const { firstname, lastname, email, username, role, salutation } = req.body;

    connection = await mysql.createConnection(dbConfig);

    // Update Basic Info
    await connection.execute(
      'UPDATE users SET firstname = ?, lastname = ?, email = ?, username = ?, role = ?, salutation = ? WHERE id = ?', 
      [firstname, lastname, email, username, role, salutation, id]
    );

    // Update Password (Optional)
    if (req.body.password && req.body.password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    // Updated User zurücksenden (damit das Frontend die neuen Daten hat)
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT id, username, email, role, firstname, lastname, salutation FROM users WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Profil aktualisiert', user: rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 4. ADVERTISER ROUTEN (Kampagnen & AdSpaces)
// ==========================================
app.post('/api/campaigns', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { advertiser_id, name, budget, dailyBudget, startDate, endDate, targetCategories, targetCountries, targetDevices, creativeHeadline, creativeDescription, landingUrl } = req.body;
    connection = await mysql.createConnection(dbConfig);
    
    const catStr = Array.isArray(targetCategories) ? targetCategories.join(',') : targetCategories;
    const countryStr = Array.isArray(targetCountries) ? targetCountries.join(',') : targetCountries;
    const deviceStr = Array.isArray(targetDevices) ? targetDevices.join(',') : targetDevices;

    const query = `INSERT INTO campaigns (advertiser_id, campaign_name, total_budget, daily_budget, start_date, end_date, target_category, target_country, target_device, creative_headline, creative_description, landing_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    
    await connection.execute(query, [advertiser_id, name, budget, dailyBudget, startDate, endDate, catStr, countryStr, deviceStr, creativeHeadline, creativeDescription, landingUrl]);
    res.status(201).json({ message: 'Kampagne erstellt' });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Erstellen der Kampagne' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/campaigns/:advertiserId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { advertiserId } = req.params;
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM campaigns WHERE advertiser_id = ?', [advertiserId]);
    res.status(200).json(rows);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Laden der Kampagnen' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/ad-spaces', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM ad_spaces');
    res.status(200).json(rows);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Laden der Ad Spaces' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/ad-spaces', upload.single('media'), async (req, res) => {
  let connection: mysql.Connection | undefined;
  try {
    const { publisherId, name, width, height, category, minimumBidFloor, description } = req.body;
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
    connection = await mysql.createConnection(dbConfig);
    const query = `INSERT INTO ad_spaces (publisher_id, name, width, height,created_at, category, min_bid, description, media_url) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)`;
    await connection.execute(query, [publisherId, name, width, height, category || 'General', minimumBidFloor || 0, description || '', mediaUrl]);
    res.status(201).json({ message: 'Werbefläche erstellt' });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Erstellen der Werbefläche' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/ad-spaces/publisher/:publisherId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { publisherId } = req.params;
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM ad_spaces WHERE publisher_id = ? ORDER BY id DESC', [publisherId]);
    res.status(200).json(rows);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Laden der Werbeflächen' });
  } finally {
    if (connection) await connection.end();
  }
});

// D) Gebot abgeben (Allgemeine Route)
app.post('/api/bids', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { campaignId, auctionId, bidAmount, advertiserId } = req.body;
    if (!auctionId || !campaignId || !bidAmount || !advertiserId) return res.status(400).json({ message: 'Missing required fields' });

    connection = await mysql.createConnection(dbConfig);
    const [auctionResult] = await connection.execute<RowDataPacket[]>('SELECT id, status, minimum_bid_floor FROM auctions WHERE id = ?', [auctionId]);
    
    if (!auctionResult || auctionResult.length === 0) return res.status(404).json({ message: 'Auction not found' });

    const auction = auctionResult[0];
    if (auction.status !== 'open') return res.status(400).json({ message: 'Auction is not open' });
    if (bidAmount < auction.minimum_bid_floor) return res.status(400).json({ message: `Bid must be at least €${auction.minimum_bid_floor}` });

    const [result] = await connection.execute<ResultSetHeader>('INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, created_at, status) VALUES (?, ?, ?, ?, NOW(), "pending")', [auctionId, campaignId, advertiserId, bidAmount]);
    res.status(201).json({ message: 'Bid placed successfully', bidId: result.insertId });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Error placing bid' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/bids/:advertiserId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { advertiserId } = req.params;
    connection = await mysql.createConnection(dbConfig);
    const query = `SELECT bids.id, bids.bid_amount, bids.status, bids.created_at, campaigns.campaign_name, ad_spaces.name as ad_space_name FROM bids JOIN campaigns ON bids.campaign_id = campaigns.id JOIN auctions ON bids.auction_id = auctions.id JOIN ad_spaces ON auctions.ad_space_id = ad_spaces.id WHERE bids.advertiser_id = ? ORDER BY bids.created_at DESC`;
    const [rows] = await connection.execute<RowDataPacket[]>(query, [advertiserId]);
    res.status(200).json(rows);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Laden der Gebote' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 5. AUCTION ROUTES
// ==========================================

// A) Alle Auktionen laden
app.get('/api/auctions', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(dbConfig);
    const auctionQuery = `
      SELECT a.id, a.ad_space_id, a.start_time, a.end_time, a.status, a.minimum_bid_floor, a.winning_bid_id,
        ads.name as adSpaceName, ads.width, ads.height, ads.category, u.id as publisherId, u.username as publisherName
      FROM auctions a JOIN ad_spaces ads ON a.ad_space_id = ads.id JOIN users u ON ads.publisher_id = u.id ORDER BY a.end_time DESC
    `;
    const [auctions] = await connection.execute<RowDataPacket[]>(auctionQuery);
    
    const auctionsWithBids = await Promise.all(
      auctions.map(async (auction: RowDataPacket) => {
        const bidsQuery = `
          SELECT b.id, b.campaign_id, b.advertiser_id, b.bid_amount, b.created_at, b.status, c.campaign_name, u.username as advertiserName
          FROM bids b JOIN campaigns c ON b.campaign_id = c.id JOIN users u ON b.advertiser_id = u.id WHERE b.auction_id = ? ORDER BY b.bid_amount DESC
        `;
        const [bids] = await connection!.execute<RowDataPacket[]>(bidsQuery, [auction.id]);

        const now = new Date();
        const endTime = new Date(auction.end_time);
        let status = auction.status;
        
        if (endTime < now && status === 'open') {
          status = 'closed';
          await connection!.execute('UPDATE auctions SET status = ? WHERE id = ?', ['closed', auction.id]);
        }

        return {
          id: auction.id, adSpaceName: auction.adSpaceName, adSpaceId: auction.ad_space_id, publisherId: auction.publisherId, publisherName: auction.publisherName,
          startTime: auction.start_time, endTime: auction.end_time, status: status, minimumBidFloor: auction.minimum_bid_floor, totalBids: bids.length,
          allBids: bids.map((bid: RowDataPacket) => ({
            id: bid.id, auctionId: auction.id, advertiserId: bid.advertiser_id, advertiserName: bid.advertiserName, campaignName: bid.campaign_name,
            campaignId: bid.campaign_id, bidAmountCPM: parseFloat(bid.bid_amount), submitTime: bid.created_at, status: bid.status
          })),
          winningBid: bids.length > 0 ? { id: bids[0].id, advertiserId: bids[0].advertiser_id, advertiserName: bids[0].advertiserName, campaignName: bids[0].campaign_name, bidAmountCPM: parseFloat(bids[0].bid_amount) } : null
        };
      })
    );
    res.status(200).json(auctionsWithBids);
  } catch (error) { 
    console.error('Auction fetch error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Auktionen.' });
  } finally {
    if (connection) await connection.end();
  }
});

// B) Einzelne Auktion laden (MIT FOTO)
app.get('/api/auctions/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(dbConfig);
    
    // "media_url" laden
    const auctionQuery = `
      SELECT 
        a.id, a.ad_space_id, a.start_time, a.end_time, a.status, a.minimum_bid_floor, 
        ads.name as adSpaceName, ads.width, ads.height, ads.media_url as mediaUrl, 
        u.id as publisherId
      FROM auctions a 
      JOIN ad_spaces ads ON a.ad_space_id = ads.id 
      JOIN users u ON ads.publisher_id = u.id 
      WHERE a.id = ?
    `;
    
    const [auctionRows] = await connection.execute<RowDataPacket[]>(auctionQuery, [id]);
    
    if (auctionRows.length === 0) return res.status(404).json({ message: 'Auktion nicht gefunden.' });
    const auction = auctionRows[0];

    const bidsQuery = `
      SELECT b.id, b.campaign_id, b.advertiser_id, b.bid_amount, b.created_at, b.status, c.campaign_name, u.username as advertiserName
      FROM bids b JOIN campaigns c ON b.campaign_id = c.id JOIN users u ON b.advertiser_id = u.id WHERE b.auction_id = ? ORDER BY b.bid_amount DESC
    `;
    const [bids] = await connection.execute<RowDataPacket[]>(bidsQuery, [id]);

    res.status(200).json({
      id: auction.id, 
      adSpaceName: auction.adSpaceName, 
      adSpaceId: auction.ad_space_id, 
      publisherId: auction.publisherId, 
      startTime: auction.start_time, 
      endTime: auction.end_time,
      status: auction.status, 
      minimumBidFloor: auction.minimum_bid_floor, 
      mediaUrl: auction.mediaUrl, // Das Foto
      totalBids: bids.length,
      allBids: bids.map((bid: RowDataPacket) => ({
        id: bid.id, auctionId: id, advertiserId: bid.advertiser_id, advertiserName: bid.advertiserName, campaignName: bid.campaign_name, bidAmountCPM: parseFloat(bid.bid_amount), submitTime: bid.created_at, status: bid.status
      }))
    });
  } catch (error) { 
    console.error('Auction detail error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Auktion.' });
  } finally {
    if (connection) await connection.end();
  }
});

// C) Neue Auktion erstellen
app.post('/api/auctions', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { ad_space_id, start_time, end_time, minimum_bid_floor } = req.body;
    if (!ad_space_id || !start_time || !end_time) return res.status(400).json({ message: 'Ad Space ID, Start Zeit und End Zeit erforderlich.' });

    connection = await mysql.createConnection(dbConfig);
    const [spaceCheck] = await connection.execute<RowDataPacket[]>('SELECT id FROM ad_spaces WHERE id = ?', [ad_space_id]);
    if (!spaceCheck || spaceCheck.length === 0) return res.status(404).json({ message: 'Ad space not found' });

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return res.status(400).json({ message: 'Invalid date format' });

    const query = `INSERT INTO auctions (ad_space_id, start_time, end_time, minimum_bid_floor, status, created_at) VALUES (?, ?, ?, ?, 'open', NOW())`;
    const [result] = await connection.execute<ResultSetHeader>(query, [ad_space_id, startDate, endDate, minimum_bid_floor || 0]);
    res.status(201).json({ message: 'Auktion erfolgreich erstellt.', auctionId: result.insertId });
  } catch (error) { 
    console.error('Auction creation error:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen der Auktion' });
  } finally {
    if (connection) await connection.end();
  }
});

// D) Gebot auf Auktion abgeben
app.post('/api/auctions/:id/bids', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    const { campaign_id, advertiser_id, bid_amount } = req.body;
    if (!campaign_id || !advertiser_id || !bid_amount) return res.status(400).json({ message: 'Campaign ID, Advertiser ID und Bid Amount erforderlich.' });

    connection = await mysql.createConnection(dbConfig);
    const auctionQuery = 'SELECT status, minimum_bid_floor, end_time FROM auctions WHERE id = ?';
    const [auctionRows] = await connection.execute<RowDataPacket[]>(auctionQuery, [id]);

    if (auctionRows.length === 0) return res.status(404).json({ message: 'Auktion nicht gefunden.' });
    const auction = auctionRows[0];

    if (auction.status === 'closed') return res.status(400).json({ message: 'Auktion ist bereits geschlossen.' });

    const endTime = new Date(auction.end_time);
    if (endTime < new Date()) {
      await connection.execute('UPDATE auctions SET status = ? WHERE id = ?', ['closed', id]);
      return res.status(400).json({ message: 'Auktion ist abgelaufen.' });
    }

    if (bid_amount < auction.minimum_bid_floor) return res.status(400).json({ message: `Gebot muss mindestens ${auction.minimum_bid_floor} sein.` });

    const bidQuery = `INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at) VALUES (?, ?, ?, ?, 'accepted', NOW())`;
    const [result] = await connection.execute<ResultSetHeader>(bidQuery, [id, campaign_id, advertiser_id, bid_amount]);
    res.status(201).json({ message: 'Gebot erfolgreich eingereicht.', bidId: result.insertId });
  } catch (error) { 
    console.error('Bid placement error:', error);
    res.status(500).json({ message: 'Fehler beim Einreichen des Gebots.' });
  } finally {
    if (connection) await connection.end();
  }
});

// Starten
app.listen(port, () => { 
  console.log(`🚀 Backend-Server läuft auf http://localhost:${port}`); 
});