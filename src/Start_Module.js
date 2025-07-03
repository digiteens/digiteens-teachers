// src/Start_Module.js
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";
import { useState, useEffect } from "react";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useParams } from "react-router-dom";
import {
  writeTest,
  getTest,
  getActivities,
  getArgomenti,
  writeProgrammateModuli,
  getProgrammateModuli,
  getProgrammate,
  getClassi,
  getPlanningTutorialStatus,
  setPlanningTutorialSeen,
} from "./firebaseConfig";

const ModuleGamificationToggle = ({ 
  moduleId, 
  isCompetitive, 
  setIsCompetitive,
  isDisabled 
}) => {
  return (
    <div className={`competitive-collaborative-toggle-container ${isDisabled ? "disabled" : ""}`}>
      <button
        className={`toggle-option ${isCompetitive ? "active" : ""}`}
        onClick={() => !isDisabled && setIsCompetitive(true)}
        disabled={isDisabled}
      >
        Competitiva
      </button>
      <button
        className={`toggle-option ${!isCompetitive ? "active" : ""}`}
        onClick={() => !isDisabled && setIsCompetitive(false)}
        disabled={isDisabled}
      >
        Collaborativa
      </button>
    </div>
  );
};

const Start_Module = () => {
  const [loading, setLoading] = useState(true);
  const [activityId, setActivityId] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [argomenti, setArgomenti] = useState([]);
  const [moduli, setModuli] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [programmate, setProgrammate] = useState([]);
  const [newKey, setNewKey] = useState("");
  const [programmateID, setProgrammateID] = useState("");
  const [activeKeys, setActiveKeys] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [moduleCompetitiveStates, setModuleCompetitiveStates] = useState({});
  // Hardcoded variable to switch between versions
  const useNewVersion = true; // Change this to true to use the new version

  const handleCloseModal = () => setShowModal(false);
  
// Replace your existing question mark button handler:
const handleShowModal = () => {
  setShowModal(true);
  // No need to reset the variable here - we only want automatic first-time show
};

  const { classid } = useParams();

  const handleClick = (mod, event) => {
    const dataToUpdate = {
      attivazione: "2024/10/01 08:00",
      path: mod.arg + "/" + mod.id,
    };
    console.log("passed");
    console.log(dataToUpdate);
  };

  const updateDatabase = (data) => {
    writeProgrammateModuli(programmateID, newKey, data);
  };

  const handleAccordionSelect = (eventKey) => {
    if (activeKeys.includes(eventKey)) {
      setActiveKeys(activeKeys.filter(key => key !== eventKey));
    } else {
      setActiveKeys([...activeKeys, eventKey]);
    }
  };

  // Add this useEffect near your other effects
useEffect(() => {
  const checkTutorial = async () => {
    if (!programmateID) return;
    
    try {
      const hasSeen = await getPlanningTutorialStatus(programmateID);
      if (!hasSeen) {
        handleShowModal(); // Show your existing modal
        await setPlanningTutorialSeen(programmateID); // Mark as seen
      }
    } catch (error) {
      console.error("Tutorial check failed:", error);
      handleShowModal(); // Fallback: show modal anyway
    }
  };

  checkTutorial();
}, [programmateID]);


  useEffect(() => {
    setLoading(true);
    const getClass = async () => {
      try {
        const classi = await getClassi();

        const myClasse = classi
          .filter((c) => c.id === classid)
          .map((c) => new Object({
            programmate: c.programmate,
          }));

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
    const getActivity = async () => {
      try {
        const args = await getArgomenti();
        const myArgs = args.map((a) => new Object({
          nome: a.nome,
          descrizione: a.descrizione,
          id: a.id,
          moduli: a.moduli,
        }));
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
            switchCompCollab: mod[m].switchCompCollab,
          }));
          myMods.push(...mod);
        });
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
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    getActivity();
  }, [programmateID]);

  useEffect(() => {
    const fetchProgrammate = async () => {
      const programmateList = [];
      try {
        const prog = await getProgrammate(programmateID);

        const progKeys = Object.keys(prog);
        const progNumbers = progKeys.map((key) => parseInt(key.replace("mod", "")));
        const highestProgNumber = Math.max(...progNumbers);

        const newProgKey = `mod${highestProgNumber + 2}`;
        setNewKey(newProgKey);

        const myProgs = prog.map((p) => ({
          path: p.path,
          attivazione: p.attivazione,
          chiusura: p.chiusura,
          isCompetitive: p.isCompetitive,
        }));

        setProgrammate(myProgs);
      } catch (error) {
        console.error(`Error`, error);
      }
    };

    if (moduli.length > 0) {
      fetchProgrammate();
    }
  }, [moduli]);

  useEffect(() => {
    if (programmate.length > 0 && moduli.length > 0) {
      const initialStates = {};
      
      moduli
      .filter(mod => mod.arg == "arg0")
      .forEach(mod => {
        console.log(mod);

        const moduleActivity = programmate.find(item => 
          item && item.path && item.path.startsWith(`${mod.arg}/${mod.id}/`)
        );
        
        
        if (moduleActivity) {
          console.log(moduleActivity);
          const isComp = moduleActivity.isCompetitive != null
  ? moduleActivity.isCompetitive === "true" || moduleActivity.isCompetitive === true
  : true;

          initialStates[mod.id] = isComp;
        } else {
          initialStates[mod.id] = true;
        }
      });

      console.log(initialStates);
      
      setModuleCompetitiveStates(initialStates);
    }
  }, [programmate, moduli]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="container mt-5">
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Pianificazione delle attività</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Da questa pagina è possibile pianificare le attività in maniera da poter creare il proprio percorso di apprendimento.</p>
            <p>Nella homepage sarà poi possibile avviare la prima attività in programma nel percorso, in modo che gli studenti possano seguirla direttamente dalla loro app.</p>
            <p>Il sistema di pianificazione prevede alcune regole: </p>
            <ul>
              <li><strong>Nel contesto di questo test sarà possibile programmare e avviare soltanto un'attività per modulo. Non si potrà quindi avviare un'attività se non se ne ha completata almeno una del modulo precedente.</strong></li>
              <li>Può esserci soltanto un'attività avviata per volta.</li>
              <li>Non è possibile pianificare o ripetere la stessa attività</li>
              <li>Dalla pagina di gestione attività è possibile cancellare delle attività pianificate, per poi ripianificarle eventualmente in futuro</li>
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Chiudi
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="row align-items-center">
          <div className="col text-center">
            <h2 className="d-inline-block mb-0 welcome display-3">
              Seleziona un'attività da pianificare
            </h2>
          </div>
          <div className="col-auto">
            <button 
              className="question-mark-btn"
              onClick={handleShowModal}
            >
              ?
            </button>
          </div>
        </div>
        <br />
        <br />

        {useNewVersion ? (
          <Accordion activeKey={activeKeys} onSelect={handleAccordionSelect}>
            {argomenti.map((arg, index) => (
              <Accordion.Item eventKey={index} key={index}>
                <Accordion.Header>
                  <div style={{ fontSize: "32px" }}>
                    Argomento {index + 1} - {arg.nome}
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  {arg.descrizione}
                  <br />
                  <br />
                  <Accordion activeKey={activeKeys} onSelect={handleAccordionSelect}>
                    {moduli
                      .filter((mod) => mod.arg === arg.id)
                      .map((mod, modIndex) => {
                        const activitiesInModule = attivita.filter(
                          (act) => act.mod === mod.id && act.arg === mod.arg
                        );
                        
                        const hasProgrammedActivity = programmate.some(item => 
                          item && item.path && item.path.startsWith(`${arg.id}/${mod.id}/`)
                        );
                        

                        return (
                          <Accordion.Item
                            eventKey={`${index}-${modIndex}`}
                            key={modIndex}
                          >
                            <Accordion.Header>
                              <div className="title">
                                Modulo {modIndex + 1} - {mod.nome}
                              </div>
                            </Accordion.Header>
                            <Accordion.Body>
                              {mod.descrizione}
                              <br /><br />
                              {mod.switchCompCollab && (
                                <div className="col-md-6">
                                  <h3>Tipologià attività</h3>
                                  <ModuleGamificationToggle
                                    moduleId={mod.id}
                                    isCompetitive={moduleCompetitiveStates[mod.id] ?? true}
                                    setIsCompetitive={(value) => setModuleCompetitiveStates(prev => ({
                                      ...prev,
                                      [mod.id]: value
                                    }))}
                                    isDisabled={hasProgrammedActivity}
                                  />
                                </div>
                              )}
                              <div className="row">
                                {activitiesInModule.map((act, actIndex) => {
                                  const isActivityInProgrammate = programmate.some(
                                    (item) => item.path === `${arg.id}/${mod.id}/${act.id}`
                                  );
                            
                                  return (
                                    <div
  key={actIndex}
  className={
    isActivityInProgrammate
      ? "col-md-6 card link-wrapper selected-card programmed-activity"
      : hasProgrammedActivity
        ? "col-md-6 card link-wrapper disabled-activity"
        : "col-md-6 card link-wrapper"
  }
  style={{
    pointerEvents: isActivityInProgrammate || hasProgrammedActivity ? "none" : "auto",
    opacity: isActivityInProgrammate || hasProgrammedActivity ? 0.6 : 1,
  }}
>
                                      <Link
                                        to={{
                                          pathname: `/Activity_Detail/${classid}/${programmateID}/${arg.id}/${mod.id}/${act.id}/${moduleCompetitiveStates[mod.id] ?? true}`,
                                        }}
                                        className="custom-button2"
                                        style={{
                                          textDecoration: "none",
                                          color: "inherit",
                                        }}
                                      >
                                        <div className="title">
                                          {isActivityInProgrammate || hasProgrammedActivity ? <s>{act.nome}</s> : act.nome}
                                        </div>
                                        <div>
                                          <b className="tipo-text">{act.tipo}</b>
                                        </div>
                                        <div className="description">{act.descrizione}</div>
                                      </Link>
                                    </div>
                                  );
                                })}
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        );
                      })}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        ) : (
          <Accordion activeKey={activeKeys} onSelect={handleAccordionSelect}>
            {argomenti.map((arg, index) => (
              <Accordion.Item eventKey={index} key={index}>
                <Accordion.Header>
                  <div style={{ fontSize: "32px" }}>
                    Argomento {index + 1} - {arg.nome}
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  {arg.descrizione}
                  <br />
                  <br />
                  <Accordion activeKey={activeKeys} onSelect={handleAccordionSelect}>
                    {moduli
                      .filter((mod) => mod.arg === arg.id)
                      .map((mod, modIndex) => {
                        const modNumber = parseInt(mod.id.replace("mod", ""));
                        const laterModulesSameArg = moduli.filter((m) =>
                          m.arg === arg.id && parseInt(m.id.replace("mod", "")) > modNumber
                        );

                        const laterModulesDifferentArg = argomenti
                          .filter((laterArg) =>
                            parseInt(laterArg.id.replace("arg", "")) > parseInt(arg.id.replace("arg", ""))
                          )
                          .flatMap((laterArg) =>
                            moduli.filter((modInLaterArg) => modInLaterArg.arg === laterArg.id)
                          );

                        const subsequentModules = [...new Set([...laterModulesSameArg, ...laterModulesDifferentArg])];

                        const isSubsequentModuleStarted = subsequentModules.some((m) =>
                          attivita.some((act) => {
                            const programmateItem = programmate.find(
                              (item) => item.path === `${m.arg}/${m.id}/${act.id}`
                            );
                            return programmateItem && programmateItem.attivazione;
                          })
                        );

                        const activitiesInModule = attivita.filter(
                          (act) => act.mod === mod.id && act.arg === mod.arg
                        );
                        const allActivitiesProgrammed = activitiesInModule.length > 0 &&
                          activitiesInModule.every((act) =>
                            programmate.some((item) => item.path === `${arg.id}/${mod.id}/${act.id}`)
                          );

                        const shouldBarModule = isSubsequentModuleStarted || allActivitiesProgrammed;

                        return (
                          <Accordion.Item
                            eventKey={`${index}-${modIndex}`}
                            key={modIndex}
                            className={shouldBarModule ? "disabled-accordion" : ""}
                            onClick={(e) => {
                              if (shouldBarModule) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                          >
                            <Accordion.Header>
                              <div
                                className="title"
                                style={{
                                  textDecoration: shouldBarModule ? "line-through" : "none",
                                  color: shouldBarModule ? "red" : "black",
                                  pointerEvents: shouldBarModule ? "none" : "auto",
                                }}
                              >
                                Modulo {modIndex + 1} - {mod.nome}
                              </div>
                            </Accordion.Header>
                            {!shouldBarModule && (
                              <Accordion.Body>
                                {mod.descrizione}
                                <br />
                                <br />
                                <div className="col-md-6">
                                  <h3>Tipo di Gamification</h3>
                                  <ModuleGamificationToggle
                                    moduleId={mod.id}
                                    isCompetitive={moduleCompetitiveStates[mod.id] ?? true}
                                    setIsCompetitive={(value) => setModuleCompetitiveStates(prev => ({
                                      ...prev,
                                      [mod.id]: value
                                    }))}
                                    isDisabled={allActivitiesProgrammed}
                                  />
                                </div>
                                <br />
                                <br />
                                <div className="row">
                                  {activitiesInModule.map((act, actIndex) => {
                                    const isActivityInProgrammate = programmate.some(
                                      (item) => item.path === `${arg.id}/${mod.id}/${act.id}`
                                    );
                              
                                    return (
                                      <div
                                        key={actIndex}
                                        className={
                                          isActivityInProgrammate || allActivitiesProgrammed
                                            ? "col-md-6 card link-wrapper selected-card"
                                            : "col-md-6 card link-wrapper"
                                        }
                                        style={{
                                          pointerEvents: isActivityInProgrammate || allActivitiesProgrammed ? "none" : "auto",
                                          opacity: isActivityInProgrammate || allActivitiesProgrammed ? 0.6 : 1,
                                        }}
                                      >
                                        <Link
                                          to={{
                                            pathname: `/Activity_Detail/${classid}/${programmateID}/${arg.id}/${mod.id}/${act.id}/${moduleCompetitiveStates[mod.id] ?? true}`,
                                          }}
                                          className="custom-button2"
                                          style={{
                                            textDecoration: "none",
                                            color: "inherit",
                                          }}
                                        >
                                          <div className="title">
                                            {isActivityInProgrammate || allActivitiesProgrammed ? <s>{act.nome}</s> : act.nome}
                                          </div>
                                          <div>
                                            <b className="tipo-text">{act.tipo}</b>
                                          </div>
                                          <div className="description">{act.descrizione}</div>
                                        </Link>
                                      </div>
                                    );
                                  })}
                                </div>
                              </Accordion.Body>
                            )}
                          </Accordion.Item>
                        );
                      })}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </div>
      <br></br>
      <br></br>
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};

export default Start_Module;