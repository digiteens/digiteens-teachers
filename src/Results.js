// src/Results.js
import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  writeTest,
  getTest,
  getActivities,
  getArgomenti,
  getProgrammate,
  getUtentiFromID,
  writeProgrammate,
  getUtenti,
  publishMessage,
} from "./firebaseConfig";
import { ListGroup } from "react-bootstrap";
import BingoActivity from "./BingoActivity.js";
import ForestActivity from "./ForestActivity.js";
import DailyReflectionActivity from "./DailyReflectionActivity.js";
import WordCloudComponent from "./WordCloudComponent";

// Add these imports at the top
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

const dayjs = require("dayjs");

const Results = () => {
  const { classid, progid, argid, modid, actid } = useParams();
  const originalPath = argid + "/" + modid + "/" + actid;
  const [loading, setLoading] = useState(true);
  const [argomenti, setArgomenti] = useState([]);
  const [moduli, setModuli] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [programmate, setProgrammate] = useState([]);
  const [risultati, setRisultati] = useState([]);
  const [utenti, setUtenti] = useState([]);
  const [activityId, setActivityId] = useState(0);
  const [chiusura, setChiusura] = useState(false);
  const [oldKey, setOldKey] = useState("");
  const [domande, setDomande] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const [modalContent, setModalContent] = useState(null);

  const sampleAnswers = [
    "React è una libreria JavaScript",
    "I componenti React sono riutilizzabili",
    "Lo stato in React è molto importante",
    "React utilizza il Virtual DOM",
    "react react",
    "react",
  ];

  //GRAPH COMPONENTS:
  // Register ChartJS components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const getStudentsInScoreRange = (min, max) => {
    return risultati
      .filter((res) => res.punteggio >= min && res.punteggio <= max)
      .map(
        (res) => `${getNomeUserById(res.user)} ${getCognomeUserById(res.user)}`
      );
  };

  const getStudentsWithAnswer = (questionIndex, answer) => {
    return risultati
      .filter((res) => {
        const studentAnswer = res.answers?.[`q${questionIndex + 1}`]?.message;
        return (
          studentAnswer &&
          studentAnswer.trim().toLowerCase() === answer.toLowerCase()
        );
      })
      .map(
        (res) => `${getNomeUserById(res.user)} ${getCognomeUserById(res.user)}`
      );
  };

  //calcolo punteggi
  const calculateMeanScore = () => {
    if (risultati.length === 0) return 0;

    const sum = risultati.reduce((total, res) => total + res.punteggio, 0);
    return (sum / risultati.length).toFixed(2); // Returns mean with 2 decimal places
  };

  const calculateIndividualScores = () => {
    const scoreCounts = {};

    risultati.forEach((res) => {
      const score = res.punteggio;
      scoreCounts[score] = (scoreCounts[score] || 0) + 1;
    });

    const labels = Object.keys(scoreCounts).sort((a, b) => a - b);
    const data = labels.map((label) => scoreCounts[label]);

    return {
      labels: labels.map((label) => `Punteggio ${label}`),
      data: data,
    };
  };

  const calculateAnswerFrequencies = (questionIndex) => {
    const answerCounts = {};

    risultati.forEach((res) => {
      const answer = res.answers?.[`q${questionIndex + 1}`]?.message;
      if (answer) {
        // Group similar answers (case insensitive)
        const normalizedAnswer = answer.trim().toLowerCase();
        answerCounts[normalizedAnswer] =
          (answerCounts[normalizedAnswer] || 0) + 1;
      }
    });

    // Sort by frequency (highest first)
    const sortedEntries = Object.entries(answerCounts).sort(
      (a, b) => b[1] - a[1]
    );

    return {
      labels: sortedEntries.map(([answer]) =>
        answer.length > 10 ? `${answer.substring(0, 10)}...` : answer
      ),
      data: sortedEntries.map(([_, count]) => count),
      fullAnswers: sortedEntries.map(([answer]) => answer),
    };
  };

  //calcolo range SAS
  const calculateScoreRanges = () => {
    const scoreRanges = [
      { min: 0, max: 20, label: "0-20" },
      { min: 21, max: 30, label: "21-30" },
      { min: 31, max: 40, label: "31-40" },
      { min: 41, max: 60, label: "41-60" },
    ];

    const rangeCounts = scoreRanges.map((range) => ({
      ...range,
      count: 0,
    }));

    risultati.forEach((res) => {
      const score = res.punteggio;
      const range = rangeCounts.find((r) => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    return {
      labels: rangeCounts.map((range) => range.label),
      data: rangeCounts.map((range) => range.count),
    };
  };

  //calcolo range SAS
  const calculateScoreRangesStorytelling = () => {
    const scoreRanges = [
      {
        min: -10,
        max: -6,
        label: "Il tuo rapporto con la tecnologia lascia a desiderare",
      },
      { min: -5, max: -1, label: "Hai un rapporto discreto con la tecnologia" },
      { min: 0, max: 5, label: "Hai un rapporto molto sano con la tecnologia" },
    ];

    const rangeCounts = scoreRanges.map((range) => ({
      ...range,
      count: 0,
    }));

    risultati.forEach((res) => {
      const score = res.punteggio;
      const range = rangeCounts.find((r) => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    return {
      labels: rangeCounts.map((range) => range.label),
      data: rangeCounts.map((range) => range.count),
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Risultati (Media: ${calculateMeanScore()})`,
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          afterBody: (context) => {
            const label = context[0].label;
            const students = getStudentsInScoreRange(
              parseInt(label.split("-")[0]),
              parseInt(label.split("-")[1])
            );
            return ["Studenti:", ...students];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  //chart per le singole domande
  const QuestionChart = ({ questionIndex }) => {
    const { labels, data, fullAnswers } =
      calculateAnswerFrequencies(questionIndex);

    return (
      <div style={{ height: "300px" }}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Numero di risposte",
                data,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: {
                  autoSkip: false,
                  padding: 10,
                  font: {
                    size: 12,
                    family:
                      "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                  },
                  callback: function (value, index) {
                    // Return the full label from your original data
                    return fullAnswers[index] || labels[index];
                  },
                },
                grid: {
                  drawOnChartArea: false,
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  title: (tooltipItems) => {
                    const index = tooltipItems[0].dataIndex;
                    return fullAnswers[index];
                  },
                  afterBody: (tooltipItems) => {
                    const index = tooltipItems[0].dataIndex;
                    const answer = fullAnswers[index];
                    const students = risultati
                      .filter((res) => {
                        const studentAnswer =
                          res.answers?.[`q${questionIndex + 1}`]?.message;
                        return (
                          studentAnswer &&
                          studentAnswer.trim().toLowerCase() ===
                            answer.toLowerCase()
                        );
                      })
                      .map(
                        (res) =>
                          `${getNomeUserById(res.user)} ${getCognomeUserById(
                            res.user
                          )}`
                      );
                    return ["Studenti:", ...students];
                  },
                },
              },
              legend: { display: false },
              title: {
                display: true,
                text: `Domanda ${questionIndex + 1}`,
              },
            },
          }}
        />
      </div>
    );
  };

  //bottone per chiusura attività
  const handleClick = (attivita) => {
    const now = new Date();

    const dataToUpdate = {
      attivazione: programmate[0].attivazione,
      chiusura:
        `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}/${String(now.getDate()).padStart(2, "0")}` +
        ` ${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`,
      risultati: programmate[0].risultati ?? {},
      path: `${attivita.arg}/${attivita.mod}/${attivita.id}`,
      ...(programmate[0].isCompetitive !== undefined && {
        isCompetitive: programmate[0].isCompetitive,
      }),
    };

    console.log("passed");
    console.log(dataToUpdate);

    publishMessage(classid, {
      timestamp: dayjs().format("YYYY/MM/DD HH:mm"),
      message: "programmate",
    });

    updateDatabase(dataToUpdate);
  };

  const updateDatabase = (data) => {
    writeProgrammate(progid, oldKey, data);
  };

  useEffect(() => {
    setLoading(true);

    //Load dati Argomento, Modulo, Attività
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
        if (myMods.length > 0) setModuli(myMods);

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
              stages: act[ac].stages,
              tasks: act[ac].tasks,
              mod: m.id,
              arg: m.arg,
              numQuestions: act[ac].numQuestions,
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
  }, [progid]);

  useEffect(() => {
    //Load dati programmate
    const fetchProgrammate = async () => {
      const programmateList = [];
      try {
        const prog = await getProgrammate(progid);

        const myProgs = prog
          .filter((p) => p.path === originalPath)
          .map((p) => ({
            id: p.id,
            attivazione: p.attivazione,
            chiusura: p.chiusura,
            isCompetitive: p.isCompetitive,
            risultati: p.risultati,
          }));
        programmateList.push(...myProgs);
        setProgrammate(programmateList);

        if (programmateList[0].risultati != undefined)
          setRisultati(Object.values(programmateList[0].risultati));

        if (programmateList[0].chiusura === undefined) setChiusura(true);

        setOldKey(programmateList[0].id);
        if (attivita[0].tipo == "storytelling") {
          setDomande(Object.values(attivita[0].stages));
        } else if (attivita[0].domande) {
          setDomande(Object.values(attivita[0].domande));
        }
      } catch (error) {
        console.error(`Error`, error);
      }
    };

    if (attivita.length > 0) {
      fetchProgrammate();
    }
  }, [attivita]);

  useEffect(() => {
    //Load dati studenti
    const fetchUsers = async () => {
      const userList = [];
      try {
        const users = await getUtenti();

        const myUsers = users
          .filter((u) => u.ruolo === "studente")
          .map((u) => ({
            id: u.id,
            nome: u.nome,
            cognome: u.cognome,
            propic: u.propic,
            coverpic: u.coverpic,
            ruolo: u.ruolo,
            classe: u.classe,
          }));
        userList.push(...myUsers);
        setUtenti(userList);
      } catch (error) {
        console.error(`Error`, error);
      }
    };

    // More reliable trigger condition
    if (attivita && attivita.length > 0) {
      console.log("Activity data available, fetching users...");
      fetchUsers();
    } else {
      console.log("No activity data yet, skipping user fetch");
    }
  }, [attivita]);

  // Check path and set content when activity loads
  //Visione Consigliata
  useEffect(() => {
    if (attivita.length > 0) {
      const currentPath = `${attivita[0].arg}/${attivita[0].mod}`;

      if (currentPath === "arg0/mod1") {
        setModalContent({
          title: "Visione Consigliata",
          body: (
            <>
              <p>
                Il documentario Netflix "The Social Dilemma" esplora il lato
                nascosto dei social media, mostrando come le piattaforme siano
                progettate per catturare la nostra attenzione e influenzare il
                nostro comportamento. Attraverso interviste con ex dipendenti di
                aziende come Facebook e Google, il film mette in luce i
                meccanismi dietro l’algoritmo, l’impatto sulla salute mentale e
                il rischio di dipendenza digitale.
              </p>
              <p>
                È una visione utile per comprendere meglio il concetto di
                Benessere Digitale e il ruolo che noi utenti possiamo avere nel
                costruire un rapporto più sano con la tecnologia.
              </p>
            </>
          ),
        });
      } else if (currentPath === "arg0/mod2") {
        setModalContent({
          title: "Lettura Consigliata",
          body: (
            <>
              <p>
                Il libro "Irresistibile" di Adam Alter analizza come molte delle
                tecnologie che usiamo ogni giorno – dai social media ai
                videogiochi – siano progettate per catturare la nostra
                attenzione e renderci dipendenti. Adam Alter, esperto di
                psicologia e marketing, spiega i meccanismi che ci spingono a
                controllare continuamente il telefono o a guardare “ancora un
                episodio” di una serie.
              </p>
              <p>
                Con esempi concreti e facili da capire, il libro aiuta a
                riconoscere questi schemi e a trovare strategie per un uso più
                consapevole della tecnologia.
              </p>
            </>
          ),
        });
      } else if (currentPath === "arg0/mod3") {
        setModalContent({
          title: "Lettura Consigliata",
          body: (
            <>
              <p>
                Il Ledger of Harms è un progetto del Center for Humane
                Technology che raccoglie ricerche e dati sugli effetti negativi
                della tecnologia a livello individuale, sociale e globale. È uno
                strumento utile per comprendere meglio come l’uso digitale possa
                influenzare il nostro benessere.
              </p>
              <p>
                Puoi esplorarlo online per vedere le diverse categorie di
                impatti e le prove scientifiche associate.
              </p>
            </>
          ),
        });
      }
    }
  }, [attivita]);

  if (loading) {
    return <div>Loading...</div>;
  }

  function getNomeUserById(id) {
    const user = utenti.find((user) => user.id === id);
    return user ? user.nome : "User not found";
  }

  function getCognomeUserById(id) {
    const user = utenti.find((user) => user.id === id);
    return user ? user.cognome : "User not found";
  }

  function getPropicUserById(id) {
    const user = utenti.find((user) => user.id === id);
    return user ? user.propic : undefined;
  }

  function getCoverpicUserById(id) {
    const user = utenti.find((user) => user.id === id);
    return user ? user.coverpic : undefined;
  }

  // Single Modal Component - Visione Consigliata
  const DynamicModal = () => (
    <Modal show={showModal} onHide={() => setShowModal(false)}>
      {modalContent && (
        <>
          <Modal.Header closeButton>
            <Modal.Title>{modalContent.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{modalContent.body}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Chiudi
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );

  return (
    <div className="container mt-5">
      {/* Info Modal */}
      <DynamicModal />

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Chiusura</Modal.Title>
        </Modal.Header>
        <Modal.Body>Sei sicuro di voler chiudere questa attività?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Annulla
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleClick(attivita[0]);
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
        <Modal.Body>Attività chiusa con successo!</Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false);
              window.location.href = `/Classroom/${classid}`;
            }}
          >
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Activity Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="col-11">
          <h1 className="h2 mb-2 font-weight-bold">{attivita[0].nome}</h1>
          <p className="text-muted mb-1">{attivita[0].tipo}</p>
          <p className="lead">{attivita[0].descrizione}</p>
        </div>
        <button className="questionTip-mark-btn" onClick={handleShowModal}>
          ?
        </button>
      </div>

      {/* SPUNTI DI RIFLESSIONE */}

      {`${attivita[0].arg}/${attivita[0].mod}` === "arg0/mod1" && (
        <div className="p-4">
          <h2 className="mb-4">
            Definizione di "Benessere Digitale", spunti di riflessione
          </h2>
          <ListGroup variant="flush">
            <ListGroup.Item className="border-0 py-2">
              <strong>Il mio rapporto con la tecnologia:</strong> Mi aiuta a
              vivere meglio o mi distrae da ciò che conta?
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Aspetti chiave del mio benessere digitale:</strong>
              <ul className="mt-2">
                <li>Equilibrio tra tempo online e offline</li>
                <li>Qualità delle interazioni digitali</li>
                <li>Gestione dell'attenzione</li>
              </ul>
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Non si tratta solo di tempo di utilizzo:</strong> Anche la
              qualità dell'esperienza digitale conta.
              <div className="mt-2">
                <span className="text-success">
                  ✓ Un'ora passata a imparare qualcosa di nuovo
                </span>{" "}
                vs.
                <span className="text-danger">
                  {" "}
                  ✗ Un'ora di scrolling passivo sui social
                </span>
              </div>
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Benessere Digitale come equilibrio dinamico:</strong> Non
              si tratta di eliminare la tecnologia, ma di usarla in modo che
              arricchisca la vita.
            </ListGroup.Item>
          </ListGroup>
        </div>
      )}

      {`${attivita[0].arg}/${attivita[0].mod}` === "arg0/mod2" && (
        <div className="p-4">
          <h2 className="mb-4">
            Strategie per un Benessere Digitale consapevole
          </h2>
          <ListGroup variant="flush">
            <ListGroup.Item className="border-0 py-2">
              <strong>Sii consapevole dei meccanismi di persuasione:</strong>{" "}
              Sapere come funzionano le tecnologie che usi ti aiuta a resistere
              alle loro strategie.
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Disattiva le notifiche non necessarie:</strong> Scegli
              consapevolmente quali interruzioni vuoi ricevere.
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>
                Sostituisci gli stimoli digitali con alternative più sane:
              </strong>
              <div className="mt-2">
                Se un'app ti porta a perdere tempo inutilmente, prova a
                sostituirla con attività che ti danno un beneficio reale:
                <ul className="mt-2">
                  <li className="text-success">✓ Lettura</li>
                  <li className="text-success">✓ Sport</li>
                  <li className="text-success">✓ Tempo con gli amici</li>
                </ul>
              </div>
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Fai delle "pause digitali":</strong> Sperimenta momenti
              della giornata o intere giornate senza dispositivi per capire
              meglio il tuo rapporto con la tecnologia.
            </ListGroup.Item>
          </ListGroup>
        </div>
      )}

      {`${attivita[0].arg}/${attivita[0].mod}` === "arg0/mod3" && (
        <div className="p-4">
          <h2 className="mb-4">
            Strategie pratiche per un uso consapevole della tecnologia
          </h2>
          <ListGroup variant="flush">
            <ListGroup.Item className="border-0 py-2">
              <strong>Pratica il self-monitoring (auto-monitoraggio):</strong>
              <ul className="mt-2">
                <li>
                  Controlla il tempo che trascorri sulle app e valuta se è in
                  linea con i tuoi obiettivi
                </li>
                <li>
                  Strumenti utili:
                  <span className="text-success">
                    {" "}
                    ✓ Benessere Digitale (Android)
                  </span>
                  ,
                  <span className="text-success">
                    {" "}
                    ✓ Tempo di Utilizzo (iPhone)
                  </span>
                </li>
              </ul>
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Esercita il self-control (auto-controllo):</strong>
              <ul className="mt-2">
                <li>
                  Decidi in anticipo il tempo da dedicare a social/videogiochi
                </li>
                <li>
                  Usa <span className="text-success">✓ timer</span> o{" "}
                  <span className="text-success">✓ app di blocco</span> per
                  rispettare i limiti
                </li>
              </ul>
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Riduci le notifiche distrattive:</strong> Disattiva quelle
              non essenziali per evitare interruzioni e migliorare la
              concentrazione.
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Sperimenta il digital detox:</strong> Prova:
              <ul className="mt-2">
                <li>
                  <span className="text-success">
                    ✓ Telefono fuori dalla camera da letto
                  </span>
                </li>
                <li>
                  <span className="text-success">
                    ✓ Momenti dedicati a esperienze offline
                  </span>
                </li>
              </ul>
            </ListGroup.Item>

            <ListGroup.Item className="border-0 py-2">
              <strong>Rifletti sul tuo utilizzo della tecnologia:</strong>
              <div className="mt-2">
                <span className="text-success">✓ Ti arricchisce?</span> vs.
                <span className="text-danger">
                  {" "}
                  ✗ Ti causa stress/insoddisfazione?
                </span>
                <div className="mt-2">
                  Modifica le abitudini per un rapporto più sano con il
                  digitale.
                </div>
              </div>
            </ListGroup.Item>
          </ListGroup>
        </div>
      )}

      {/* Conditional Rendering Based on attivita[0].tipo */}
      {console.log(programmate[0])}
      {attivita[0].tipo === "bingo" ? (
        <BingoActivity
          activityData={attivita[0]}
          studentsData={utenti.filter((u) => u.ruolo === "studente")}
          resultsData={programmate}
          loading={loading}
          classid={classid}
        />
      ) : attivita[0].tipo === "forest" ? ( // Add this condition
        <ForestActivity
          activityData={attivita[0]}
          studentsData={utenti.filter((u) => u.ruolo === "studente")}
          resultsData={programmate}
          loading={loading}
          classid={classid}
        />
      ) : attivita[0].tipo === "riflessionegiornaliera" ? (
        <DailyReflectionActivity
          activityData={attivita[0]}
          studentsData={utenti.filter((u) => u.ruolo === "studente")}
          resultsData={programmate}
          loading={loading}
          classid={classid}
        />
      ) : attivita[0].tipo === "storytelling" ? (
        <div className="row">
          {risultati.length > 0 && programmate[0].isCompetitive === true && (
            <div
              className="mb-4 p-3"
              style={{ background: "white", borderRadius: "0.5rem" }}
            >
              <Bar
                data={{
                  labels: calculateScoreRangesStorytelling().labels,
                  datasets: [
                    {
                      label: "Studenti",
                      data: calculateScoreRangesStorytelling().data,
                      backgroundColor: "rgba(75, 192, 192, 0.6)",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: {
                      display: true,
                      text: `Risultati (Media: ${calculateMeanScore()})`,
                      font: { size: 16 },
                    },
                    tooltip: {
                      callbacks: {
                        title: (tooltipItems) => {
                          return calculateScoreRangesStorytelling().labels[
                            tooltipItems[0].dataIndex
                          ];
                        },
                        afterBody: (tooltipItems) => {
                          const rangeIndex = tooltipItems[0].dataIndex;
                          const ranges = [
                            { min: -10, max: -6 },
                            { min: -5, max: -1 },
                            { min: 0, max: 5 },
                          ];
                          const range = ranges[rangeIndex];
                          const students = risultati
                            .filter(
                              (res) =>
                                res.punteggio >= range.min &&
                                res.punteggio <= range.max
                            )
                            .map(
                              (res) =>
                                `${getNomeUserById(
                                  res.user
                                )} ${getCognomeUserById(res.user)}`
                            );
                          return ["Studenti:", ...students];
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        precision: 0, // No decimal places
                      },
                      grid: {
                        drawBorder: false, // Cleaner design
                      },
                    },
                    x: {
                      ticks: {
                        autoSkip: false,
                        font: {
                          size: 12,
                          family: "'Helvetica Neue', sans-serif", // More readable font
                        },
                        padding: 15, // Space between labels and axis
                      },
                      grid: {
                        display: false, // Remove vertical grid lines
                      },
                    },
                  },
                }}
              />
            </div>
          )}
          {risultati.length > 0 && programmate[0].isCompetitive === false && (
            <div>
              <h3>Punteggio Medio Classe: {calculateMeanScore()}</h3>
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  color: "#388E3C",
                  margin: "10px 0",
                }}
              >
                {(() => {
                  const score = calculateMeanScore();
                  if (score >= -10 && score <= -6) {
                    return "Il tuo rapporto con la tecnologia lascia a desiderare";
                  } else if (score >= -5 && score <= -1) {
                    return "Hai un rapporto discreto con la tecnologia";
                  } else if (score >= 0 && score <= 5) {
                    return "Hai un rapporto molto sano con la tecnologia";
                  } else {
                    return "Punteggio non valido";
                  }
                })()}
              </div>
            </div>
          )}

          {/* FINAL RESULTS OF SINGLE STUDENTS - NOT DISPLAYING IT RIGHT NOW
          
          {risultati.map((res, index) => (
            <div className="col-md-6 card link-wrapper" key={index}>
              <div
                className="card"
                style={{
                  border: "3px solid #000",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  width: "100%",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    backgroundImage: `url('${
                      getCoverpicUserById(res.user)
                        ? getCoverpicUserById(res.user)
                        : "https://media.istockphoto.com/id/1392898737/vector/abstract-horizontal-background-with-colorful-waves.jpg?s=612x612&w=0&k=20&c=xxRagBOWElqfzxPho893QoNmB1HnAw9VM-UHkQhtih4="
                    }')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    height: "170px",
                    position: "relative",
                  }}
                >
                  <img
                    src={
                      getPropicUserById(res.user)
                        ? getPropicUserById(res.user)
                        : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                    }
                    alt="Profile"
                    style={{
                      position: "absolute",
                      bottom: "-50px",
                      left: "20px",
                      width: "130px",
                      height: "130px",
                    }}
                  />
                </div>

                <div
                  className="d-flex align-items-center"
                  style={{ padding: "10px" }}
                >
                  <div className="ms-5" style={{ marginLeft: "120px" }}>
                    <h5
                      className="title"
                      style={{
                        marginBottom: "20px",
                        marginLeft: "100px",
                        fontSize: "24px",
                        fontWeight: "bold",
                      }}
                    >
                      {getNomeUserById(res.user)} {getCognomeUserById(res.user)}
                    </h5>
                    <p className="description" style={{ margin: 0 }}>
                      {res.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}*/}

          {attivita[0].nome != "Avventura sul benessere digitale" && (
            <Accordion>
              {domande
                .slice(0, attivita[0].numQuestions ?? domande.length)
                .map((doma, index) => (
                  <Accordion.Item eventKey={index} key={index}>
                    <Accordion.Header>
                      Domanda {index + 1}: {doma.question}
                    </Accordion.Header>
                    <Accordion.Body>
                      {attivita[0].nome !=
                        "Brainstorming sul benessere digitale" && (
                        <div className="mt-3">
                          <QuestionChart questionIndex={index} />
                        </div>
                      )}

                      <br></br>

                      <div className="row">
                        {risultati != null &&
                          risultati.map((res, indexx) => (
                            <div
                              className="col-md-6 card link-wrapper"
                              key={indexx}
                            >
                              <div
                                className="card"
                                style={{
                                  border: "3px solid #000",
                                  borderRadius: "0.5rem",
                                  overflow: "hidden",
                                  width: "100%",
                                  maxWidth: "600px",
                                  margin: "0 auto",
                                }}
                              >
                                <div
                                  style={{
                                    backgroundImage: `url('${
                                      getCoverpicUserById(res.user)
                                        ? getCoverpicUserById(res.user)
                                        : "https://static.vecteezy.com/system/resources/previews/019/887/657/non_2x/simple-monochrome-lines-background-free-vector.jpg"
                                    }')`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    height: "170px",
                                    position: "relative",
                                  }}
                                >
                                  <img
                                    src={
                                      getPropicUserById(res.user)
                                        ? getPropicUserById(res.user)
                                        : "https://cdn-icons-png.flaticon.com/512/4869/4869736.png"
                                    }
                                    alt="Profile"
                                    style={{
                                      position: "absolute",
                                      bottom: "-50px",
                                      left: "20px",
                                      width: "130px",
                                      height: "130px",
                                    }}
                                  />
                                </div>

                                <div
                                  className="d-flex align-items-center"
                                  style={{ padding: "10px" }}
                                >
                                  <div
                                    className="ms-5"
                                    style={{ marginLeft: "120px" }}
                                  >
                                    <h5
                                      className="title"
                                      style={{
                                        marginBottom: "20px",
                                        marginLeft: "100px",
                                        fontSize: "24px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {getNomeUserById(res.user)}{" "}
                                      {getCognomeUserById(res.user)}
                                    </h5>
                                    <p
                                      className="description"
                                      style={{ margin: 0 }}
                                    >
                                      {res.answers?.[`q${index + 1}`]?.message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
            </Accordion>
          )}
        </div>
      ) : (
        // NOT STORYTELLING
        <div>
          {attivita[0].nome === "Brainstorming sul benessere digitale" && (
            <WordCloudComponent
              answers={risultati.flatMap((res) =>
                Object.values(res.answers).map((answer) => answer.message)
              )}
              colors={{
                border: "#3f51b5",
                text: "#212121",
              }}
            />
          )}
          {risultati.length > 0 &&
            attivita[0].nome != "Brainstorming sul benessere digitale" && (
              <div
                className="mb-4 p-3"
                style={{ background: "white", borderRadius: "0.5rem" }}
              >
                {attivita[0].nome ===
                "Valuta il tuo utilizzo dello smartphone" ? (
                  // SAS: Show ranges
                  <Bar
                    data={{
                      labels: calculateScoreRanges().labels,
                      datasets: [
                        {
                          label: "Studenti",
                          data: calculateScoreRanges().data,
                          backgroundColor: "rgba(75, 192, 192, 0.6)",
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: `Risultati (Media: ${calculateMeanScore()})`,
                        },
                        tooltip: {
                          callbacks: {
                            afterBody: (context) => {
                              const rangeLabel =
                                calculateScoreRanges().labels[
                                  context[0].dataIndex
                                ];
                              const [min, max] = rangeLabel
                                .split("-")
                                .map(Number);
                              const students = risultati
                                .filter(
                                  (res) =>
                                    res.punteggio >= min && res.punteggio <= max
                                )
                                .map(
                                  (res) =>
                                    `${getNomeUserById(
                                      res.user
                                    )} ${getCognomeUserById(res.user)}`
                                );
                              return ["Studenti:", ...students];
                            },
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  // Non-SAS: Show individual scores
                  <Bar
                    data={{
                      labels: calculateIndividualScores().labels,
                      datasets: [
                        {
                          label: "Studenti",
                          data: calculateIndividualScores().data,
                          backgroundColor: "rgba(54, 162, 235, 0.6)",
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          callbacks: {
                            afterBody: (context) => {
                              const score = parseInt(
                                calculateIndividualScores().labels[
                                  context[0].dataIndex
                                ].replace("Punteggio ", "")
                              );
                              const students = risultati
                                .filter((res) => res.punteggio === score)
                                .map(
                                  (res) =>
                                    `${getNomeUserById(
                                      res.user
                                    )} ${getCognomeUserById(res.user)}`
                                );
                              return ["Studenti:", ...students];
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>
            )}
          <Accordion>
            {domande
              .slice(0, attivita[0].numQuestions ?? domande.length)
              .map((doma, index) => (
                <Accordion.Item eventKey={index} key={index}>
                  <Accordion.Header>
                    Domanda {index + 1}: {doma.testo}
                  </Accordion.Header>
                  <Accordion.Body>
                    {attivita[0].nome !=
                      "Brainstorming sul benessere digitale" && (
                      <div className="mt-3">
                        <QuestionChart questionIndex={index} />
                      </div>
                    )}

                    <br></br>

                    <div className="row">
                      {risultati != null && risultati.length > 0 ? (
                        risultati.map((res, indexx) => (
                          <div
                            className="col-md-6 card link-wrapper"
                            key={indexx}
                          >
                            <div
                              className="card"
                              style={{
                                border: "3px solid #000",
                                borderRadius: "0.5rem",
                                overflow: "hidden",
                                width: "100%",
                                maxWidth: "600px",
                                margin: "0 auto",
                              }}
                            >
                              <div
                                style={{
                                  backgroundImage: `url('${
                                    getCoverpicUserById(res.user)
                                      ? getCoverpicUserById(res.user)
                                      : "https://static.vecteezy.com/system/resources/previews/019/887/657/non_2x/simple-monochrome-lines-background-free-vector.jpg"
                                  }')`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  height: "170px",
                                  position: "relative",
                                }}
                              >
                                <img
                                  src={
                                    getPropicUserById(res.user)
                                      ? getPropicUserById(res.user)
                                      : "https://cdn-icons-png.flaticon.com/512/4869/4869736.png"
                                  }
                                  alt="Profile"
                                  style={{
                                    position: "absolute",
                                    bottom: "-50px",
                                    left: "20px",
                                    width: "130px",
                                    height: "130px",
                                  }}
                                />
                              </div>

                              <div
                                className="d-flex align-items-center"
                                style={{ padding: "10px" }}
                              >
                                <div
                                  className="ms-5"
                                  style={{ marginLeft: "120px" }}
                                >
                                  <h5
                                    className="title"
                                    style={{
                                      marginBottom: "20px",
                                      marginLeft: "100px",
                                      fontSize: "24px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {getNomeUserById(res.user)}{" "}
                                    {getCognomeUserById(res.user)}
                                  </h5>
                                  <p
                                    className="description"
                                    style={{ margin: 0 }}
                                  >
                                    {res.answers[`q${index + 1}`].message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-12 text-center">
                          <p style={{ fontSize: "18px", fontWeight: "bold" }}>
                            Nessun risultato ancora disponibile!
                          </p>
                        </div>
                      )}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
          </Accordion>
        </div>
      )}

      <br></br>

      {chiusura === true ? (
        <div className="start-btn">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-secondary btn-end-act"
          >
            Chiudi attività
          </button>
        </div>
      ) : (
        <br></br>
      )}
      <br></br>
    </div>
  );
};

export default Results;
