// src/PastActivities.js
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  writeTest,
  getTest,
  getActivities,
  getArgomenti,
  getProgrammate,
  getAttivita,
  getClassi,
  getClasse,
} from "./firebaseConfig";

const PastActivities = () => {
  const [loading, setLoading] = useState(true);
  const [activityId, setActivityId] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  //const [moduleObj, setModuleObj] = useState([]);
  const [programmate, setProgrammate] = useState([]);
  const [programmateID, setProgrammateID] = useState("");
  const [moduli, setModuli] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const collectedActivities = [];

  const {classid} = useParams();

  useEffect(() => {
    setLoading(true);
    const getClass = async () => {
      try {
        const classi = await getClassi();

        const myClasse = classi
          .filter((c) => c.id === classid)
          .map(
            (c) =>
              new Object({
                programmate: c.programmate,
              })
          );
        
        setProgrammateID(myClasse[0].programmate);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    getClass();
  }, [activityId]);

  useEffect(() => {
    //setLoading(true);
    const getActivity = async () => {
      try {
        const prog = await getProgrammate(programmateID); //TODO: filter per classe/docente
        const myProgs = prog
          .filter((p) => p.chiusura != null && p.attivazione != null)
          .map(
            (p) =>
              new Object({
                id: p.id,
                path: p.path,
                attivazione: p.attivazione,
                chiusura: p.chiusura,
              })
          );
        setProgrammate(myProgs);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    getActivity();
  }, [programmateID]);

  // Second useEffect to handle the programmate processing
  useEffect(() => {
    const fetchActivities = async () => {
      const collectedActivities = [];

      for (let program of programmate) {
        const [pArg, pMod, pAtt] = program.path.split("/");

        try {
          const att = await getAttivita(`${pArg}/moduli/${pMod}/attivita/`);

          const myAtt = att
            .filter((a) => a.id === pAtt)
            .map((a) => ({
              tipo: a.tipo,
              descrizione: a.descrizione,
              id: pAtt,
              arg: pArg,
              mod: pMod,
              nome: a.nome,
              attivazione: program.attivazione,
              chiusura: program.chiusura,
            }));

          collectedActivities.push(...myAtt);
        } catch (error) {
          console.error(
            `Error fetching activities for ${pArg}/${pMod}/${pAtt}:`,
            error
          );
        }
      }

      console.log("Collected activities:", collectedActivities);
      setAttivita(collectedActivities);
    };

    if (programmate.length > 0) {
      fetchActivities();
    }
  }, [programmate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="container mt-5">
        <div className="row">
          <div className="col-12 text-center">
            <h2 className="display-3 welcome">Attività Concluse</h2>
          </div>
        </div>
        <br></br>
        <div className="row">
          {attivita.length > 0 ? (
            // Sort activities by chiusura date before mapping
            attivita
              .slice() // Create a copy of the array to avoid mutating the original
              .sort((a, b) => new Date(a.chiusura) - new Date(b.chiusura)) // Sort by chiusura date (newest first)
              .map((act, index) => (
                <Link
                  to={`/Results/${classid}/${programmateID}/${act.arg}/${act.mod}/${act.id}`}
                  className="col-md-6 card link-wrapper"
                  key={index} // Add a key for React's rendering optimization
                >
                  <div className="custom-button2">
                    <div className="title">{act.nome}</div>
                    <div className="underlined-text">{act.tipo}</div>
                    <div className="attivazione">Data attivazione: {act.attivazione}</div>
                    <div className="chisura">Data chiusura: {act.chiusura}</div>
                  </div>
                </Link>
              ))
          ) : (
            // Display message if attività is empty
            <div>Nessuna attività presente</div>
          )}
        </div>
      </div>
  
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};

export default PastActivities;
