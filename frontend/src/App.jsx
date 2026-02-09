import React, { useEffect, useState } from "react";
import "./App.css";
import Nav from "./components/nav/Nav.jsx";
import Analytics from "./pages/Analytics";
import History from "./pages/History.jsx";
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import Camera from "./pages/Camera.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import toast from "react-hot-toast"

function App() {
  //Track authenticated user
  const [user, setUser] = useState(null);
  //Prevents rendering before auth state is resolved
  const [authReady, setAuthReady] = useState(false);
  //Subscribe to backend analysis events
  //Enable real-time notifications when processing is done
  useEffect(() => {
    if (!user) return;

    const es = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/api/analysis-events/${user.uid}`
    );

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "analysis_complete") {
        toast.success(`"${data.title}" is ready 🎉`);
      }
    };
    //CLose connection on an error
    es.onerror = () => {
      es.close();
    };
    // Cleanup on user change
    return () => {
      es.close();
    };
  }, [user]);
  //Centralized authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);
  //Avoid rendering app before auth resolves
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
          <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/SignIn" replace />} />
          <Route path="/History" element={user ? <History /> : <Navigate to="/SignIn" replace />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
