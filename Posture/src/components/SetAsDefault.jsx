import React from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const SetAsDefault = ({ selected }) => {
  const handleClick = async () => {
    const user = auth.currentUser;
    if (user && selected !== "Select Instrument") {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { instrument: selected }, { merge: true });
        alert("Default instrument saved!");
      } catch (err) {
        console.error("Error saving instrument:", err);
      }
    }
  };

  return (
    <button onClick={handleClick} disabled={selected === "Select Instrument"}>
      Set as Default
    </button>
  );
};

export default SetAsDefault;
