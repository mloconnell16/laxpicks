import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import LaxPicks from "./lacrosse-pickem.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const authActions = {
    login: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
    signup: (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
    logout: () => signOut(auth),
    user,
    loading,
  };

  if (loading) return <div style={{ background: "#0a0e14", color: "#fff", padding: 40, minHeight: "100vh" }}>Loading...</div>;

  return <LaxPicks authActions={authActions} />;
}