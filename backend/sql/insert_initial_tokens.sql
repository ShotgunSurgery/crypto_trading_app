-- SQL Script to insert initial hardcoded tokens
-- These tokens are visible to all users (no admin features required)
-- DBMS Concept: INSERT with constraints (UNIQUE symbol, NOT NULL fields)

INSERT INTO tokens (symbol, name, price) VALUES
('BTC', 'Bitcoin', 45000.0000),
('ETH', 'Ethereum', 2800.0000),
('DOGE', 'Dogecoin', 0.0800)
ON DUPLICATE KEY UPDATE symbol = symbol; -- Prevents errors if tokens already exist

-- Constraints demonstrated:
-- 1. UNIQUE constraint on symbol ensures no duplicate tokens
-- 2. NOT NULL on name, symbol, price ensures data integrity
-- 3. PRIMARY KEY on token_id auto-increments

