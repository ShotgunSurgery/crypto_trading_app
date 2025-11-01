import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/wallet", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        setError(data.message || "Failed to fetch wallet");
        return;
      }

      if (data.wallet) {
        setWallet(data.wallet);
        setTokenBalances(data.tokenBalances || []);
      }
      setError("");
    } catch (err) {
      setError("Network or server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setCreating(true);
      setError("");
      const res = await fetch("http://localhost:5000/api/wallet", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        setError(data.message || "Failed to create wallet");
        return;
      }

      setWallet(data.wallet);
      setTokenBalances([]);
      setError("");
    } catch (err) {
      setError("Network or server error");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div align="center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div align="right">
        {!wallet && (
          <button 
            onClick={handleCreateWallet} 
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Wallet"}
          </button>
        )}
      </div>

      <br />

      {error && (
        <div align="center">
          <p role="alert">{error}</p>
        </div>
      )}

      {wallet ? (
        <div align="center">
          <h2>Wallet Details</h2>
          
          <table cellPadding="10" align="center" border="1">
            <tbody>
              <tr>
                <td align="right"><strong>Address:</strong></td>
                <td align="left">{wallet.address}</td>
              </tr>
              <tr>
                <td align="right"><strong>Balance:</strong></td>
                <td align="left">{parseFloat(wallet.balance).toFixed(8)} ETH</td>
              </tr>
              <tr>
                <td align="right"><strong>Created At:</strong></td>
                <td align="left">{new Date(wallet.created_at).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <br />
          <br />

          <h3 align="center">Token Balances</h3>
          
          {tokenBalances.length > 0 ? (
            <table cellPadding="10" align="center" border="1">
              <thead>
                <tr>
                  <th align="center">Token</th>
                  <th align="center">Symbol</th>
                  <th align="center">Amount</th>
                </tr>
              </thead>
              <tbody>
                {tokenBalances.map((tokenBalance) => (
                  <tr key={tokenBalance.id}>
                    <td align="left">{tokenBalance.name || "N/A"}</td>
                    <td align="center">{tokenBalance.symbol || "N/A"}</td>
                    <td align="right">{parseFloat(tokenBalance.amount).toFixed(8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p align="center">No token balances found</p>
          )}
        </div>
      ) : (
        <div align="center">
          <p>No wallet found. Click "Create Wallet" to create one.</p>
        </div>
      )}
    </div>
  );
}

export default Wallet;
