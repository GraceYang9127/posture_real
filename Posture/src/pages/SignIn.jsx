import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";

function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const getEmailFromUsername = (username) => `${username}@postureapp.com`;

  const handleSignUp = async () => {
    const email = getEmailFromUsername(username);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      alert("Account created!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignIn = async () => {
    const email = getEmailFromUsername(username);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Signed in!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert("Error signing out.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (currentUser) {
    return (
      <div>
        <h2>Welcome, {currentUser.displayName || "User"}!</h2>
        <p>You are now signed in.</p>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Login / Register</h2>
      <input
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
        value={username}
      />
      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      <div>
        <button onClick={handleSignIn}>Sign In</button>
        <button onClick={handleSignUp}>Sign Up</button>
      </div>
    </div>
  );
}

export default SignIn;
