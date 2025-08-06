import React, { useEffect, useState } from 'react';
import styles from "./Nav.module.css";
import postureLogo from "../../assets/images/postureLogo.png";
import { Link } from "react-router-dom";
import Dropdown from '../Dropdown.jsx';
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import SetAsDefault from "../SetAsDefault.jsx";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const Nav = () => {
  const [user, setUser] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState("Select Instrument");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.instrument) setSelectedInstrument(data.instrument);
        }
      } else {
        setSelectedInstrument("Select Instrument");  // Reset on logout
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles['logo-container']}>
        <span>
          <img src={postureLogo} width="250" height="75" alt="Logo" />
        </span>
      </div>

      {user && (
        <div className={styles.instrumentSelector}>
          <Dropdown selected={selectedInstrument} setSelected={setSelectedInstrument} />
          <SetAsDefault selected={selectedInstrument} />
        </div>
      )}

      <div className={styles['links-container']}>
        {user && (
          <>
            <div className={styles['link']}>
              <Link to="/Home">Home</Link>
            </div>
            <div className={styles['link']}>
              <Link to="/Camera">Camera</Link>
            </div>
            <div className={styles['link']}>
              <Link to="/Chat">AI Chatbox</Link>  {/* ✅ New AI Chatbox link */}
            </div>
          </>
        )}
        <div className={styles['link']}>
          <Link to="/SignIn">{user ? "Profile" : "Sign In"}</Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
