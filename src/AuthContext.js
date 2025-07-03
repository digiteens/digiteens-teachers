import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  classe: null,
  setClasse: () => {},
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [classe, setClasse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);

        // Restore classe from local storage
        const savedClasse = localStorage.getItem('classe');
        if (savedClasse) {
          setClasse(JSON.parse(savedClasse));
        }
      } else {
        setUser(null);
        setClasse(null);
        localStorage.removeItem('classe'); // Clear classe from local storage on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, classe, setClasse, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};