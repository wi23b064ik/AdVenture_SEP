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
    const { campaignId, auctionId, bidAmount, advertiserId } = req.body;
    
    if (!auctionId || !campaignId || !bidAmount || !advertiserId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    connection = await mysql.createConnection(dbConfig);

    // Verify auction exists and is open
    const [auctionResult] = await connection.execute<RowDataPacket[]>(
      'SELECT id, status, minimum_bid_floor FROM auctions WHERE id = ?',
      [auctionId]
    );

    if (!auctionResult || auctionResult.length === 0) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const auction = auctionResult[0];
    if (auction.status !== 'open') {
      return res.status(400).json({ message: 'Auction is not open' });
    }

    if (bidAmount < auction.minimum_bid_floor) {
      return res.status(400).json({ message: `Bid must be at least €${auction.minimum_bid_floor}` });
    }

    const result = await connection.execute(
      'INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, created_at, status) VALUES (?, ?, ?, ?, NOW(), "pending")',
      [auctionId, campaignId, advertiserId, bidAmount]
    );

    res.status(201).json({ 
      message: 'Bid placed successfully',
      bidId: (result as any)[0].insertId 
    });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ message: 'Error placing bid' });
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
      JOIN auctions ON bids.auction_id = auctions.id
      JOIN ad_spaces ON auctions.ad_space_id = ad_spaces.id
      WHERE bids.advertiser_id = ?
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
app.post('/api/ad-spaces', upload.single('media'), async (req, res) => {
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

// H) Einzelnen User laden (Damit die Daten im Profil-Formular stehen)
app.get('/api/users/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, username, email, role, firstname, lastname, salutation FROM users WHERE id = ?', 
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User nicht gefunden' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Laden des Users' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 6. USER UPDATE ROUTE (Profil bearbeiten)
// ==========================================
app.put('/api/users/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    const { firstname, lastname, email, password } = req.body;

    connection = await mysql.createConnection(dbConfig);

    // 1. Basis-Daten aktualisieren (Ohne Passwort)
    const query = 'UPDATE users SET firstname = ?, lastname = ?, email = ? WHERE id = ?';
    
    // Wir sagen: Hier kommen Strings oder Zahlen rein
    const params: (string | number)[] = [firstname, lastname, email, id];

    await connection.execute(query, params);

    // 2. Passwort nur aktualisieren, wenn eines eingegeben wurde
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      // Auch hier sicherheitshalber typisieren oder direkt einfügen
      await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    // 3. Die neuen Daten zurücksenden
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
    const updatedUser = rows[0];

    res.status(200).json({ 
      message: 'Profil aktualisiert', 
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        salutation: updatedUser.salutation
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// AUCTION ROUTES
// ==========================================

// GET all auctions with their bids
app.get('/api/auctions', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Get all auctions with ad space info
    const auctionQuery = `
      SELECT 
        a.id,
        a.ad_space_id,
        a.start_time,
        a.end_time,
        a.status,
        a.minimum_bid_floor,
        a.winning_bid_id,
        ads.name as adSpaceName,
        ads.width,
        ads.height,
        ads.category,
        u.id as publisherId,
        u.username as publisherName
      FROM auctions a
      JOIN ad_spaces ads ON a.ad_space_id = ads.id
      JOIN users u ON ads.publisher_id = u.id
      ORDER BY a.end_time DESC
    `;

    const [auctions] = await connection.execute<RowDataPacket[]>(auctionQuery);

    // For each auction, fetch all bids
    const auctionsWithBids = await Promise.all(
      auctions.map(async (auction: any) => {
        const bidsQuery = `
          SELECT 
            b.id,
            b.campaign_id,
            b.advertiser_id,
            b.bid_amount,
            b.created_at,
            b.status,
            c.campaign_name,
            u.username as advertiserName
          FROM bids b
          JOIN campaigns c ON b.campaign_id = c.id
          JOIN users u ON b.advertiser_id = u.id
          WHERE b.auction_id = ?
          ORDER BY b.bid_amount DESC
        `;

        const [bids] = await connection!.execute<RowDataPacket[]>(bidsQuery, [auction.id]);

        // Determine if auction should be closed (end_time passed)
        const now = new Date();
        const endTime = new Date(auction.end_time);
        let status = auction.status;

        if (endTime < now && status === 'open') {
          status = 'closed';
          // Update in database
          await connection!.execute('UPDATE auctions SET status = ? WHERE id = ?', ['closed', auction.id]);
        }

        return {
          id: auction.id,
          adSpaceName: auction.adSpaceName,
          adSpaceId: auction.ad_space_id,
          publisherId: auction.publisherId,
          publisherName: auction.publisherName,
          startTime: auction.start_time,
          endTime: auction.end_time,
          status: status,
          minimumBidFloor: auction.minimum_bid_floor,
          totalBids: bids.length,
          allBids: bids.map((bid: any) => ({
            id: bid.id,
            auctionId: auction.id,
            advertiserId: bid.advertiser_id,
            advertiserName: bid.advertiserName,
            campaignName: bid.campaign_name,
            campaignId: bid.campaign_id,
            bidAmountCPM: parseFloat(bid.bid_amount),
            submitTime: bid.created_at,
            status: bid.status
          })),
          winningBid: bids.length > 0 ? {
            id: bids[0].id,
            advertiserId: bids[0].advertiser_id,
            advertiserName: bids[0].advertiserName,
            campaignName: bids[0].campaign_name,
            bidAmountCPM: parseFloat(bids[0].bid_amount)
          } : null
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

// GET specific auction with all bids
app.get('/api/auctions/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(dbConfig);

    const auctionQuery = `
      SELECT 
        a.id,
        a.ad_space_id,
        a.start_time,
        a.end_time,
        a.status,
        a.minimum_bid_floor,
        ads.name as adSpaceName,
        ads.width,
        ads.height,
        u.id as publisherId
      FROM auctions a
      JOIN ad_spaces ads ON a.ad_space_id = ads.id
      JOIN users u ON ads.publisher_id = u.id
      WHERE a.id = ?
    `;

    const [auctionRows] = await connection.execute<RowDataPacket[]>(auctionQuery, [id]);

    if (auctionRows.length === 0) {
      return res.status(404).json({ message: 'Auktion nicht gefunden.' });
    }

    const auction = auctionRows[0];

    const bidsQuery = `
      SELECT 
        b.id,
        b.campaign_id,
        b.advertiser_id,
        b.bid_amount,
        b.created_at,
        b.status,
        c.campaign_name,
        u.username as advertiserName
      FROM bids b
      JOIN campaigns c ON b.campaign_id = c.id
      JOIN users u ON b.advertiser_id = u.id
      WHERE b.auction_id = ?
      ORDER BY b.bid_amount DESC
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
      totalBids: bids.length,
      allBids: bids.map((bid: any) => ({
        id: bid.id,
        auctionId: id,
        advertiserId: bid.advertiser_id,
        advertiserName: bid.advertiserName,
        campaignName: bid.campaign_name,
        bidAmountCPM: parseFloat(bid.bid_amount),
        submitTime: bid.created_at,
        status: bid.status
      }))
    });
  } catch (error) {
    console.error('Auction detail error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Auktion.' });
  } finally {
    if (connection) await connection.end();
  }
});

// CREATE new auction
app.post('/api/auctions', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { ad_space_id, start_time, end_time, minimum_bid_floor } = req.body;

    console.log('Auction creation request:', { ad_space_id, start_time, end_time, minimum_bid_floor });

    if (!ad_space_id || !start_time || !end_time) {
      return res.status(400).json({ message: 'Ad Space ID, Start Zeit und End Zeit erforderlich.' });
    }

    connection = await mysql.createConnection(dbConfig);

    // Verify ad_space exists
    const [spaceCheck] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM ad_spaces WHERE id = ?',
      [ad_space_id]
    );

    if (!spaceCheck || spaceCheck.length === 0) {
      return res.status(404).json({ message: 'Ad space not found' });
    }

    // Convert ISO strings to MySQL format
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const query = `
      INSERT INTO auctions (ad_space_id, start_time, end_time, minimum_bid_floor, status, created_at)
      VALUES (?, ?, ?, ?, 'open', NOW())
    `;

    const [result] = await connection.execute(query, [
      ad_space_id,
      startDate,
      endDate,
      minimum_bid_floor || 0
    ]);

    console.log('Auction created successfully:', (result as any).insertId);

    res.status(201).json({ 
      message: 'Auktion erfolgreich erstellt.',
      auctionId: (result as any).insertId
    });
  } catch (error) {
    console.error('Auction creation error:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen der Auktion: ' + (error instanceof Error ? error.message : String(error)) });
  } finally {
    if (connection) await connection.end();
  }
});

// PLACE BID on auction
app.post('/api/auctions/:id/bids', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    const { campaign_id, advertiser_id, bid_amount } = req.body;

    if (!campaign_id || !advertiser_id || !bid_amount) {
      return res.status(400).json({ message: 'Campaign ID, Advertiser ID und Bid Amount erforderlich.' });
    }

    connection = await mysql.createConnection(dbConfig);

    // Check if auction exists and is open
    const auctionQuery = 'SELECT status, minimum_bid_floor, end_time FROM auctions WHERE id = ?';
    const [auctionRows] = await connection.execute<RowDataPacket[]>(auctionQuery, [id]);

    if (auctionRows.length === 0) {
      return res.status(404).json({ message: 'Auktion nicht gefunden.' });
    }

    const auction = auctionRows[0];

    // Check if auction is still open
    if (auction.status === 'closed') {
      return res.status(400).json({ message: 'Auktion ist bereits geschlossen.' });
    }

    const endTime = new Date(auction.end_time);
    if (endTime < new Date()) {
      // Auto-close auction
      await connection.execute('UPDATE auctions SET status = ? WHERE id = ?', ['closed', id]);
      return res.status(400).json({ message: 'Auktion ist abgelaufen.' });
    }

    // Check if bid meets minimum
    if (bid_amount < auction.minimum_bid_floor) {
      return res.status(400).json({ 
        message: `Gebot muss mindestens ${auction.minimum_bid_floor} sein.` 
      });
    }

    // Insert bid
    const bidQuery = `
      INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at)
      VALUES (?, ?, ?, ?, 'accepted', NOW())
    `;

    const [result] = await connection.execute(bidQuery, [id, campaign_id, advertiser_id, bid_amount]);

    res.status(201).json({ 
      message: 'Gebot erfolgreich eingereicht.',
      bidId: (result as any).insertId
    });
  } catch (error) {
    console.error('Bid placement error:', error);
    res.status(500).json({ message: 'Fehler beim Einreichen des Gebots.' });
  } finally {
    if (connection) await connection.end();
  }
});

// === Server starten ===
app.listen(port, () => {
  console.log(`🚀 Backend-Server läuft auf http://localhost:${port}`);
});