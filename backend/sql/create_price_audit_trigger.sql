-- SQL Script to create MySQL trigger for automatic price audit logging
-- This trigger automatically logs price changes when tokens.price is updated
-- DBMS Concept: TRIGGER - Executes automatically before/after INSERT, UPDATE, DELETE

-- First, create a dedicated table for price audit (optional but recommended)
-- This provides better normalization than using generic audit_log
CREATE TABLE IF NOT EXISTS price_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_id INT NOT NULL,
    old_price DECIMAL(18,4) NOT NULL,
    new_price DECIMAL(18,4) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_id) REFERENCES tokens(token_id) ON DELETE CASCADE,
    INDEX idx_token_id (token_id),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB;

-- Create trigger that fires BEFORE UPDATE on tokens table
-- Trigger ensures atomic logging of price changes
DELIMITER $$

CREATE TRIGGER before_token_price_update
BEFORE UPDATE ON tokens
FOR EACH ROW
BEGIN
    -- Only log if price actually changed
    IF OLD.price != NEW.price THEN
        INSERT INTO price_audit_log (token_id, old_price, new_price)
        VALUES (OLD.token_id, OLD.price, NEW.price);
    END IF;
END$$

DELIMITER ;

-- Alternative: If using the existing audit_log table instead
-- The trigger would insert a formatted message:
/*
DELIMITER $$

CREATE TRIGGER before_token_price_update_audit
BEFORE UPDATE ON tokens
FOR EACH ROW
BEGIN
    IF OLD.price != NEW.price THEN
        INSERT INTO audit_log (user_id, message)
        VALUES (
            NULL, -- user_id would need to be passed via session variable
            CONCAT(
                'Token ', OLD.symbol, ' (', OLD.name, '): ',
                'Price updated from ', OLD.price, ' to ', NEW.price
            )
        );
    END IF;
END$$

DELIMITER ;
*/

