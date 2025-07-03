import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
  writeTest,
  getTest,
  getActivities,
  getArgomenti,
  getProgrammate,
  getAttivita,
  getProgrammateModuli,
  getClassi,
  writeProgrammate,
  publishMessage,
} from "./firebaseConfig";
import { setTutorialCompletion, getTutorialStatus } from "./firebaseConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faPlayCircle, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "./AuthContext";
import { Modal, Button } from "react-bootstrap";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

const dayjs = require("dayjs");

const Classroom = () => {
  const [loading, setLoading] = useState(true);
  const [activityId, setActivityId] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [programmate, setProgrammate] = useState([]);
  const [moduli, setModuli] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [modStart, setModStart] = useState(true);
  const [pathArg, setArg] = useState([]);
  const [pathMod, setMod] = useState([]);
  const [pathAtt, setAtt] = useState([]);
  const [modNumber, setModNumber] = useState("");
  const [programmateID, setProgrammateID] = useState("");
  const [className, setClassName] = useState("");
  const [ongoingAct, setOngoingAct] = useState(true);
  const [oldKey, setOldKey] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [missingPreviousModule, setMissingPreviousModule] = useState(false);
  const [allActivitiesCompleted, setAllActivitiesCompleted] = useState(false);

  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);



  const { classid } = useParams();

  const [dataLoadError, setDataLoadError] = useState(null);

  // Simplified tutorial steps focusing on existing elements
const tutorialSteps = [
  {
    title: "Benvenuto nella tua classe",
    target: 'next-activity',
    content: "Facciamo un piccolo tour della dashboard della tua classe. Da qui potrai gestire le attività che verranno svolte con gli studenti.",
    position: "center", // New position value
    isIntro: true // Flag for introductory step
  },
  {
    target: 'next-activity',
    title: 'Prossima Attività',
    content: 'Qui vedrai la prossima attività in programma. Potrai avviarla cliccando sul pulsante. Una volta avviata, potrai vedere i risultati e chiuderla quando decidi che sarà tempo di passare alla prossima.',
    position: 'bottom'
  },
  {
    target: 'plan-activity',
    title: 'Programma Attività',
    content: 'Programma le future attività per la tua classe tra i vari moduli presenti.',
    position: 'right'
  },
  {
    target: 'manage-activities',
    title: 'Gestione Attività',
    content: 'Visualizza e modifica tutte le attività programmate. Potrai anche eliminare attività dalla programazione.',
    position: 'right'
  },
  {
    target: 'completed-activities',
    title: 'Attività Concluse',
    content: 'Archivio di tutte le attività completate con la classe con i relativi risultati.',
    position: 'left'
  },
  {
    target: 'class-management',
    title: 'Gestione Classe',
    content: 'Visualizza l\'elenco studenti della loro classe ed il loro profilo.',
    position: 'left'
  }
];
// Start tutorial after ensuring elements exist
const startTutorial = () => {
  // Verify all target elements exist
  const allTargetsExist = tutorialSteps.every(step => {
    const element = document.getElementById(step.target);
    return element !== null;
  });

  if (allTargetsExist) {
    setTutorialActive(true);
    setShowTutorial(true);
    setTutorialStep(0);
  } else {
    console.warn("Some tutorial targets not found");
  }
};

// Replace closeTutorial function
const closeTutorial = async () => {
  console.log("Closing tutorial, programmateID:", programmateID); // Debug
  try {
    if (programmateID) {
      console.log("Setting tutorial as seen...");
      await setTutorialCompletion(programmateID, true);
      console.log("Tutorial status updated successfully");
    }
  } catch (error) {
    console.error("Error saving tutorial status:", error);
  }
  setShowTutorial(false);
};

// Replace the tutorial reset function (for the ? button)
const resetTutorial = async () => {
  try {
    if (programmateID) {
      await setTutorialCompletion(programmateID, false);
    }
  } catch (error) {
    console.error("Error resetting tutorial status:", error);
  }
  setShowTutorial(true);
  setTutorialStep(0);
};

const nextStep = () => {
  if (tutorialStep < tutorialSteps.length - 1) {
    setTutorialStep(tutorialStep + 1);
    // Scroll to the first targeted element if moving from intro
    if (tutorialStep === 0 && tutorialSteps[1].target) {
      setTimeout(() => {
        const firstTarget = document.getElementById(tutorialSteps[1].target);
        firstTarget?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }
  } else {
    closeTutorial();
  }
};

const prevStep = () => {
  if (tutorialStep > 0) {
    setTutorialStep(tutorialStep - 1);
  }
};

// Modified useEffect for tutorial
useEffect(() => {
  const checkTutorialStatus = async () => {
    if (!programmateID) return;
    
    try {
      const hasSeen = await getTutorialStatus(programmateID);
      console.log("Tutorial status:", hasSeen); // Debug log
      if (!hasSeen) {
        setTimeout(() => {
          startTutorial();
        }, 1000);
      }
    } catch (error) {
      console.error("Error checking tutorial status:", error);
      // Fallback to showing tutorial
      setTimeout(() => {
        startTutorial();
      }, 1000);
    }
  };

  if (!loading && programmateID) {
    checkTutorialStatus();
  }
}, [loading, programmateID]);

// New component for the tutorial overlay
const TutorialOverlay = ({ step, onNext, onPrev, onClose }) => {
  const [style, setStyle] = useState({});
  const [cardStyle, setCardStyle] = useState({});
  
  useEffect(() => {
    const targetElement = document.getElementById(step.target);
    if (!targetElement) return;

    const elementRect = targetElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Highlight style
    setStyle({
      position: 'fixed',
      top: elementRect.top,
      left: elementRect.left,
      width: elementRect.width,
      height: elementRect.height,
      border: '2px solid rgba(0, 123, 255, 0.8)',
      borderRadius: '8px',
      backgroundColor: 'rgba(0, 123, 255, 0.2)',
      boxShadow: '0 0 0 100vmax rgba(0,0,0,0.7)',
      zIndex: 1050,
      pointerEvents: 'none',
      transition: 'all 0.3s ease'
    });

    // Card positioning based on step position
    let cardPosition = {};
    const cardWidth = 300;
    const cardHeight = 200;
    const margin = 20;

    switch (step.position) {
      case 'bottom':
        cardPosition = {
          top: elementRect.bottom + margin,
          left: elementRect.left + elementRect.width/2 - cardWidth/2
        };
        break;
      case 'right':
        cardPosition = {
          top: elementRect.top + elementRect.height/2 - cardHeight/2,
          left: elementRect.right + margin
        };
        break;
      case 'left':
        cardPosition = {
          top: elementRect.top + elementRect.height/2 - cardHeight/2,
          left: elementRect.left - cardWidth - margin
        };
        break;
      default:
        cardPosition = {
          top: elementRect.bottom + margin,
          left: elementRect.left + elementRect.width/2 - cardWidth/2
        };
    }

    // Ensure card stays within viewport
    cardPosition.top = Math.max(margin, Math.min(cardPosition.top, windowHeight - cardHeight - margin));
    cardPosition.left = Math.max(margin, Math.min(cardPosition.left, windowWidth - cardWidth - margin));

    setCardStyle({
      position: 'fixed',
      width: cardWidth,
      minHeight: cardHeight,
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1051,
      ...cardPosition
    });
  }, [step]);

  return (
    <>
      <div style={style} />
      <div style={cardStyle}>
        <h4>{step.title}</h4>
        <p>{step.content}</p>
        <div className="tutorial-navigation">
          {tutorialStep > 0 && (
            <button className="btn btn-outline-secondary mr-2" onClick={onPrev}>
              Indietro
            </button>
          )}
          <button className="btn btn-primary" onClick={tutorialStep === tutorialSteps.length - 1 ? onClose : onNext}>
            {tutorialStep === tutorialSteps.length - 1 ? 'Completa' : 'Avanti'}
          </button>
        </div>
        <div className="step-indicator">
          {tutorialSteps.map((_, index) => (
            <span 
              key={index} 
              className={index === tutorialStep ? 'active' : ''}
            />
          ))}
        </div>
      </div>
    </>
  );
};
  

  const handleClick = async () => {
    setShowConfirmModal(true);
  };

  const updateDatabase = (data) => {
    writeProgrammate(programmateID, oldKey, data);
  };

  const checkAllModulesCompleted = async (programmateID) => {
    try {
      const allProgrammate = await getProgrammate(programmateID);
      
      // Count how many unique modules have completed activities
      const completedModules = new Set();
      console.log(allProgrammate);

      allProgrammate.forEach(p => {
        if (p.attivazione && p.chiusura && p.path) {
          const [arg, mod] = p.path.split('/');
          console.log(arg, mod);
          completedModules.add(`${arg}/${mod}`);
        }
      });

      
      
      // You might want to adjust this number based on your actual module count
      return completedModules.size >= 3; // Assuming 3 modules need completion
    } catch (error) {
      console.error("Error checking module completion:", error);
      return false;
    }
  };

  // Improved version with proper error handling
  const checkPreviousModules = async (currentArg, currentMod, allProgrammate) => {
    try {
      const currentModNum = parseInt(currentMod.replace("mod", ""));
      if (currentModNum <= 1) return false; // No previous modules to check

      const prevMod = `mod${currentModNum - 1}`;
      
      return !allProgrammate.some(p => {
        if (!p?.path) return false;
        const [arg, mod] = p.path.split("/");
        return arg === currentArg && 
               mod === prevMod && 
               p.attivazione && 
               p.chiusura;
      });
    } catch (error) {
      console.error("Error in checkPreviousModules:", error);
      return true; // Default to showing + button if we can't verify
    }
  };

  useEffect(() => {
    let isMounted = true; // Track mounted state

    const loadClassData = async () => {
      try {
        setLoading(true);
        setDataLoadError(null);

        // 1. Load class data first
        const classi = await getClassi();
        const myClasse = classi.find((c) => c.id === classid);
        if (!myClasse) throw new Error("Class not found");

        // 2. Load programmate data
        const prog = await getProgrammate(myClasse.programmate);
        const allCompleted = await checkAllModulesCompleted(myClasse.programmate);
      if (!isMounted) return;
      setAllActivitiesCompleted(allCompleted);


        const myProgs = prog
          .filter(p => p.chiusura == null)
          .map(p => ({
            id: p.id,
            path: p.path,
            priority: p.priority,
            attivazione: p.attivazione,
            isCompetitive: p.isCompetitive,
          }));

        setProgrammate(myProgs);
        setProgrammateID(myClasse.programmate);
        setClassName(myClasse.nome);

        if (myProgs.length === 0) {
          setAttivita([]);
          return;
        }

        // 3. Find the next activity to show
        let validProg = myProgs.find(p => p.attivazione);
        if (!validProg) {
          validProg = myProgs
            .filter(p => !p.attivazione && p.path)
            .sort((a, b) => {
              const [argA, modA] = (a.path || "").split("/");
              const [argB, modB] = (b.path || "").split("/");
              return (parseInt(argA?.replace("arg", "")) || 0) - (parseInt(argB?.replace("arg", "")) || 0) ||
                     (parseInt(modA?.replace("mod", "")) || 0) - (parseInt(modB?.replace("mod", "")) || 0) ||
                     a.priority - b.priority;
            })[0];
          setOngoingAct(false);
        }

        if (!validProg) {
          setAttivita([]);
          return;
        }

        // 4. Check for missing previous modules
        const [pArg, pMod, pAtt] = validProg.path?.split("/") || [];
        if (!pArg || !pMod || !pAtt) {
          setAttivita([]);
          return;
        }

        const isMissingPrevModule = await checkPreviousModules(pArg, pMod, prog);
        if (!isMounted) return;

        setMissingPreviousModule(isMissingPrevModule);
        if (isMissingPrevModule) {
          setAttivita([]);
          return;
        }

        // 5. Load activity details
        const att = await getAttivita(`${pArg}/moduli/${pMod}/attivita/`);
        if (!isMounted) return;

        setAttivita(att
          .filter(a => a.id === pAtt)
          .map(a => ({
            id: a.id,
            tipo: a.tipo,
            descrizione: a.descrizione,
            nome: a.nome,
            isCompetitive: a.isCompetitive,
          })));

        setArg(pArg);
        setMod(pMod);
        setAtt(pAtt);
        setOldKey(validProg.id);

      } catch (error) {
        console.error("Data loading error:", error);
        if (isMounted) setDataLoadError("Error loading class data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadClassData();
    return () => { isMounted = false }; // Cleanup
  }, [classid, activityId]);

  if (loading) return <div>Loading...</div>;
  if (dataLoadError) return <div className="text-danger">{dataLoadError}</div>;

  return (
    <div>
      <br></br>
      {/* Title Row with Question Mark Button */}
<div className="row align-items-center justify-content-center">
  <div className="col-auto">
    <h2 className="display-3 welcome mb-2">Classe {className}</h2>
  </div>
  <div className="col-auto">
  <button 
  className="question-mark-btn"
  onClick={resetTutorial} // Changed from localStorage removal
>
  ?
</button>
  </div>

{/* Tutorial Implementation */}
{showTutorial && (
  <div className="tutorial-overlay">
    <div className="overlay-backdrop" onClick={closeTutorial} />
    
    {(() => {
      const currentStep = tutorialSteps[tutorialStep];
      // Handle the introductory step differently
      if (currentStep.isIntro) {
        return (
          <div className="tutorial-card intro-step">
            <h4>{currentStep.title}</h4>
            <p>{currentStep.content}</p>
            <div className="tutorial-navigation justify-content-center">
              <button className="btn btn-primary " onClick={nextStep}>
                Iniziamo
              </button>
            </div>
            <div className="step-indicator">
              {tutorialSteps.map((_, index) => (
                <span 
                  key={index} 
                  className={index === tutorialStep ? 'active' : ''}
                />
              ))}
            </div>
          </div>
        );
      }

      // Rest of your existing tutorial logic for targeted steps...
      const targetElement = document.getElementById(currentStep.target);
      if (!targetElement) {
        closeTutorial();
        return null;
      }

      const rect = targetElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Calculate position for tutorial card
      let cardStyle = {};
      const cardWidth = 300;
      const cardHeight = 180;
      const margin = 20;

      switch (currentStep.position) {
        case 'bottom':
          cardStyle = {
            top: Math.min(rect.bottom + margin, windowHeight - cardHeight - margin),
            left: Math.max(margin, Math.min(rect.left + rect.width/2 - cardWidth/2, windowWidth - cardWidth - margin))
          };
          break;
        case 'right':
          cardStyle = {
            top: Math.max(margin, Math.min(rect.top + rect.height/2 - cardHeight/2, windowHeight - cardHeight - margin)),
            left: Math.min(rect.right + margin, windowWidth - cardWidth - margin)
          };
          break;
        case 'left':
          cardStyle = {
            top: Math.max(margin, Math.min(rect.top + rect.height/2 - cardHeight/2, windowHeight - cardHeight - margin)),
            left: Math.max(margin, rect.left - cardWidth - margin)
          };
          break;
        default:
          cardStyle = {
            top: Math.min(rect.bottom + margin, windowHeight - cardHeight - margin),
            left: Math.max(margin, Math.min(rect.left, windowWidth - cardWidth - margin))
          };
      }

      return (
        <>
          <div 
            className="highlight-box"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          />
          
          <div 
            className="tutorial-card"
            style={cardStyle}
          >
            <h4>{currentStep.title}</h4>
            <p>{currentStep.content}</p>
            <div className="tutorial-navigation">
              {tutorialStep > 0 && (
                <button className="btn btn-outline-secondary mr-2" onClick={prevStep}>
                  Indietro
                </button>
              )}
              <button className="btn btn-primary" onClick={nextStep}>
                {tutorialStep === tutorialSteps.length - 1 ? 'Finito' : 'Prossimo'}
              </button>
            </div>
            <div className="step-indicator">
              {tutorialSteps.map((_, index) => (
                <span 
                  key={index} 
                  className={index === tutorialStep ? 'active' : ''}
                />
              ))}
            </div>
          </div>
        </>
      );
    })()}
  </div>
)}
        <div className="row mt-4 justify-content-center">
          <div className="col-md-4 text-center" id="next-activity">
            {!missingPreviousModule && attivita.length > 0 ? (
              attivita.map((act, index) =>
                ongoingAct ? (
                  <Link
                    to={`/Results/${classid}/${programmateID}/${pathArg}/${pathMod}/${act.id}`}
                    key={index}
                    className="card link-wrapper ongoing-activity"
                  >
                    <div className="custom-button2">
                      <div className="title">{act.nome}</div>
                      <div>
                        <b className="tipo-text">{act.tipo}</b>
                      </div>
                      <div className="description">{act.descrizione}</div>
                      <div className="ongoing-content">
                        <span className="badge">Attività in corso</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    onClick={handleClick}
                    key={index}
                    className="card link-wrapper queued-activity"
                  >
                    <div className="custom-button2">
                      <div className="title">{act.nome}</div>
                      <div>
                        <b className="tipo-text">{act.tipo}</b>
                      </div>
                      <div className="description">{act.descrizione}</div>
                      <div className="not-ongoing-content">
                        <span className="badge">Avvia Attività</span>
                      </div>
                    </div>
                  </Link>
                )
              )
            ) : (
              allActivitiesCompleted ? (
                <div className="card link-wrapper">
                  <div className="custom-button2">
                    <div className="circle-button-container">
                      <div className="circle-button completed">
                        <FontAwesomeIcon icon={faCheck} />
                      </div>
                      <span className="tooltip">Hai svolto tutte le attività!</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to={`/Start_Module/${classid}`} className="card link-wrapper">
                  <div className="custom-button2">
                    <div className="circle-button-container">
                      <div className="circle-button">
                        <h1 className="circle-button-text">+</h1>
                      </div>
                      <span className="tooltip">
                        {missingPreviousModule 
                          ? "Completa prima un'attività del modulo precedente!" 
                          : "Pianifica la prossima attività!"}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
        <div className="row mt-4 justify-content-center">
          <div className="col-md-3">
            <Link to={`/Start_Module/${classid}`} className="card link-wrapper" id="plan-activity">
              <div className="custom-button">
                <div className="title">Programma un'attività</div>
              </div>
            </Link>
            <Link
              to={`/Manage_Activity/${classid}`}
              className="card link-wrapper"
              id="manage-activities"
            >
              <div className="custom-button">
                <div className="title">Gestisci attività in programma</div>
              </div>
            </Link>
          </div>
          <div className="col-md-2 d-flex justify-content-center">
            <div className="vertical-divider"></div>
          </div>
          <div className="col-md-3">
            <Link
              to={`/PastActivities/${classid}`}
              className="card link-wrapper"
              id="completed-activities"
            >
              <div className="custom-button">
                <div className="title">Attività Concluse</div>
              </div>
            </Link>
            <Link to={`/Class_List/${classid}`} className="card link-wrapper" id="class-management">
              <div className="custom-button">
                <div className="title">Classe</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Avvio Attività</Modal.Title>
        </Modal.Header>
        <Modal.Body>Sei sicuro di voler avviare questa attività?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Annulla
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              const now = new Date();
              const dataToUpdate = {
                attivazione:
                  `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}/${String(now.getDate()).padStart(2, "0")}` +
                  ` ${String(now.getHours()).padStart(2, "0")}:${String(
                    now.getMinutes()
                  ).padStart(2, "0")}`,
                path: pathArg + "/" + pathMod + "/" + pathAtt,
                ...(programmate[0].isCompetitive !== undefined && { isCompetitive: programmate[0].isCompetitive }),
              };

              updateDatabase(dataToUpdate);
              await publishMessage(classid, {
                timestamp: dayjs().format("YYYY/MM/DD HH:mm"),
                message: "programmate",
              });

              setShowConfirmModal(false);
              setShowSuccessModal(true);
            }}
          >
            Conferma
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Operazione Completata</Modal.Title>
        </Modal.Header>
        <Modal.Body>Attività avviata con successo!</Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false);
              window.location.reload();
            }}
          >
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};

// Helper function to position highlight boxes
function getHighlightPosition(targetId) {
  const element = document.getElementById(targetId);
  if (!element) return { display: 'none' };
  
  const rect = element.getBoundingClientRect();
  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: '2px solid rgba(0, 123, 255, 0.5)',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 123, 255, 0.2)',
    pointerEvents: 'none'
  };
}

export default Classroom;