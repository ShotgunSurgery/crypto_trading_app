import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Wallet from "./pages/Wallet";
import Tokens from "./pages/Tokens";
import Trade from "./pages/Trade";
import TransactionHistory from "./pages/TransactionHistory";

function App() {
  return (
    <div align="center">
      <header>
        <Router>
          <nav align="center">
            <Link to="/">Home</Link>&nbsp;&nbsp;&nbsp;
            <Link to="/wallet">Wallet</Link>&nbsp;&nbsp;&nbsp;
            <Link to="/tokens">Tokens</Link>&nbsp;&nbsp;&nbsp;
            <Link to="/trade">Trade</Link>&nbsp;&nbsp;&nbsp;
            <Link to="/transactions">History</Link>&nbsp;&nbsp;&nbsp;
          </nav>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/transactions" element={<TransactionHistory />} />
          </Routes>
        </Router>
      </header>
    </div>
  );
}

export default App;
