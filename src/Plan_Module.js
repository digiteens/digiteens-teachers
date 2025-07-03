// src/Plan_Module.js
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
  getProgrammateModuli,
  writeProgrammateModuli,
} from "./firebaseConfig";

const Plan_Module = () => {
  const [loading, setLoading] = useState(true);
  const [activityId, setActivityId] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  //const [moduleObj, setModuleObj] = useState([]);
  const [argomenti, setArgomenti] = useState([]);
  const [moduli, setModuli] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [pathArg, setArg] = useState([]);
  const [pathMod, setMod] = useState([]);
  const [pAttivazione, setAttivazione] = useState([]);
  const [programmate, setProgrammate] = useState([]);
  const [oldKey, setOldKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const [currentMod, setCurrentMod] = useState([]);

  const [selectedLabels, setSelectedLabels] = useState([]);

  const { classid, progid, argid, modid } = useParams();

  const handleClick = (mod, event) => {
    // Perform your database update function here
    const dataToUpdate = {
      //attivazione: new Date(), // Current date and time
      attivazione: "2024/10/01 08:00",
      path: argid + "/" + modid, // mod.id is passed as the path
      argomenti: selectedLabels,
    };
    console.log("passed");
    console.log(dataToUpdate);

    updateDatabase(dataToUpdate);
  };

  const updateDatabase = (data) => {
    writeProgrammateModuli(progid, newKey, data);
  };

  const handleButtonClick = (label) => {
    setSelectedLabels((prevLabels) => {
      if (prevLabels.includes(label)) {
        // Remove the label if it is already selected
        return prevLabels.filter((item) => item !== label);
      } else {
        // Add the label if it is not selected
        return [...prevLabels, label];
      }
    });
  };

  // Log selectedLabels whenever it changes
  useEffect(() => {
    console.log("Selected labels:", selectedLabels);
  }, [selectedLabels]);

  useEffect(() => {
    setLoading(true);
    const getActivity = async () => {
      try {
        const args = await getArgomenti();
        const myArgs = args.map(
          (a) =>
            new Object({
              nome: a.nome,
              descrizione: a.descrizione,
              id: a.id,
              moduli: a.moduli,
            })
        );
        setArgomenti(myArgs);

        let myMods = [];
        myArgs.forEach((a) => {
          let mod = a.moduli;
          mod = Object.keys(mod).map((m) => ({
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

        let myActs = [];
        myMods.forEach((m) => {
          let act = m.attivita;
          act = Object.keys(act).map((ac) => ({
            id: ac,
            nome: act[ac].nome,
            descrizione: act[ac].descrizione,
            tipo: act[ac].tipo,
            mod: m.id,
            arg: m.arg,
          }));
          myActs.push(...act);
        });

        if (myActs.length > 0) setAttivita(myActs);

        let currentMod = [];
        myArgs.forEach((a) => {
          let mod = a.moduli;
          mod = Object.keys(mod)
            .filter((m) => m == modid && a.id == argid)
            .map((m) => ({
              id: m,
              nome: mod[m].nome,
              descrizione: mod[m].descrizione,
              arg: a.id,
              attivita: mod[m].attivita,
            }));
          currentMod.push(...mod);
        });

        // salvo la lista di tutti i moduli per cui è programmata almeno un'attività
        if (currentMod.length > 0) setCurrentMod(currentMod);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    getActivity();
  }, [activityId]);

  // Second useEffect to handle the programmate processing
  useEffect(() => {
    const fetchProgrammate = async () => {
      const programmateList = [];
      try {
        const prog = await getProgrammateModuli(progid);

        /*
        const myProgs = prog
          .filter((p) => p.chiusura == null && p.attivazione != null)
          .map((p) => ({
            attivazione: p.attivazione,
            chisura: p.chiusura,
            path: p.path,
          }));

          
        programmateList.push(...myProgs);
        const ppath = programmateList[0].path;
        const [pArg, pMod] = ppath.split("/");
        setAttivazione(programmateList[0].attivazione);
        setArg(pArg);
        setMod(pMod);
        */

        /* setting OldKey
        const progKeys = Object.keys(prog);
        const progNumbers = progKeys.map((key) =>
          parseInt(key.replace("mod", ""))
        );
        const highestProgNumber = Math.max(...progNumbers);

        // Generate new "prog" key
        const oldProgKey = `mod${highestProgNumber + 1}`;

        setOldKey(oldProgKey);
        */

        // Find the highest "prog" key
        const progKeys = Object.keys(prog);
        const progNumbers = progKeys.map((key) =>
          parseInt(key.replace("mod", ""))
        );
        const highestProgNumber = Math.max(...progNumbers);

        // Generate new "prog" key
        const newProgKey = `mod${highestProgNumber + 2}`;

        setNewKey(newProgKey);
      } catch (error) {
        console.error(`Error`, error);
      }
    };

    if (attivita.length > 0) {
      fetchProgrammate();
    }
  }, [attivita]);

  /*
  // Second useEffect to handle the programmate processing
  useEffect(() => {
    const fetchProgrammateAtt = async () => {
      const programmateList = [];
      try {
        const progAtt = await getProgrammate("prog2");

        const myProgsAtt = progAtt
          .map((p) => ({
            path: p.path,
          }));

        setProgrammate(myProgsAtt);
      } catch (error) {
        console.error(`Error`, error);
      }
    };

    fetchProgrammateAtt();
  }, [oldKey]);
  */

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="container mt-5">
        <div className="row">
          <div className="col-12 text-center">
            {currentMod.length > 0 ? (
              <div>
                <h2 className="display-2 welcome">{currentMod[0].nome}</h2>
                <h3 className="display-6 welcome">
                  Seleziona quali attività del modulo pianificare
                </h3>
              </div>
            ) : (
              <h3 className="display-6 welcome">
                Seleziona quali attività del modulo pianificare
              </h3>
            )}
          </div>
        </div>
        <div className="row">
          {attivita
            .filter((act) => act.mod === modid && act.arg === argid) // Filter based on matching mod.id and arg.id
            .map((act, index) => (
              <Link
                onClick={() => handleButtonClick(act.id)}
                className="col-md-6 card link-wrapper"
              >
                <div
                  className="custom-button2"
                  style={{
                    backgroundColor: selectedLabels.includes(act.id)
                      ? "#4CAF50"
                      : "#f0f0f0",
                    color: selectedLabels.includes(act.id) ? "white" : "black",
                    border: selectedLabels.includes(act.id)
                      ? "2px solid #388E3C"
                      : "1px solid #ccc",
                    padding: "10px 20px",
                    margin: "5px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: selectedLabels.includes(act.id)
                      ? "bold"
                      : "normal",
                    transition:
                      "background-color 0.3s, border 0.3s, color 0.3s",
                  }}
                >
                  <div className="title">Nome Attività</div>
                  <div className="underlined-text">{act.tipo}</div>
                  <div className="description">{act.descrizione}</div>
                </div>
              </Link>
            ))}
        </div>
        <div className="start-btn">
          <Link
            to={`/Start_Activity/${classid}/${progid}`}
            onClick={(event) => handleClick(event)}
            className="btn btn-secondary btn-start-act"
          >
            Avvia modulo
          </Link>
        </div>
      </div>
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};

export default Plan_Module;
