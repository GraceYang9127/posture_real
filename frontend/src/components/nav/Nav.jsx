import React, { useEffect, useState } from "react";
import styles from "./Nav.module.css";
import postureLogo from "../../assets/images/postureLogo.png";
import { Link, useLocation } from "react-router-dom";
import Dropdown from "../Dropdown.jsx";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import SetAsDefault from "../SetAsDefault.jsx";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const Nav = () => {

  //Holds Authenticated Firebase user (null if signed out)
  const [user, setUser] = useState(null);
  // Stores user's preferred instrument (in Firestore)
  const [selectedInstrument, setSelectedInstrument] = useState("Select Instrument");
  // Determines which route is currently active
  const location = useLocation();

  useEffect(() => {

    //Subscribe to authentication state changes, keeps UI synchronized with login/logout
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        //Load user-specific preferences from firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          //Restore last-used instrument across sessions
          if (data.instrument) setSelectedInstrument(data.instrument);
        }
      } else {
        //Reset UI when user logs out
        setSelectedInstrument("Select Instrument");
      }
    });
    //Cleanup listener on component enmount
    return () => unsubscribe();
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.navbar}>
      {/* LEFT: Logo */}
      <div className={styles.logoContainer}>
        <img src={postureLogo} alt="Musalytic Logo" />
      </div>

      {/* CENTER: Instrument selector */}
      {user && (
        <div className={styles.instrumentWrapper}>
          <Dropdown
            selected={selectedInstrument}
            setSelected={setSelectedInstrument}
          />
          <SetAsDefault selected={selectedInstrument} />
        </div>
      )}

      {/* RIGHT: Navigation links */}
      <div className={styles.linksContainer}>
        {user && (
          <>
            <Link
              to="/Home"
              className={`${styles.link} ${isActive("/Home") ? styles.active : ""}`}
            >
              Home
            </Link>
            <Link
              to="/Camera"
              className={`${styles.link} ${isActive("/Camera") ? styles.active : ""}`}
            >
              Camera
            </Link>
            <Link
              to="/History"
              className={`${styles.link} ${isActive("/History") ? styles.active : ""}`}
            >
              History
            </Link>
          </>
        )}
        <Link
          to="/SignIn"
          className={`${styles.link} ${isActive("/SignIn") ? styles.active : ""}`}
        >
          {user ? "Profile" : "Sign In"}
        </Link>
      </div>
    </nav>
  );
};

export default Nav;
