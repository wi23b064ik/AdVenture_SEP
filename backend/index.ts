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
const JWT_SECRET = 'super-secret-key'; // Sollte in Produktion in .env stehen

// === Configuration ===
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true                
}));
app.use(express.json());
app.use(cookieParser());           
app.use('/uploads', express.static('uploads'));

// Database Configuration
const dbConfig = {
  host: 'localhost',
  user: 'myuser',
  password: 'mypass',           
  database: 'myapp' 
};

// Multer Storage
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
// 1. LOGIN ROUTE 
// ==========================================
app.post('/api/login', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { identifier, password, rememberMe } = req.body;
    if (!identifier || !password) return res.status(400).json({ message: 'Please fill in all fields.' });

    connection = await mysql.createConnection(dbConfig);
    const query = 'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1';
    const [rows] = await connection.execute<RowDataPacket[]>(query, [identifier, identifier]);

    if (rows.length === 0) return res.status(401).json({ message: 'Invalid username or password.' });

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) return res.status(401).json({ message: 'Invalid username or password.' });

    const durationMs = 3600000; 
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true, 
      secure: false,  
      sameSite: 'lax', 
      maxAge: rememberMe ? durationMs : undefined 
    });

    return res.status(200).json({
      message: 'Login successful',
      id: user.id,
      username: user.username,
      role: user.role,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email
    });
  } catch (error) { 
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// 2. REGISTER ROUTE
// ==========================================
app.post('/api/register', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { salutation, firstname, lastname, date_of_birth, role, username, email, password } = req.body;

    if (!username || !email || !password || !role || !firstname || !lastname) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    connection = await mysql.createConnection(dbConfig);
    const checkQuery = 'SELECT id FROM users WHERE email = ? OR username = ?';
    const [existingUsers] = await connection.execute<RowDataPacket[]>(checkQuery, [email, username]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username or Email already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `INSERT INTO users (salutation, firstname, lastname, username, email, password, date_of_birth, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    await connection.execute(insertQuery, [salutation, firstname, lastname, username, email, hashedPassword, date_of_birth, role]);

    return res.status(201).json({ message: 'Registration successful!' });
  } catch (error) { 
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 3. ADMIN / USER ROUTES
// ==========================================
app.get('/api/users', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { requesterId } = req.query;
    if (!requesterId) return res.status(401).json({ message: 'Unauthorized (ID missing).' });

    connection = await mysql.createConnection(dbConfig);
    const [adminCheck] = await connection.execute<RowDataPacket[]>('SELECT role FROM users WHERE id = ?', [requesterId]);

    if (adminCheck.length === 0 || adminCheck[0].role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const query = 'SELECT id, username, email, role, firstname, lastname, salutation FROM users';
    const [rows] = await connection.execute<RowDataPacket[]>(query);
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT id, username, email, role, firstname, lastname, salutation FROM users WHERE id = ?', [id]);
    
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error loading user' });
  } finally {
    if (connection) await connection.end();
  }
});

app.put('/api/users/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    const { firstname, lastname, email, username, role, salutation } = req.body;

    connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE users SET firstname = ?, lastname = ?, email = ?, username = ?, role = ?, salutation = ? WHERE id = ?', [firstname, lastname, email, username, role, salutation, id]);

    if (req.body.password && req.body.password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    const [rows] = await connection.execute<RowDataPacket[]>('SELECT id, username, email, role, firstname, lastname, salutation FROM users WHERE id = ?', [id]);
    res.status(200).json({ message: 'Profile updated', user: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 4. ADVERTISER ROUTES
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
    res.status(201).json({ message: 'Campaign created' });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Error creating campaign' });
  } finally {
    if (connection) await connection.end();
  }
});

app.get('/api/campaigns-all', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(dbConfig);
    const query = `
      SELECT c.*, u.username as advertiser_name 
      FROM campaigns c
      JOIN users u ON c.advertiser_id = u.id
      ORDER BY c.created_at DESC
    `;
    const [rows] = await connection.execute<RowDataPacket[]>(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error loading all campaigns' });
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
    res.status(500).json({ message: 'Error loading campaigns' });
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
    res.status(500).json({ message: 'Error loading ad spaces' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/ad-spaces', upload.single('media'), async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { publisherId, name, width, height, category, minimumBidFloor, description, websiteUrl } = req.body;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadedFile = (req as any).file; 
    const mediaUrl = uploadedFile ? `/uploads/${uploadedFile.filename}` : null; 

    connection = await mysql.createConnection(dbConfig);
    
    const query = `
      INSERT INTO ad_spaces 
      (publisher_id, name, width, height, created_at, category, min_bid, description, website_url, media_url) 
      VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
    `;
    
    await connection.execute(query, [
      publisherId, name, width, height, 
      category || 'General', minimumBidFloor || 0, description || '', 
      websiteUrl || '', mediaUrl
    ]);
    
    res.status(201).json({ message: 'Ad Space created' });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Error creating ad space' });
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
    res.status(500).json({ message: 'Error loading publisher ad spaces' });
  } finally {
    if (connection) await connection.end();
  }
});

// FETCH BIDS FOR ADVERTISER (UPDATED: INCLUDES CREATIVE STATUS)
app.get('/api/bids/:advertiserId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { advertiserId } = req.params;
    connection = await mysql.createConnection(dbConfig);
    
    const query = `
      SELECT 
        bids.id, 
        bids.bid_amount, 
        bids.status, 
        bids.created_at, 
        bids.creative_url,
        bids.creative_status,
        campaigns.campaign_name, 
        ad_spaces.name as ad_space_name,
        ad_spaces.media_url 
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
    console.error(error);
    res.status(500).json({ message: 'Error loading bids' });
  } finally {
    if (connection) await connection.end();
  }
});

// === NEW: ADVERTISER UPLOAD CREATIVE (AFTER WIN) ===
app.post('/api/bids/upload-creative', upload.single('creative'), async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { bidId } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadedFile = (req as any).file;

    if (!uploadedFile || !bidId) return res.status(400).json({ message: 'No file or bidId provided' });

    const creativeUrl = `/uploads/${uploadedFile.filename}`;

    connection = await mysql.createConnection(dbConfig);
    
    // Save image to BID and set creative_status to 'pending_review'
    await connection.execute(
      `UPDATE bids SET creative_url = ?, creative_status = 'pending_review' WHERE id = ?`,
      [creativeUrl, bidId]
    );

    res.status(200).json({ message: 'Creative uploaded, waiting for approval.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed' });
  } finally {
    if (connection) await connection.end();
  }
});


// --- FÜGE DIES IN DEINE INDEX.TS EIN ---

// Holen aller gewonnenen Bids für einen bestimmten Publisher (für das Review Dashboard)
app.get('/api/publisher/:publisherId/winning-bids', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { publisherId } = req.params;
    connection = await mysql.createConnection(dbConfig);
    
    const query = `
      SELECT 
        b.id, b.bid_amount, b.status, b.creative_url, b.creative_status, b.created_at,
        c.campaign_name, 
        u.username as advertiser_name,
        ads.name as ad_space_name
      FROM bids b
      JOIN campaigns c ON b.campaign_id = c.id
      JOIN users u ON b.advertiser_id = u.id
      JOIN auctions a ON b.auction_id = a.id
      JOIN ad_spaces ads ON a.ad_space_id = ads.id
      WHERE ads.publisher_id = ? 
      AND b.status = 'won'
      ORDER BY b.created_at DESC
    `;
    
    const [rows] = await connection.execute<RowDataPacket[]>(query, [publisherId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error loading publisher bids' });
  } finally {
    if (connection) await connection.end();
  }
});

// === NEW: PUBLISHER APPROVAL ===
app.post('/api/bids/:bidId/status', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { bidId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `UPDATE bids SET creative_status = ? WHERE id = ?`,
      [status, bidId]
    );

    res.status(200).json({ message: `Creative ${status}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Status update failed' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 5. AUCTION ROUTES (UPDATED WITH WIN LOGIC)
// ==========================================

app.get('/api/auctions', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(dbConfig);
    const auctionQuery = `
      SELECT a.id, a.ad_space_id, a.start_time, a.end_time, a.status, a.minimum_bid_floor, a.winning_bid_id,
        ads.name as adSpaceName, ads.width, ads.height, ads.category, ads.media_url, 
        u.id as publisherId, u.username as publisherName
      FROM auctions a JOIN ad_spaces ads ON a.ad_space_id = ads.id JOIN users u ON ads.publisher_id = u.id ORDER BY a.end_time DESC
    `;
    const [auctions] = await connection.execute<RowDataPacket[]>(auctionQuery);
    
    const auctionsWithBids = await Promise.all(
      auctions.map(async (auction: RowDataPacket) => {
        const bidsQuery = `
          SELECT b.id, b.campaign_id, b.advertiser_id, b.bid_amount, b.created_at, b.status, 
                 b.impressions, b.clicks, b.creative_url, b.creative_status,
                 c.campaign_name, 
                 u.username as advertiserName
          FROM bids b JOIN campaigns c ON b.campaign_id = c.id JOIN users u ON b.advertiser_id = u.id WHERE b.auction_id = ? ORDER BY b.bid_amount DESC
        `;
        const [bids] = await connection!.execute<RowDataPacket[]>(bidsQuery, [auction.id]);

        const now = new Date();
        const endTime = new Date(auction.end_time);
        let status = auction.status;
        
        // --- WIN LOGIC: CHECK EXPIRED AUCTIONS ---
        if (endTime < now && status === 'open') {
          status = 'closed';
          await connection!.execute('UPDATE auctions SET status = ? WHERE id = ?', ['closed', auction.id]);
          
          if (bids.length > 0) {
             const winner = bids[0]; // Highest bid
             // Set winner to 'won'
             await connection!.execute('UPDATE bids SET status = ? WHERE id = ?', ['won', winner.id]);
             // Set others to 'lost'
             await connection!.execute('UPDATE bids SET status = ? WHERE auction_id = ? AND id != ?', ['lost', auction.id, winner.id]);
             // Update auction table
             await connection!.execute('UPDATE auctions SET winning_bid_id = ? WHERE id = ?', [winner.id, auction.id]);
          }
        }

        const winningBidData = bids.length > 0 ? bids[0] : null;

        return {
          id: auction.id, 
          adSpaceName: auction.adSpaceName, 
          adSpaceId: auction.ad_space_id, 
          publisherId: auction.publisherId, 
          publisherName: auction.publisherName,
          mediaUrl: auction.mediaUrl, 
          startTime: auction.start_time, 
          endTime: auction.end_time, 
          status: status, 
          minimumBidFloor: auction.minimum_bid_floor, 
          totalBids: bids.length,
          allBids: bids.map((bid: RowDataPacket) => ({
            id: bid.id, 
            auctionId: auction.id, 
            advertiserId: bid.advertiser_id, 
            advertiserName: bid.advertiserName, 
            campaignName: bid.campaign_name,
            campaignId: bid.campaign_id, 
            bidAmountCPM: parseFloat(bid.bid_amount), 
            submitTime: bid.created_at, 
            status: bid.status,
            impressions: bid.impressions, 
            clicks: bid.clicks
          })),
          winningBid: winningBidData ? { 
              id: winningBidData.id,
              advertiserId: winningBidData.advertiser_id, 
              advertiserName: winningBidData.advertiserName, 
              campaignName: winningBidData.campaign_name, 
              campaignId: winningBidData.campaign_id,
              bidAmountCPM: parseFloat(winningBidData.bid_amount),
              impressions: winningBidData.impressions,
              clicks: winningBidData.clicks
          } : null
        };
      })
    );
    res.status(200).json(auctionsWithBids);
  } catch (error) { 
    console.error('Auction fetch error:', error);
    res.status(500).json({ message: 'Error fetching auctions.' });
  } finally {
    if (connection) await connection.end();
  }
});

// In index.ts

app.get('/api/auctions/:id', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(dbConfig);
    
    // 1. UPDATE THE SQL QUERY to select description and category explicitly
    const auctionQuery = `
      SELECT 
        a.id, a.ad_space_id, a.start_time, a.end_time, a.status, a.minimum_bid_floor, 
        ads.name as adSpaceName, ads.width, ads.height, ads.media_url as mediaUrl, 
        ads.category, ads.description,  -- ADDED THESE
        u.id as publisherId, u.username as publisherName
      FROM auctions a 
      JOIN ad_spaces ads ON a.ad_space_id = ads.id 
      JOIN users u ON ads.publisher_id = u.id 
      WHERE a.id = ?
    `;
    const [auctionRows] = await connection.execute<RowDataPacket[]>(auctionQuery, [id]);
    if (auctionRows.length === 0) return res.status(404).json({ message: 'Auction not found.' });
    const auction = auctionRows[0];

    const bidsQuery = `
      SELECT b.id, b.campaign_id, b.advertiser_id, b.bid_amount, b.created_at, b.status, 
             c.campaign_name, b.impressions, b.clicks,
             u.username as advertiserName
      FROM bids b JOIN campaigns c ON b.campaign_id = c.id JOIN users u ON b.advertiser_id = u.id WHERE b.auction_id = ? ORDER BY b.bid_amount DESC
    `;
    const [bids] = await connection.execute<RowDataPacket[]>(bidsQuery, [id]);

    // 2. INCLUDE NEW FIELDS IN RESPONSE
    res.status(200).json({
      id: auction.id, 
      adSpaceName: auction.adSpaceName, 
      adSpaceId: auction.ad_space_id, 
      publisherId: auction.publisherId, 
      publisherName: auction.publisherName, // Ensure this is sent
      startTime: auction.start_time, 
      endTime: auction.end_time,
      status: auction.status, 
      minimumBidFloor: auction.minimum_bid_floor, 
      mediaUrl: auction.mediaUrl, 
      
      // New Fields
      width: auction.width,
      height: auction.height,
      category: auction.category,
      description: auction.description,

      totalBids: bids.length,
      allBids: bids.map((bid: RowDataPacket) => ({
        id: bid.id, 
        auctionId: id, 
        advertiserId: bid.advertiser_id, 
        advertiserName: bid.advertiserName, 
        campaignName: bid.campaign_name, 
        campaignId: bid.campaign_id,
        bidAmountCPM: parseFloat(bid.bid_amount), 
        submitTime: bid.created_at, 
        status: bid.status,
        impressions: bid.impressions,
        clicks: bid.clicks
      }))
    });
  } catch (error) { 
    console.error('Auction detail error:', error);
    res.status(500).json({ message: 'Error fetching auction details.' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/auctions', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { ad_space_id, start_time, end_time, minimum_bid_floor } = req.body;
    if (!ad_space_id || !start_time || !end_time) return res.status(400).json({ message: 'Ad Space ID, start time, and end time are required.' });

    connection = await mysql.createConnection(dbConfig);
    const [spaceCheck] = await connection.execute<RowDataPacket[]>('SELECT id FROM ad_spaces WHERE id = ?', [ad_space_id]);
    if (!spaceCheck || spaceCheck.length === 0) return res.status(404).json({ message: 'Ad space not found' });

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return res.status(400).json({ message: 'Invalid date format' });

    const query = `INSERT INTO auctions (ad_space_id, start_time, end_time, minimum_bid_floor, status, created_at) VALUES (?, ?, ?, ?, 'open', NOW())`;
    const [result] = await connection.execute<ResultSetHeader>(query, [ad_space_id, startDate, endDate, minimum_bid_floor || 0]);
    res.status(201).json({ message: 'Auction created successfully.', auctionId: result.insertId });
  } catch (error) { 
    console.error('Auction creation error:', error);
    res.status(500).json({ message: 'Error creating auction' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/auctions/:id/bids', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { id } = req.params;
    const { campaign_id, advertiser_id, bid_amount } = req.body;
    if (!campaign_id || !advertiser_id || !bid_amount) return res.status(400).json({ message: 'Campaign ID, Advertiser ID, and Bid Amount are required.' });

    connection = await mysql.createConnection(dbConfig);
    const auctionQuery = 'SELECT status, minimum_bid_floor, end_time FROM auctions WHERE id = ?';
    const [auctionRows] = await connection.execute<RowDataPacket[]>(auctionQuery, [id]);

    if (auctionRows.length === 0) return res.status(404).json({ message: 'Auction not found.' });
    const auction = auctionRows[0];

    if (auction.status === 'closed') return res.status(400).json({ message: 'Auction is already closed.' });

    const endTime = new Date(auction.end_time);
    if (endTime < new Date()) {
      await connection.execute('UPDATE auctions SET status = ? WHERE id = ?', ['closed', id]);
      return res.status(400).json({ message: 'Auction has expired.' });
    }

    if (bid_amount < auction.minimum_bid_floor) return res.status(400).json({ message: `Bid must be at least ${auction.minimum_bid_floor}.` });

    const bidQuery = `INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())`;
    const [result] = await connection.execute<ResultSetHeader>(bidQuery, [id, campaign_id, advertiser_id, bid_amount]);
    res.status(201).json({ message: 'Bid placed successfully.', bidId: result.insertId });
  } catch (error) { 
    console.error('Bid placement error:', error);
    res.status(500).json({ message: 'Error placing bid.' });
  } finally {
    if (connection) await connection.end();
  }
});

// ==========================================
// 6. TRACKING & METRICS 
// ==========================================

app.post('/api/stats/view/:bidId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { bidId } = req.params; 
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE bids SET impressions = impressions + 1 WHERE id = ?',
      [bidId]
    );
    
    res.status(200).json({ message: 'View counted on Bid' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error counting view' });
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/api/stats/click/:bidId', async (req: Request, res: Response) => {
  let connection: mysql.Connection | undefined;
  try {
    const { bidId } = req.params; 
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE bids SET clicks = clicks + 1 WHERE id = ?',
      [bidId]
    );
    
    res.status(200).json({ message: 'Click counted on Bid' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error counting click' });
  } finally {
    if (connection) await connection.end();
  }
});

app.listen(port, () => { 
  console.log(`🚀 Backend-Server running on http://localhost:${port}`); 
});