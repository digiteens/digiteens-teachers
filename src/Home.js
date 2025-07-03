import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getClassi } from "./firebaseConfig";
import { Link } from 'react-router-dom';

const Home = () => {
  const { user, classe } = useAuth(); // Destructure user and classe from useAuth
  const [loading, setLoading] = useState(true);
  const [classi, setClassi] = useState([]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const getActivity = async () => {
        try {
          const classes = await getClassi();
          const myClasses = classes.map(
            (c) =>
              new Object({
                nome: c.nome,
                scuola: c.scuola,
                citta: c.citta,
                programmate: c.programmate,
                id: c.id,
              })
          );
          setClassi(myClasses);

          console.log("classe attuale:");
          console.log(classe);
          console.log("utente attuale:");
          console.log(user);
        } catch (error) {
          console.error("Error fetching activity:", error);
        } finally {
          setLoading(false);
        }
      };
      getActivity();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <br></br>
      <div className="container-fluid text-center">
        <div className="row justify-content-center">
          <h1 className="display-1 welcome">Benvenuto prof!</h1>
          <h1 className="display-5 welcome2">La tua classe:</h1>
        </div>
      </div>

      <div className="container-fluid container-fluid-custom mt-8">
        <div className="col-md-8 row row-custom justify-content-center mb-8">
          {classi
            .filter((cla) => cla.id === classe?.id) // Filter classes based on the user's class
            .map((cla, index) => (
              <Link
                to={`/Classroom/${cla.id}`}
                className="col-md-5 d-flex justify-content-center mb-4 link-wrapper"
                key={`/Classroom/${cla.id}`}
              >
                <div className="custom-button">
                  <div className="title">{cla.nome}</div>
                  <div className="description">
                    {cla.scuola}
                    <br></br>
                    {cla.citta}
                    <br></br>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Home;