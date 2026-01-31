import React, { useEffect, useState } from "react";
import "./App.css";
import Nav from "./components/nav/Nav.jsx";

import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import Camera from "./pages/Camera.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Optional: avoid rendering routes before Firebase auth initializes
  if (!authReady) return null;

  return (
    <div id="navBar">
      <Router>
        <Nav />
        <Routes>
          {/* Root goes to Home if logged in, otherwise SignIn */}
          <Route path="/" element={<Navigate to={user ? "/Home" : "/SignIn"} replace />} />

          <Route path="/SignIn" element={<SignIn />} />

          {/* Protect these routes */}
          <Route path="/Home" element={user ? <Home /> : <Navigate to="/SignIn" replace />} />
          <Route path="/Camera" element={user ? <Camera /> : <Navigate to="/SignIn" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
