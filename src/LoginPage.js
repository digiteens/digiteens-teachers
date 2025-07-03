import React, { useState } from 'react';
import "./App.css";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getUserClassFromId } from "./firebaseConfig";
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap'; // Import Modal and Button from react-bootstrap

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for error message
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const { setUser, setClasse } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError(''); // Clear any previous error message

    const auth = getAuth();
    signInWithEmailAndPassword(auth, username, password)
      .then((userCredential) => {
        const user = userCredential.user;
        getUserClassFromId(user.uid)
          .then(res => {
            if (res.user.ruolo !== "docente") {
              throw "User is not a student";
            }
            setUser({ id: user.uid, ...res.user });
            setClasse({ id: res.user.classe, ...res.classe });

            // Save classe to local storage
            localStorage.setItem('classe', JSON.stringify({ id: res.user.classe, ...res.classe }));

            navigate('/'); // Redirect to home page
          })
          .catch((error) => {
            console.error(error);
            setError("Errore: Ruolo non valido.");
            setShowModal(true); // Show modal on error
          });
      })
      .catch((error) => {
        console.error(`Credenziali errate`, error);
        setError("Credenziali errate. Riprova.");
        setShowModal(true); // Show modal on error
      });
  };

  const handleCloseModal = () => {
    setShowModal(false); // Close the modal
  };

  return (
    <div className="container d-flex justify-content-center vh-100">
      <div className="card p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <br></br><br></br>
        <h3 className="text-center mb-4">Login</h3>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Inserisci email/username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Inserisci la password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Log In
          </button>
        </form>

        {/* Modal for error message */}
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Errore</Modal.Title>
          </Modal.Header>
          <Modal.Body>{error}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Chiudi
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default LoginPage;