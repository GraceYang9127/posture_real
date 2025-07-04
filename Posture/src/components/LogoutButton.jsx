import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("You have been logged out.");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout.");
    }
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}

export default LogoutButton;
