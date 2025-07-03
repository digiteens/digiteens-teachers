import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getAuth, signOut } from "firebase/auth";
import logo_digi from "./logo_digi.svg";

const Navbar = () => {
  const { user, classe, setUser, setClasse, loading } = useAuth(); // Add loading state
  const auth = getAuth();

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUser(null);
      setClasse(null);
      localStorage.removeItem('classe'); // Clear classe from local storage
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading spinner or message
  }

  return (
    <div className="container-fluid navContainer">
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <Link to="/" className="link-wrapper">
            <img src={logo_digi} alt="Bootstrap" width="200" height="80" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNavDropdown"
            aria-controls="navbarNavDropdown"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNavDropdown">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item px-2">
                <Link to="/" className="link-wrapper">
                  <span className="nav-link active" aria-current="page">
                    Le mie classi
                  </span>
                </Link>
              </li>
              <li className="nav-item divider d-none d-lg-inline">|</li>
              <li className="nav-item px-2">
                <a className="nav-link" href="#">
                  Impostazioni
                </a>
              </li>
              <li className="nav-item divider d-none d-lg-inline">|</li>
              <li className="nav-item px-2">
                <Link to="/Info" className="link-wrapper">
                  <span className="nav-link">
                    Info
                  </span>
                </Link>
              </li>
            </ul>

            <ul className="navbar-nav pull-sm-right">
  <li className="nav-item">
    {user ? ( // Check for user, not classe
      <button
        type="button"
        className="btn btn-danger custom-btn" // Red color for Logout
        onClick={handleLogout}
      >
        <i className="bi bi-box-arrow-right me-2"></i> {/* Bootstrap icon for logout */}
        Logout
      </button>
    ) : (
      <Link to="/LoginPage" className="link-wrapper">
        <button
          type="button"
          className="btn btn-success custom-btn" // Green color for Login
        >
          <i className="bi bi-box-arrow-in-right me-2"></i> {/* Bootstrap icon for login */}
          Login
        </button>
      </Link>
    )}
  </li>
</ul>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;