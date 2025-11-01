-- SQL Script to create MySQL trigger for automatic transaction audit logging
-- This trigger automatically logs transactions to audit_log table
-- DBMS Concept: TRIGGER - Executes automatically AFTER INSERT on transactions

DELIMITER $$

CREATE TRIGGER after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    -- Log transaction details to audit_log
    -- Joins with tokens table to get token symbol and name
    DECLARE token_symbol VARCHAR(10);
    DECLARE token_name VARCHAR(50);
    
    SELECT symbol, name INTO token_symbol, token_name 
    FROM tokens 
    WHERE token_id = NEW.token_id;
    
    INSERT INTO audit_log (user_id, message)
    VALUES (
        (SELECT user_id FROM wallets WHERE id = NEW.wallet_id),
        CONCAT(
            'Transaction: ', NEW.type, ' ',
            NEW.quantity, ' ', token_symbol, ' (', token_name, ')',
            ' at price ', NEW.price_at_transaction,
            ' | Total: ', NEW.total_value
        )
    );
END$$

DELIMITER ;

-- Note: This trigger demonstrates automatic logging without application code
-- Ensures all transactions are audited even if application code fails
-- Uses JOIN-like logic to get token details

