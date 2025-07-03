// src/Activity.js
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";
import { useState, useEffect } from "react";
import {
  writeTest,
  getTest,
  getActivities,
  getArgomenti,
} from "./firebaseConfig";

const Activity = () => {
  const [loading, setLoading] = useState(true);
  const [activityId, setActivityId] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  //const [moduleObj, setModuleObj] = useState([]);
  const [argomenti, setArgomenti] = useState([]);
  const [moduli, setModuli] = useState([]);
  const [attivita, setAttivita] = useState([]);

  useEffect(() => {
    setLoading(true);
    const getActivity = async () => {
      try {
        /*
        const argomento = await getActivities();
        setName(argomento.nome);
        setDescription(argomento.descrizione)
        setModuleObj(argomento.moduli)
        */

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
        // salvo la lista di tutti i moduli per cui è programmata almeno un'attività
        if (myActs.length > 0) setAttivita(myActs);

        console.log("moduli");
        console.log(moduli);
        console.log("attivita");
        console.log(attivita);
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    getActivity();
  }, [activityId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="container mt-5">
        <div className="row">
          <div className="col-12 text-center">
            <h2 className="display-3 welcome">Inizia un'attività</h2>
          </div>
        </div>
        <Accordion>
          {argomenti.map((arg, index) => (
            <Accordion.Item eventKey={index}>
              <Accordion.Header>
                <div style={{ fontSize: "32px" }}>{arg.nome}</div>
              </Accordion.Header>
              <Accordion.Body>
                {arg.descrizione}
                <br></br>
                <br></br>

                <Accordion>
                  {moduli
                    .filter((mod) => mod.arg === arg.id) // Filter based on matching arg.id
                    .map((mod, index) => (
                      <Accordion.Item eventKey={index}>
                        <Accordion.Header>
                          <div style={{ fontSize: "24" }}>{mod.nome}</div>
                        </Accordion.Header>
                        <Accordion.Body>{mod.descrizione}
                        <br></br>
                        <br></br>
                        <div className="row">
                        {attivita
                          .filter((act) => act.mod === mod.id && act.arg === arg.id) // Filter based on matching mod.id and arg.id
                          .map((act, index) => (
                              <Link
                                to={`/Activity_Detail/${act.arg}/${act.mod}/${act.id}`}
                                className="col-md-6 card link-wrapper"
                              >
                                <div className="custom-button2">
                                  <div className="title">
                                  {act.tipo}
                                  </div>
                                  <div className="description">
                                  {act.descrizione}
                                  </div>
                                </div>
                              </Link>
                          ))}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                </Accordion>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};

export default Activity;