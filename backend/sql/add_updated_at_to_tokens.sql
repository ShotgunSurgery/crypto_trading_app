-- SQL Script to add updated_at timestamp to tokens table
-- This allows tracking when token prices were last updated
-- DBMS Concept: ALTER TABLE - Modifying table structure

ALTER TABLE tokens 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
AFTER created_at;

-- Note: This adds automatic timestamp updates whenever a row is updated
-- The ON UPDATE CURRENT_TIMESTAMP ensures updated_at is refreshed on each UPDATE

