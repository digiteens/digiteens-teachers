// src/Class_List.js
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";
import { useState, useEffect } from "react";
import { getClassi, getClasse, getUtenti } from "./firebaseConfig";
import { useParams } from "react-router-dom";
import { useAuth } from './AuthContext';


const Class_List = () => {
  const [loading, setLoading] = useState(true);
  const [activityId, setActivityId] = useState(0);
  const [utenti, setUtenti] = useState([]);
  const [classeName, setClasseName] = useState("");
  const { classid } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const getActivity = async () => {
      try {
        const users = await getUtenti();
        const myUsers = users.map(
          (u) =>
            new Object({
              nome: u.nome,
              cognome: u.cognome,
              ruolo: u.ruolo,
              classe: u.classe,
              propic: u.propic,
              coverpic: u.coverpic,
            })
        );
        setUtenti(myUsers);
        console.log(user);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    getActivity();
  }, [activityId]);

  useEffect(() => {
    //setLoading(true);
    const getActivity = async () => {
      try {
        const classi = await getClassi(); //TODO: filter per classe/docente
        const myClassi = classi
          .filter((c) => c.id === classid)
          .map(
            (c) =>
              new Object({
                nome: c.nome,
              })
          );
        setClasseName(myClassi[0].nome);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    getActivity();
  }, [utenti]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="container mt-5">
        <div className="row">
          <div className="col-12 text-center">
            <h2 className="display-3 welcome">Classe {classeName}</h2>
          </div>
        </div>
        <br></br>
        <div className="row">
          {/* TODO: Move style properties from Student Profile Card to CSS */}
          {utenti
            .filter((ute) => ute.ruolo === "studente" && ute.classe === classid) //TODO: add filtro per classe
            .map((ute, index) => (
              <div key={index} className="col-md-6 card link-wrapper">
                <div
                  className="card"
                  style={{
                    border: "3px solid #000",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                    width: "100%",
                    maxWidth: "600px", // Adjust width as needed
                    margin: "0 auto", // Center the card
                  }}
                >
                  {/* Background Image Section */}
                  <div
                    style={{
                      backgroundImage:
                        `url('${ute.coverpic ? ute.coverpic : "https://static.vecteezy.com/system/resources/previews/019/887/657/non_2x/simple-monochrome-lines-background-free-vector.jpg"}')`,backgroundSize: "cover",
                      backgroundPosition: "center",
                      height: "170px", // Adjust height as necessary
                      position: "relative",
                    }}
                  >
                    {/* Profile Image positioned to the left */}

                    <img
                      src={
                        ute.propic
                          ? ute.propic
                          : "https://cdn-icons-png.flaticon.com/512/4869/4869736.png"
                      }
                      alt="Profile"
                      style={{
                        position: "absolute",
                        bottom: "-50px", // Adjust position to sit at the bottom
                        left: "20px", // Move to the left side
                        //borderRadius: "50%",
                        //border: "4px solid white",
                        //boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
                        width: "130px", // Increase size
                        height: "130px", // Ensure the image is square
                      }}
                    />
                  </div>

                  {/* Text Section */}                  
                  <div
                    className="d-flex align-items-center"
                    style={{ padding: "10px" }}
                  >
                    <div className="ms-5" style={{ marginLeft: "120px" }}>
                      {/* Shift the text to the right, accounting for the larger profile image */}
                      <h5
                        className="title"
                        style={{
                          marginBottom: "20px",
                          marginLeft: "100px",
                          fontSize: "24px",
                          fontWeight: "bold",
                        }}
                      >
                        {ute.nome} {ute.cognome}
                      </h5>
                      {/* 
                      <p className="description" style={{ margin: 0 }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      </p>
                      */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};

export default Class_List;
