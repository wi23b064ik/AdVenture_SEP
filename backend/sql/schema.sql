-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS myapp CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE myapp;

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
  created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================
-- AD_SPACES TABLE (for Publishers)
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
-- CAMPAIGNS TABLE (for Advertisers)
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
-- AUCTIONS TABLE (Timed auctions for Ad Spaces)
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
-- BIDS TABLE (Advertisers bidding on Auctions)
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
