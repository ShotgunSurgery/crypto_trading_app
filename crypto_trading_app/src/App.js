import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

function App() {
  return (
    <div align="center">
      <header>
        <Router>
          <nav align="center">
            <Link to="/">Home</Link>&nbsp;&nbsp;&nbsp;
          </nav>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp/>} />
          </Routes>
        </Router>
      </header>
    </div>
  );
}

export default App;
