-- SQL Script to create transactions table
-- This table stores all buy/sell transactions
-- DBMS Concepts: Primary Key, Foreign Keys, Generated Columns, Constraints

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    token_id INT NOT NULL,
    type ENUM('BUY', 'SELL') NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    price_at_transaction DECIMAL(18,4) NOT NULL,
    total_value DECIMAL(18,4) GENERATED ALWAYS AS (quantity * price_at_transaction) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (token_id) REFERENCES tokens(token_id) ON DELETE CASCADE,
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_token_id (token_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Normalization: Separate transactions table eliminates redundancy
-- Foreign Keys ensure referential integrity
-- Generated column total_value automatically calculates quantity * price

