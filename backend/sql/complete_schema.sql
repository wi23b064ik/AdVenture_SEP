-- ======================================
-- COMPLETE BIDDING SYSTEM SCHEMA + TEST DATA
-- ======================================
-- This file creates all tables and inserts test data
-- Run this ONCE in Adminer to set up everything

USE myapp;

-- ===============================
-- DROP EXISTING TABLES (if any)
-- ===============================
DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS auctions;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS ad_spaces;
DROP TABLE IF EXISTS users;

-- ===============================
-- USERS TABLE
-- ===============================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  salutation ENUM('Herr', 'Frau', 'Divers'),
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  username VARCHAR(50),
  email VARCHAR(255),
  password VARCHAR(255),
  date_of_birth DATE,
  role ENUM('Publisher','Advertiser','Admin'),
  created_at DATETIME,
  INDEX (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================
-- AD_SPACES TABLE
-- ===============================
CREATE TABLE ad_spaces (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  publisher_id INT UNSIGNED,
  name VARCHAR(255),
  width INT,
  height INT,
  created_at DATETIME,
  category VARCHAR(100),
  min_bid DECIMAL(10,2) DEFAULT 0.00,
  description TEXT NULL,
  media_url VARCHAR(512),
  INDEX (publisher_id),
  CONSTRAINT fk_adspaces_publisher FOREIGN KEY (publisher_id)
      REFERENCES users(id)
      ON DELETE CASCADE
      ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================
-- CAMPAIGNS TABLE
-- ===============================
CREATE TABLE campaigns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  advertiser_id INT UNSIGNED,
  campaign_name VARCHAR(255),
  total_budget DECIMAL(10,2),
  daily_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  target_category VARCHAR(100),
  target_country VARCHAR(100),
  target_device VARCHAR(50),
  creative_headline VARCHAR(255),
  creative_description TEXT,
  landing_url VARCHAR(2048),
  status ENUM('active','paused','ended') DEFAULT 'active',
  created_at DATETIME,
  INDEX (advertiser_id),
  CONSTRAINT fk_campaigns_advertiser FOREIGN KEY (advertiser_id)
      REFERENCES users(id)
      ON DELETE CASCADE
      ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================
-- AUCTIONS TABLE
-- ===============================
CREATE TABLE auctions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ad_space_id INT UNSIGNED,
  start_time DATETIME,
  end_time DATETIME,
  status ENUM('open','closed','ended') DEFAULT 'open',
  minimum_bid_floor DECIMAL(10,2) DEFAULT 0.00,
  winning_bid_id INT UNSIGNED NULL,
  created_at DATETIME,
  INDEX (ad_space_id),
  INDEX (status),
  UNIQUE KEY (ad_space_id, start_time),
  CONSTRAINT fk_auctions_adspace FOREIGN KEY (ad_space_id)
      REFERENCES ad_spaces(id)
      ON DELETE CASCADE
      ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================
-- BIDS TABLE
-- ===============================
CREATE TABLE bids (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  auction_id INT UNSIGNED,
  campaign_id INT UNSIGNED,
  advertiser_id INT UNSIGNED,
  bid_amount DECIMAL(10,2),
  created_at DATETIME,
  status ENUM('pending','accepted','won','lost') DEFAULT 'pending',
  INDEX (auction_id),
  INDEX (campaign_id),
  INDEX (advertiser_id),
  CONSTRAINT fk_bids_auction FOREIGN KEY (auction_id)
      REFERENCES auctions(id)
      ON DELETE CASCADE
      ON UPDATE RESTRICT,
  CONSTRAINT fk_bids_campaign FOREIGN KEY (campaign_id)
      REFERENCES campaigns(id)
      ON DELETE CASCADE
      ON UPDATE RESTRICT,
  CONSTRAINT fk_bids_advertiser FOREIGN KEY (advertiser_id)
      REFERENCES users(id)
      ON DELETE CASCADE
      ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================
-- INSERT TEST USERS
-- ===============================
INSERT INTO users (salutation, firstname, lastname, username, email, password, date_of_birth, role, created_at)
VALUES ('Herr', 'Max', 'Publisher', 'max_pub', 'max@publisher.com', '$2b$10$abc123', '1980-05-15', 'Publisher', NOW());

INSERT INTO users (salutation, firstname, lastname, username, email, password, date_of_birth, role, created_at)
VALUES ('Herr', 'John', 'Advertiser', 'john_adv', 'john@advertiser.com', '$2b$10$abc123', '1990-03-20', 'Advertiser', NOW());

INSERT INTO users (salutation, firstname, lastname, username, email, password, date_of_birth, role, created_at)
VALUES ('Frau', 'Sarah', 'Bidder', 'sarah_bid', 'sarah@advertiser.com', '$2b$10$abc123', '1992-07-10', 'Advertiser', NOW());

-- ===============================
-- INSERT AD SPACES
-- ===============================
INSERT INTO ad_spaces (publisher_id, name, width, height, created_at, category, min_bid, description, media_url)
VALUES (1, 'Homepage Banner', 728, 90, NOW(), 'Technology', 0.50, 'Premium banner ad on homepage', '/uploads/banner1.jpg');

INSERT INTO ad_spaces (publisher_id, name, width, height, created_at, category, min_bid, description, media_url)
VALUES (1, 'Sidebar Ad (300x250)', 300, 250, NOW(), 'Technology', 1.00, 'Medium rectangle on sidebar', '/uploads/sidebar1.jpg');

INSERT INTO ad_spaces (publisher_id, name, width, height, created_at, category, min_bid, description, media_url)
VALUES (1, 'Footer Leaderboard', 970, 90, NOW(), 'Technology', 0.75, 'Large leaderboard in footer', '/uploads/footer1.jpg');

-- ===============================
-- INSERT CAMPAIGNS
-- ===============================
INSERT INTO campaigns (advertiser_id, campaign_name, total_budget, daily_budget, start_date, end_date, target_category, target_country, target_device, creative_headline, creative_description, landing_url, status, created_at)
VALUES (2, 'Spring Launch 2025', 5000.00, 100.00, '2025-03-01', '2025-03-31', 'Technology', 'Germany', 'Desktop', 'New Product Launch', 'Check out our amazing new tech product!', 'https://example.com/spring', 'active', NOW());

INSERT INTO campaigns (advertiser_id, campaign_name, total_budget, daily_budget, start_date, end_date, target_category, target_country, target_device, creative_headline, creative_description, landing_url, status, created_at)
VALUES (3, 'Summer Sale 2025', 3000.00, 75.00, '2025-06-01', '2025-08-31', 'Technology', 'Germany', 'Mobile', 'Huge Summer Discounts', 'Save up to 50% this summer!', 'https://example.com/summer', 'active', NOW());

INSERT INTO campaigns (advertiser_id, campaign_name, total_budget, daily_budget, start_date, end_date, target_category, target_country, target_device, creative_headline, creative_description, landing_url, status, created_at)
VALUES (2, 'Holiday Mega Deal', 8000.00, 150.00, '2025-11-01', '2025-12-31', 'Technology', 'Germany', 'Desktop', 'Holiday Special Offer', 'Best deals for the holiday season!', 'https://example.com/holiday', 'active', NOW());

-- ===============================
-- INSERT AUCTIONS
-- ===============================
INSERT INTO auctions (ad_space_id, start_time, end_time, status, minimum_bid_floor, created_at)
VALUES (1, NOW(), DATE_ADD(NOW(), INTERVAL 60 SECOND), 'open', 0.50, NOW());

INSERT INTO auctions (ad_space_id, start_time, end_time, status, minimum_bid_floor, created_at)
VALUES (2, NOW(), DATE_ADD(NOW(), INTERVAL 90 SECOND), 'open', 1.00, NOW());

INSERT INTO auctions (ad_space_id, start_time, end_time, status, minimum_bid_floor, created_at)
VALUES (3, DATE_SUB(NOW(), INTERVAL 30 SECOND), DATE_SUB(NOW(), INTERVAL 5 SECOND), 'closed', 0.75, NOW());

-- ===============================
-- INSERT BIDS
-- ===============================
-- Bids for Auction 1
INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at)
VALUES (1, 1, 2, 1.50, 'accepted', NOW());

INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at)
VALUES (1, 2, 3, 2.25, 'accepted', NOW());

INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at)
VALUES (1, 3, 2, 1.75, 'accepted', NOW());

-- Bids for Auction 2
INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at)
VALUES (2, 1, 2, 2.00, 'accepted', NOW());

INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at)
VALUES (2, 2, 3, 3.50, 'accepted', NOW());

-- Bids for Auction 3 (closed)
INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at)
VALUES (3, 1, 2, 2.00, 'won', DATE_SUB(NOW(), INTERVAL 20 SECOND));

INSERT INTO bids (auction_id, campaign_id, advertiser_id, bid_amount, status, created_at)
VALUES (3, 2, 3, 1.50, 'lost', DATE_SUB(NOW(), INTERVAL 15 SECOND));

-- ===============================
-- VERIFICATION
-- ===============================
SELECT '✅ TABLES CREATED AND DATA LOADED' as status;
SELECT CONCAT('Users: ', COUNT(*)) as info FROM users;
SELECT CONCAT('Ad Spaces: ', COUNT(*)) as info FROM ad_spaces;
SELECT CONCAT('Campaigns: ', COUNT(*)) as info FROM campaigns;
SELECT CONCAT('Auctions: ', COUNT(*)) as info FROM auctions;
SELECT CONCAT('Bids: ', COUNT(*)) as info FROM bids;
