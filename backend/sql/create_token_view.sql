-- SQL Script to create token_summary view
-- This view demonstrates normalization and data aggregation
-- Joins tokens table with wallet_token_balances to show collective holdings

-- View: token_summary
-- Purpose: Aggregate token data with wallet holdings
-- DBMS Concept: VIEW - Provides a virtual table based on SQL query results
CREATE OR REPLACE VIEW token_summary AS
SELECT 
    t.token_id,
    t.symbol,
    t.name,
    t.price,
    COALESCE(SUM(wtb.amount), 0) AS total_holdings,
    COUNT(DISTINCT wtb.wallet_id) AS number_of_wallets
FROM tokens t
LEFT JOIN wallet_token_balances wtb ON t.token_id = wtb.token_id
GROUP BY t.token_id, t.symbol, t.name, t.price;

-- Note: In MySQL, use CREATE VIEW instead of CREATE OR REPLACE VIEW
-- If view exists, drop it first:
-- DROP VIEW IF EXISTS token_summary;
-- Then create:
-- CREATE VIEW token_summary AS ...

