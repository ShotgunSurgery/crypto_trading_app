import { createConnection } from "../config/db.js";
import crypto from "crypto";

const db = createConnection();

const generateWalletAddress = () => {
  return "0x" + crypto.randomBytes(20).toString("hex");
};

// Get wallet details for the authenticated user
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const [wallets] = await db
      .promise()
      .query("SELECT * FROM wallets WHERE user_id = ?", [userId]);

    if (wallets.length === 0) {
      return res.status(200).json({ 
        message: "No wallet found",
        wallet: null,
        tokenBalances: []
      });
    }

    const wallet = wallets[0];

    // Get token balances for this wallet
    let tokenBalances = [];
    try {
      const [balances] = await db
        .promise()
        .query(
          `SELECT wtb.*, t.symbol, t.name 
           FROM wallet_token_balances wtb
           LEFT JOIN tokens t ON wtb.token_id = t.id
           WHERE wtb.wallet_id = ?`,
          [wallet.id]
        );
      tokenBalances = balances;
    } catch (tokenErr) {
      // If tokens table doesn't exist or query fails, just get token balances without token info
      try {
        const [balances] = await db
          .promise()
          .query(
            "SELECT * FROM wallet_token_balances WHERE wallet_id = ?",
            [wallet.id]
          );
        tokenBalances = balances;
      } catch (err) {
        // If wallet_token_balances table also doesn't exist, just return empty array
        console.log("Token balances query failed:", err.message);
      }
    }

    res.status(200).json({
      message: "Wallet retrieved successfully",
      wallet: {
        id: wallet.id,
        address: wallet.address,
        balance: wallet.balance,
        created_at: wallet.created_at,
      },
      tokenBalances: tokenBalances,
    });
  } catch (err) {
    console.error("Get wallet error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new wallet for the authenticated user
export const createWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has a wallet
    const [existing] = await db
      .promise()
      .query("SELECT * FROM wallets WHERE user_id = ?", [userId]);

    if (existing.length > 0) {
      return res.status(400).json({ message: "Wallet already exists for this user" });
    }

    // Generate unique wallet address
    let address = generateWalletAddress();
    let isUnique = false;

    // Ensure address is unique
    while (!isUnique) {
      const [existingAddress] = await db
        .promise()
        .query("SELECT * FROM wallets WHERE address = ?", [address]);

      if (existingAddress.length === 0) {
        isUnique = true;
      } else {
        address = generateWalletAddress();
      }
    }

    // Create wallet
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO wallets (user_id, address, balance) VALUES (?, ?, ?)",
        [userId, address, "0.00000000"]
      );

    const walletId = result.insertId;

    // Get the created wallet
    const [newWallet] = await db
      .promise()
      .query("SELECT * FROM wallets WHERE id = ?", [walletId]);

    res.status(201).json({
      message: "Wallet created successfully",
      wallet: {
        id: newWallet[0].id,
        address: newWallet[0].address,
        balance: newWallet[0].balance,
        created_at: newWallet[0].created_at,
      },
    });
  } catch (err) {
    console.error("Create wallet error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

