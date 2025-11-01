import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/transactions", {
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
        setError(data.message || "Failed to fetch transactions");
        return;
      }

      setTransactions(data.transactions || []);
      setError("");
    } catch (err) {
      setError("Network or server error");
      console.error(err);
    } finally {
      setLoading(false);
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

  const formatQuantity = (quantity) => {
    return parseFloat(quantity).toFixed(8);
  };

  if (loading) {
    return (
      <div align="center">
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div>
      <div align="center">
        <h2>Transaction History</h2>

        {error && (
          <div align="center">
            <p role="alert">{error}</p>
          </div>
        )}

        {transactions.length === 0 ? (
          <div align="center">
            <p>No transactions yet</p>
          </div>
        ) : (
          <table cellPadding="10" align="center" border="1" width="90%">
            <thead>
              <tr>
                <th align="center">Token Name</th>
                <th align="center">Type</th>
                <th align="center">Quantity</th>
                <th align="center">Price per Token</th>
                <th align="center">Total Value</th>
                <th align="center">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.transaction_id}>
                  <td align="left">
                    <strong>{tx.token_symbol}</strong> - {tx.token_name}
                  </td>
                  <td align="center">
                    {tx.transaction_type === "Buy" ? (
                      <strong>Buy</strong>
                    ) : (
                      <strong>Sell</strong>
                    )}
                  </td>
                  <td align="right">{formatQuantity(tx.quantity)}</td>
                  <td align="right">${formatPrice(tx.price_per_token)}</td>
                  <td align="right">${formatPrice(tx.total_value)}</td>
                  <td align="center">{formatDate(tx.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;

