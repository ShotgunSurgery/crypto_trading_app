import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Tokens() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/tokens", {
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
        setError(data.message || "Failed to fetch tokens");
        return;
      }

      setTokens(data.tokens || []);
      setError("");
    } catch (err) {
      setError("Network or server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setRefreshing(true);
    setError("");

    // Update prices for all tokens sequentially
    try {
      for (const tokenItem of tokens) {
        try {
          const res = await fetch(
            `http://localhost:5000/api/tokens/update-price/${tokenItem.token_id}`,
            {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!res.ok) {
            const data = await res.json();
            console.error(`Failed to update ${tokenItem.symbol}:`, data.message);
          }
        } catch (err) {
          console.error(`Error updating ${tokenItem.symbol}:`, err);
        }
      }

      // Refresh the token list after all updates
      await fetchTokens();
    } catch (err) {
      setError("Error refreshing prices");
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    if (numPrice >= 1) {
      return numPrice.toFixed(2);
    } else {
      return numPrice.toFixed(6);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div align="center">
        <p>Loading tokens...</p>
      </div>
    );
  }

  return (
    <div>
      <div align="center">
        <h2>Token Management</h2>

        <div align="right">
          <button 
            onClick={handleRefreshPrices} 
            disabled={refreshing || tokens.length === 0}
          >
            {refreshing ? "Refreshing..." : "Refresh Prices"}
          </button>
        </div>

        <br />

        {error && (
          <div align="center">
            <p role="alert">{error}</p>
          </div>
        )}

        {tokens.length > 0 ? (
          <table cellPadding="10" align="center" border="1" width="80%">
            <thead>
              <tr>
                <th align="center">Symbol</th>
                <th align="center">Name</th>
                <th align="center">Current Price</th>
                <th align="center">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.token_id}>
                  <td align="center"><strong>{token.symbol}</strong></td>
                  <td align="left">{token.name}</td>
                  <td align="right">${formatPrice(token.price)}</td>
                  <td align="center">{formatDate(token.last_updated || token.updated_at || token.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div align="center">
            <p>No tokens found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tokens;

