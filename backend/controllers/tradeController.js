import { createConnection } from "../config/db.js";

const db = createConnection();

/**
 * POST /api/trade/buy
 * Handles token purchase transactions
 * 
 * DBMS Concepts Applied:
 * 1. Transactions (ACID Properties):
 *    - Atomicity: All operations succeed or all fail (BEGIN/COMMIT/ROLLBACK)
 *    - Consistency: Balance and holdings always consistent
 *    - Isolation: Concurrent buys don't interfere (SELECT ... FOR UPDATE)
 *    - Durability: Committed transactions persist
 * 
 * 2. Concurrency Control:
 *    - SELECT ... FOR UPDATE locks wallet and token balance rows
 *    - Prevents race conditions when multiple users trade simultaneously
 *    - Ensures balance calculations are accurate
 * 
 * 3. Normalization:
 *    - Separate tables: wallets (balance), tokens (price), wallet_token_balances (holdings)
 *    - Foreign keys maintain referential integrity
 */
export const buyToken = async (req, res) => {
  const { tokenId, quantity } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!tokenId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid token ID or quantity" });
  }

  const connection = db.promise();

  try {
    // Start Transaction - Ensures ACID properties
    await connection.query("START TRANSACTION");

    // Step 1: Lock and fetch wallet balance
    // SELECT ... FOR UPDATE locks the row for this transaction
    // Concurrency Control: Prevents other transactions from modifying this wallet
    const [wallets] = await connection.query(
      "SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE",
      [userId]
    );

    if (wallets.length === 0) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ message: "Wallet not found" });
    }

    const wallet = wallets[0];
    const walletId = wallet.id;
    const currentBalance = parseFloat(wallet.balance);

    // Step 2: Fetch token price with lock (for consistency)
    const [tokens] = await connection.query(
      "SELECT token_id, symbol, name, price FROM tokens WHERE token_id = ? FOR UPDATE",
      [tokenId]
    );

    if (tokens.length === 0) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ message: "Token not found" });
    }

    const token = tokens[0];
    const tokenPrice = parseFloat(token.price);
    const totalCost = tokenPrice * parseFloat(quantity);

    // Step 3: Check sufficient balance
    if (currentBalance < totalCost) {
      await connection.query("ROLLBACK");
      return res.status(400).json({ 
        message: "Insufficient funds",
        required: totalCost,
        available: currentBalance
      });
    }

    // Step 4: Deduct balance from wallet
    // Atomicity: If this fails, entire transaction rolls back
    const newBalance = currentBalance - totalCost;
    await connection.query(
      "UPDATE wallets SET balance = ? WHERE id = ?",
      [newBalance.toFixed(8), walletId]
    );

    // Step 5: Update or insert token balance
    // Check if user already holds this token
    const [existingHoldings] = await connection.query(
      "SELECT id, amount FROM wallet_token_balances WHERE wallet_id = ? AND token_id = ? FOR UPDATE",
      [walletId, tokenId]
    );

    if (existingHoldings.length > 0) {
      // Update existing holding
      const currentAmount = parseFloat(existingHoldings[0].amount);
      const newAmount = currentAmount + parseFloat(quantity);
      await connection.query(
        "UPDATE wallet_token_balances SET amount = ? WHERE id = ?",
        [newAmount.toFixed(8), existingHoldings[0].id]
      );
    } else {
      // Insert new holding
      // Normalization: Separate table for token holdings avoids redundancy
      await connection.query(
        "INSERT INTO wallet_token_balances (wallet_id, token_id, amount) VALUES (?, ?, ?)",
        [walletId, tokenId, parseFloat(quantity).toFixed(8)]
      );
    }

    // Step 6: Record transaction
    // Foreign Key: wallet_id references wallets(id), token_id references tokens(token_id)
    await connection.query(
      "INSERT INTO transactions (wallet_id, token_id, type, quantity, price_at_transaction) VALUES (?, ?, 'BUY', ?, ?)",
      [walletId, tokenId, parseFloat(quantity).toFixed(8), tokenPrice.toFixed(4)]
    );

    // Commit transaction - Makes all changes permanent
    // Durability: Changes are written to disk
    await connection.query("COMMIT");

    // Fetch updated wallet and holdings
    const [updatedWallet] = await connection.query(
      "SELECT balance FROM wallets WHERE id = ?",
      [walletId]
    );

    const [updatedHoldings] = await connection.query(
      "SELECT amount FROM wallet_token_balances WHERE wallet_id = ? AND token_id = ?",
      [walletId, tokenId]
    );

    res.status(200).json({
      message: "Token purchase successful",
      wallet: {
        balance: parseFloat(updatedWallet[0].balance),
      },
      holding: updatedHoldings.length > 0 ? {
        amount: parseFloat(updatedHoldings[0].amount),
      } : null,
      transaction: {
        token: token.symbol,
        quantity: parseFloat(quantity),
        price: tokenPrice,
        totalCost: totalCost,
      },
    });
  } catch (err) {
    // Rollback on any error - Ensures atomicity
    // Error Handling: Restores database to consistent state before transaction
    try {
      await connection.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }

    console.error("Buy token error:", err);
    res.status(500).json({ message: "Server error during purchase" });
  }
};

/**
 * POST /api/trade/sell
 * Handles token sale transactions
 * 
 * Same DBMS concepts as buyToken:
 * - Transactions (ACID)
 * - Concurrency Control (SELECT ... FOR UPDATE)
 * - Normalization and Foreign Keys
 */
export const sellToken = async (req, res) => {
  const { tokenId, quantity } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!tokenId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid token ID or quantity" });
  }

  const connection = db.promise();

  try {
    // Start Transaction
    await connection.query("START TRANSACTION");

    // Step 1: Lock and fetch wallet
    const [wallets] = await connection.query(
      "SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE",
      [userId]
    );

    if (wallets.length === 0) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ message: "Wallet not found" });
    }

    const wallet = wallets[0];
    const walletId = wallet.id;
    const currentBalance = parseFloat(wallet.balance);

    // Step 2: Fetch token price
    const [tokens] = await connection.query(
      "SELECT token_id, symbol, name, price FROM tokens WHERE token_id = ? FOR UPDATE",
      [tokenId]
    );

    if (tokens.length === 0) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ message: "Token not found" });
    }

    const token = tokens[0];
    const tokenPrice = parseFloat(token.price);

    // Step 3: Check if user has enough tokens to sell
    const [holdings] = await connection.query(
      "SELECT id, amount FROM wallet_token_balances WHERE wallet_id = ? AND token_id = ? FOR UPDATE",
      [walletId, tokenId]
    );

    if (holdings.length === 0) {
      await connection.query("ROLLBACK");
      return res.status(400).json({ message: "You don't own this token" });
    }

    const currentAmount = parseFloat(holdings[0].amount);
    const sellQuantity = parseFloat(quantity);

    if (currentAmount < sellQuantity) {
      await connection.query("ROLLBACK");
      return res.status(400).json({
        message: "Insufficient tokens",
        available: currentAmount,
        requested: sellQuantity,
      });
    }

    // Step 4: Calculate proceeds
    const proceeds = tokenPrice * sellQuantity;
    const newBalance = currentBalance + proceeds;
    const newAmount = currentAmount - sellQuantity;

    // Step 5: Update wallet balance
    await connection.query(
      "UPDATE wallets SET balance = ? WHERE id = ?",
      [newBalance.toFixed(8), walletId]
    );

    // Step 6: Update token holdings
    if (newAmount > 0) {
      await connection.query(
        "UPDATE wallet_token_balances SET amount = ? WHERE id = ?",
        [newAmount.toFixed(8), holdings[0].id]
      );
    } else {
      // Remove holding if amount becomes zero
      await connection.query(
        "DELETE FROM wallet_token_balances WHERE id = ?",
        [holdings[0].id]
      );
    }

    // Step 7: Record transaction
    await connection.query(
      "INSERT INTO transactions (wallet_id, token_id, type, quantity, price_at_transaction) VALUES (?, ?, 'SELL', ?, ?)",
      [walletId, tokenId, sellQuantity.toFixed(8), tokenPrice.toFixed(4)]
    );

    // Commit transaction
    await connection.query("COMMIT");

    // Fetch updated data
    const [updatedWallet] = await connection.query(
      "SELECT balance FROM wallets WHERE id = ?",
      [walletId]
    );

    const [updatedHoldings] = await connection.query(
      "SELECT amount FROM wallet_token_balances WHERE wallet_id = ? AND token_id = ?",
      [walletId, tokenId]
    );

    res.status(200).json({
      message: "Token sale successful",
      wallet: {
        balance: parseFloat(updatedWallet[0].balance),
      },
      holding: updatedHoldings.length > 0 ? {
        amount: parseFloat(updatedHoldings[0].amount),
      } : null,
      transaction: {
        token: token.symbol,
        quantity: sellQuantity,
        price: tokenPrice,
        proceeds: proceeds,
      },
    });
  } catch (err) {
    // Rollback on error
    try {
      await connection.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }

    console.error("Sell token error:", err);
    res.status(500).json({ message: "Server error during sale" });
  }
};

/**
 * GET /api/trade/portfolio
 * Fetches user's portfolio with JOIN queries
 * Demonstrates: JOIN operations, data aggregation
 */
export const getPortfolio = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get wallet
    const [wallets] = await db
      .promise()
      .query("SELECT id, balance FROM wallets WHERE user_id = ?", [userId]);

    if (wallets.length === 0) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const walletId = wallets[0].id;

    // JOIN query: Combines wallets, wallet_token_balances, and tokens
    // Normalization: Uses foreign keys to join normalized tables
    const [holdings] = await db
      .promise()
      .query(
        `SELECT 
          wtb.token_id,
          t.symbol,
          t.name,
          t.price AS current_price,
          wtb.amount,
          (wtb.amount * t.price) AS total_value
        FROM wallet_token_balances wtb
        INNER JOIN tokens t ON wtb.token_id = t.token_id
        WHERE wtb.wallet_id = ?
        ORDER BY total_value DESC`,
        [walletId]
      );

    res.status(200).json({
      message: "Portfolio retrieved successfully",
      wallet: {
        balance: parseFloat(wallets[0].balance),
      },
      holdings: holdings.map((h) => ({
        tokenId: h.token_id,
        symbol: h.symbol,
        name: h.name,
        amount: parseFloat(h.amount),
        currentPrice: parseFloat(h.current_price),
        totalValue: parseFloat(h.total_value),
      })),
    });
  } catch (err) {
    console.error("Get portfolio error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

