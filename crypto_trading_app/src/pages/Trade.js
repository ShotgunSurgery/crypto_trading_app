import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Trade() {
  const [tokens, setTokens] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedToken, setSelectedToken] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      
      // Fetch tokens, wallet, and portfolio in parallel
      const [tokensRes, portfolioRes] = await Promise.all([
        fetch("http://localhost:5000/api/tokens", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("http://localhost:5000/api/trade/portfolio", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      const tokensData = await tokensRes.json();
      const portfolioData = await portfolioRes.json();

      if (!tokensRes.ok || !portfolioRes.ok) {
        if (tokensRes.status === 401 || portfolioRes.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        setError(tokensData.message || portfolioData.message || "Failed to fetch data");
        return;
      }

      setTokens(tokensData.tokens || []);
      setWalletBalance(portfolioData.wallet?.balance || 0);
      setPortfolio(portfolioData.holdings || []);
      setError("");

      // Set first token as default selection
      if (tokensData.tokens && tokensData.tokens.length > 0 && !selectedToken) {
        setSelectedToken(tokensData.tokens[0].token_id.toString());
      }
    } catch (err) {
      setError("Network or server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    
    if (!selectedToken || !quantity || parseFloat(quantity) <= 0) {
      setError("Please select a token and enter a valid quantity");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const res = await fetch("http://localhost:5000/api/trade/buy", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: parseInt(selectedToken),
          quantity: parseFloat(quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Purchase failed");
        return;
      }

      // Refresh data after successful purchase
      await fetchData();
      setQuantity("");
      setError("");
    } catch (err) {
      setError("Network or server error");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    
    if (!selectedToken || !quantity || parseFloat(quantity) <= 0) {
      setError("Please select a token and enter a valid quantity");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const res = await fetch("http://localhost:5000/api/trade/sell", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: parseInt(selectedToken),
          quantity: parseFloat(quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Sale failed");
        return;
      }

      // Refresh data after successful sale
      await fetchData();
      setQuantity("");
      setError("");
    } catch (err) {
      setError("Network or server error");
      console.error(err);
    } finally {
      setProcessing(false);
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

  const getSelectedTokenData = () => {
    return tokens.find(t => t.token_id.toString() === selectedToken);
  };

  const getSelectedTokenHolding = () => {
    return portfolio.find(h => h.tokenId.toString() === selectedToken);
  };

  const calculateCost = () => {
    const token = getSelectedTokenData();
    if (token && quantity) {
      return (parseFloat(token.price) * parseFloat(quantity)).toFixed(4);
    }
    return "0.00";
  };

  if (loading) {
    return (
      <div align="center">
        <p>Loading...</p>
      </div>
    );
  }

  const selectedTokenData = getSelectedTokenData();
  const selectedHolding = getSelectedTokenHolding();

  return (
    <div>
      <div align="center">
        <h2>Trade Tokens</h2>

        <div align="center">
          <p><strong>Wallet Balance:</strong> ${formatPrice(walletBalance)}</p>
        </div>

        <br />

        {error && (
          <div align="center">
            <p role="alert">{error}</p>
          </div>
        )}

        <form onSubmit={handleBuy}>
          <table cellPadding="10" align="center" border="1">
            <tbody>
              <tr>
                <td align="right"><strong>Select Token:</strong></td>
                <td align="left">
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  >
                    {tokens.map((token) => (
                      <option key={token.token_id} value={token.token_id}>
                        {token.symbol} - {token.name} (${formatPrice(token.price)})
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td align="right"><strong>Quantity:</strong></td>
                <td align="left">
                  <input
                    type="number"
                    step="0.00000001"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </td>
              </tr>
              {selectedTokenData && quantity && (
                <tr>
                  <td align="right"><strong>Total Cost:</strong></td>
                  <td align="left">${calculateCost()}</td>
                </tr>
              )}
              {selectedHolding && (
                <tr>
                  <td align="right"><strong>You Own:</strong></td>
                  <td align="left">{parseFloat(selectedHolding.amount).toFixed(8)} {selectedTokenData?.symbol}</td>
                </tr>
              )}
              <tr>
                <td />
                <td align="left">
                  <button
                    type="submit"
                    disabled={processing || !selectedToken || !quantity}
                  >
                    {processing ? "Processing..." : "Buy"}
                  </button>
                  &nbsp;
                  <button
                    type="button"
                    onClick={handleSell}
                    disabled={processing || !selectedToken || !quantity}
                  >
                    {processing ? "Processing..." : "Sell"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>

        <br />
        <br />

        <h3 align="center">Your Holdings</h3>
        {portfolio.length > 0 ? (
          <table cellPadding="10" align="center" border="1" width="80%">
            <thead>
              <tr>
                <th align="center">Token</th>
                <th align="center">Symbol</th>
                <th align="center">Amount</th>
                <th align="center">Current Price</th>
                <th align="center">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((holding) => (
                <tr key={holding.tokenId}>
                  <td align="left">{holding.name}</td>
                  <td align="center"><strong>{holding.symbol}</strong></td>
                  <td align="right">{parseFloat(holding.amount).toFixed(8)}</td>
                  <td align="right">${formatPrice(holding.currentPrice)}</td>
                  <td align="right">${formatPrice(holding.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p align="center">No token holdings</p>
        )}
      </div>
    </div>
  );
}

export default Trade;

