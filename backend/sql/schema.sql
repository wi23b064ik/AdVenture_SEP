-- AdVenture: Database schema for bidding system
-- Create the database first (docker-compose already sets myapp)

-- 1) users table (needed for login & roles)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salutation VARCHAR(20),
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  role VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) ad_inventory (publisher ad spaces)
CREATE TABLE IF NOT EXISTS ad_inventory (
  id VARCHAR(64) PRIMARY KEY,
  publisher_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100),
  placement VARCHAR(100),
  dimensions VARCHAR(32),
  estimated_daily_impressions INT DEFAULT 0,
  minimum_bid_floor DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'EUR',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (publisher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) campaigns (advertiser campaigns)
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(64) PRIMARY KEY,
  advertiser_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  budget DECIMAL(12,2) DEFAULT 0.00,
  daily_budget DECIMAL(12,2) DEFAULT 0.00,
  start_date DATE,
  end_date DATE,
  target_categories VARCHAR(255),
  target_countries VARCHAR(255),
  target_devices VARCHAR(255),
  creative_headline VARCHAR(255),
  creative_description TEXT,
  landing_url VARCHAR(512),
  status ENUM('draft','active','paused','completed') DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advertiser_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) auctions (real-time event metadata)
CREATE TABLE IF NOT EXISTS auctions (
  id VARCHAR(64) PRIMARY KEY,
  ad_inventory_id VARCHAR(64) NOT NULL,
  publisher_id INT NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  status ENUM('open','closed','completed') DEFAULT 'open',
  winning_bid_id VARCHAR(64),
  estimated_impressions INT DEFAULT 0,
  total_impressions INT DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_inventory_id) REFERENCES ad_inventory(id) ON DELETE CASCADE,
  FOREIGN KEY (publisher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) bid_submissions (individual bids)
CREATE TABLE IF NOT EXISTS bid_submissions (
  id VARCHAR(64) PRIMARY KEY,
  auction_id VARCHAR(64) NOT NULL,
  advertiser_id INT NOT NULL,
  campaign_id VARCHAR(64) NOT NULL,
  bid_amount_cpm DECIMAL(10,2) NOT NULL,
  submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','accepted','rejected','won','lost') DEFAULT 'pending',
  impressions INT DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0.00,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (advertiser_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ad_inventory_publisher ON ad_inventory(publisher_id);
CREATE INDEX IF NOT EXISTS idx_campaign_advertiser ON campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_bids_auction ON bid_submissions(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_advertiser ON bid_submissions(advertiser_id);

-- Example notes:
-- Use UUIDs for id fields in frontend/backend (we used VARCHAR(64) for flexibility)
-- Import this file into the MySQL container (Adminer or docker exec)
