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

  const getEmailFromUsername = (username) =>
    `${username}@postureapp.com`;

  const handleSignUp = async () => {
    const email = getEmailFromUsername(username);
    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      await updateProfile(userCredential.user, {
        displayName: username,
      });
      alert("Account created!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignIn = async () => {
    const email = getEmailFromUsername(username);
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      alert("Signed in!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      alert("Error signing out.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) =>
      setCurrentUser(user)
    );
    return () => unsubscribe();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7f8fb 0%, #eef1f6 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontSize: 42,
              marginBottom: 8,
            }}
          >
            🧍‍♂️
          </div>
          <h2 style={{ margin: 0 }}>
            {currentUser ? "Your Profile" : "Welcome"}
          </h2>
          <p
            style={{
              marginTop: 6,
              color: "#666",
              fontSize: "0.95rem",
            }}
          >
            {currentUser
              ? "Manage your account and posture journey"
              : "Sign in or create an account to get started"}
          </p>
        </div>

        {/* SIGNED IN */}
        {currentUser ? (
          <div>
            <div
              style={{
                background: "#f3f5f9",
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#777",
                }}
              >
                Signed in as
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                {currentUser.displayName || "User"}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                background: "#e74c3c",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* SIGNED OUT */
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 340,   // 👈 THIS is the key change
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  marginBottom: 10,
                  fontSize: "0.95rem",
                }}
              />

              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #ccc",
                  fontSize: "0.95rem",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
              }}
            >
              <button
                onClick={handleSignIn}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "none",
                  background: "#4f46e5",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>

              <button
                onClick={handleSignUp}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "1px solid #4f46e5",
                  background: "#fff",
                  color: "#4f46e5",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>


        )}
      </div>
    </div>
  );
}

export default SignIn;
