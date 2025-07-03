// src/Activity_Detail.js
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";
import { useParams, useLocation  } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getArgomenti,
  writeProgrammate,
  getProgrammate,
  publishMessage,
} from "./firebaseConfig";
import { Tooltip } from "bootstrap";

const dayjs = require("dayjs");

const Activity_Detail = () => {
  const { classid, progid, argid, modid, actid, isCompetitive } = useParams();
  const [loading, setLoading] = useState(true);
  const [argomenti, setArgomenti] = useState([]);
  const [moduli, setModuli] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [programmate, setProgrammate] = useState([]);
  const [activityId, setActivityId] = useState(0);
  const [newKey, setNewKey] = useState("");

  const QuestionMarkTooltip = ({ message }) => {
    useEffect(() => {
      // Initialize Bootstrap tooltips
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      );
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        new Tooltip(tooltipTriggerEl);
      });
    }, []);

    return (
      <span
        className="question-mark-circle"
        style={{ cursor: "pointer" }}
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title={message}
      >
        ?
      </span>
    );
  };


  const handleClick = (attivita, event) => {
    // Get the isCompetitive value from location state

    // Extract current module from the activity
    const currentModule = attivita.mod;

    // Find all activities in programmate that belong to the same module
    const sameModuleActivities = programmate
      .filter((p) => p.path !== undefined) // Skip entries where path is undefined
      .filter((p) => p.path.startsWith(attivita.arg + "/" + currentModule));

    // Determine the highest existing priority in this module
    const highestPriority =
      sameModuleActivities.length > 0
        ? Math.max(...sameModuleActivities.map((p) => p.priority || 0))
        : 0;

    // Assign the next available priority
    const newPriority = highestPriority + 1;

    // Data to update
    const dataToUpdate = {
      path: attivita.arg + "/" + attivita.mod + "/" + attivita.id,
      priority: newPriority,
      isCompetitive: isCompetitive,
    };

    console.log("passed");
    console.log(dataToUpdate);

    updateDatabase(dataToUpdate);

    publishMessage(classid, {
      timestamp: dayjs().format("YYYY/MM/DD HH:mm"),
      message: "programmate",
    });
  };

  const updateDatabase = (data) => {
    writeProgrammate(progid, newKey, data);
  };

  useEffect(() => {
    setLoading(true);
    const getActivity = async () => {
      try {
        const args = await getArgomenti();
        const myArgs = args
          .filter((a) => a.id === argid)
          .map(
            (a) =>
              new Object({
                nome: a.nome,
                descrizione: a.descrizione,
                id: a.id,
                moduli: a.moduli,
              })
          );
        setArgomenti(myArgs);
        //console.log(argomenti);

        let myMods = [];
        myArgs.forEach((a) => {
          let mod = a.moduli;
          mod = Object.keys(mod)
            .filter((m) => m === modid)
            .map((m) => ({
              id: m,
              nome: mod[m].nome,
              descrizione: mod[m].descrizione,
              arg: a.id,
              attivita: mod[m].attivita,
            }));
          myMods.push(...mod);
        });
        // salvo la lista di tutti i moduli per cui è programmata almeno un'attività
        if (myMods.length > 0) setModuli(myMods);
        //console.log(moduli);

        console.log("moduli");
        console.log(myMods);

        let myActs = [];
        myMods.forEach((m) => {
          let act = m.attivita;
          act = Object.keys(act)
            .filter((ac) => ac === actid)
            .map((ac) => ({
              id: ac,
              nome: act[ac].nome,
              descrizione: act[ac].descrizione,
              tipo: act[ac].tipo,
              domande: act[ac].domande,
              mod: m.id,
              arg: m.arg,
              numQuestions: act[ac].numQuestions,
            }));
          myActs.push(...act);
        });

        console.log("attivita");
        console.log(myActs);

        // salvo la lista di tutti i moduli per cui è programmata almeno un'attività
        if (myActs.length > 0) setAttivita(myActs);

        console.log("attivita");
        console.log(attivita);
        //console.log(attivita);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    getActivity();
  }, []);

  // Second useEffect to handle the programmate processing
  useEffect(() => {
    const fetchProgrammate = async () => {
      const programmateList = [];
      try {
        const prog = await getProgrammate(progid); // Fetch existing programmate data

        // Ensure prog is an object
        const progKeys = prog;

        console.log("List of keys:", progKeys);

        // Extract numeric parts of keys
        const progNumbers = progKeys
          .map((key) => {
            const match = key.id.match(/^att(\d+)$/); // Match keys like "att1", "att2", etc.
            return match ? parseInt(match[1], 10) : null; // Extract the numeric part
          })
          .filter((key) => key !== null); // Remove invalid values (non-matching keys)

        console.log("Extracted numbers:", progNumbers);

        // Determine the next available number
        const highestProgNumber =
          progNumbers.length > 0 ? Math.max(...progNumbers) : 0; // Default to 0 if no keys exist
        const newProgNumber = highestProgNumber + 1;

        // Generate the new key
        let newProgKey = `att${newProgNumber}`;

        // Ensure the new key doesn't already exist (in case of async issues or gaps)
        while (progKeys.includes(newProgKey)) {
          newProgNumber++; // Increment until we find an unused key
          newProgKey = `att${newProgNumber}`;
        }

        console.log("New key:", newProgKey);

        setNewKey(newProgKey); // Set the new key

        console.log("nuova key: " + newProgKey);

        const myProgs = prog.map((p) => ({
          path: p.path,
          priority: p.priority,
        }));

        setProgrammate(myProgs);
      } catch (error) {
        console.error(`Error`, error);
      }
    };

    if (attivita.length > 0) {
      fetchProgrammate();
    }
  }, [attivita]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="col-md-10 container">
        <div className="activity-container">
          <div className="col-md-12 row row-custom mb-8">
            {/*<div className="col-md-1">
              <Link to="/" className="back-button">
                <span className="back-button-icon">&larr;</span>
              </Link>
            </div>*/}

            <h3 className="col-md-10 display-6 welcome">{attivita[0].nome}</h3>
            {/* <div className="col-md-1 p-3">
              <p>
                <QuestionMarkTooltip message="msg per il docente" />
              </p>
            </div>*/}
            
          </div>
          <p>{attivita[0].descrizione}</p>

          <div className="activity-details">
            <p>
              <strong>Domande: </strong>
              {attivita[0].numQuestions
                ? attivita[0].numQuestions
                : attivita[0].domande?.length ?? 0}
            </p>
{/*<p>
              <strong>Tempo stimato:</strong> 15 minuti
            </p>*/}
            <p>
              <strong>Tipologia:</strong> {attivita[0].tipo}
            </p>
          </div>

          

          <div className="start-btn">
            <Link
              to={`/Classroom/${classid}`}
              onClick={(event) => handleClick(attivita[0], event)}
              className="btn btn-secondary btn-start-act"
            >
              Pianifica attività
            </Link>
          </div>
        </div>
      </div>

      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};

export default Activity_Detail;
