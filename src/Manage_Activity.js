import { useState, useEffect } from "react";
import { Card, Button, Modal } from "react-bootstrap";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  getClassi,
  getProgrammate,
  getAttivita,
  writeProgrammate,
  getArgomenti,
  publishMessage,
  deleteProgrammate,
} from "./firebaseConfig";

const dayjs = require("dayjs");

export default function ActivityManager() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { classid } = useParams();
  const [programmateID, setProgrammateID] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  // Switch condition to control arrow buttons visibility
  const showArrowButtons = false; // Change to true when you want to show them

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const classi = await getClassi();
        const myClasse = classi.find((c) => c.id === classid);
        if (!myClasse) throw new Error("Class not found");

        setProgrammateID(myClasse.programmate);

        const programmate = await getProgrammate(myClasse.programmate);

        const validProgs = programmate.filter(
          (p) => !p.chiusura && !p.attivazione && p.id.startsWith('att')
        );

        let activitiesByModule = {};
        for (let program of validProgs) {
          const [pArg, pMod, pAtt] = program.path.split("/");
          const att = await getAttivita(`${pArg}/moduli/${pMod}/attivita/`);
          const filteredActivities = att
            .filter((a) => a.id === pAtt)
            .map((a) => ({
              id: pAtt,
              name: a.nome,
              descrizione: a.descrizione,
              arg: pArg,
              mod: pMod,
              priority: program.priority || 999,
              programId: program.id,
              path: program.path,
              isCompetitive: program.isCompetitive,
            }));

          if (!activitiesByModule[pArg]) activitiesByModule[pArg] = {};
          if (!activitiesByModule[pArg][pMod])
            activitiesByModule[pArg][pMod] = [];
          activitiesByModule[pArg][pMod].push(...filteredActivities);
        }

        const argomenti = await getArgomenti();

        const formattedData = Object.entries(activitiesByModule).map(
          ([arg, mods]) => {
            const matchingArgomento = argomenti.find((a) => a.id === arg);
            const argNumber = parseInt(arg.match(/\d+/)[0], 10);

            const title = matchingArgomento
              ? `Argomento ${argNumber+1}: ${matchingArgomento.nome}`
              : `Argomento ${argNumber+1}: Unknown`;

            return {
              id: arg,
              title: title,
              modules: Object.entries(mods).map(([mod, acts]) => {
                const matchingModulo = matchingArgomento?.moduli?.[mod];
                const modNumber = parseInt(mod.match(/\d+/)[0], 10);

                const moduloTitle = matchingModulo
                  ? `Modulo ${modNumber}: ${matchingModulo.nome}`
                  : `Modulo ${modNumber}: Unknown`;

                return {
                  id: mod,
                  title: moduloTitle,
                  activities: acts.sort((a, b) => a.priority - b.priority),
                };
              }),
            };
          }
        );

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classid]);

  const moveActivity = async (argId, modId, index, direction) => {
    const newIndex = index + direction;

    const arg = data.find((arg) => arg.id === argId);
    if (!arg) return;

    const mod = arg.modules.find((mod) => mod.id === modId);
    if (!mod) return;

    if (newIndex < 0 || newIndex >= mod.activities.length) return;

    const updatedData = data.map((arg) => {
      if (arg.id !== argId) return arg;
      return {
        ...arg,
        modules: arg.modules.map((mod) => {
          if (mod.id !== modId) return mod;
          const newActivities = [...mod.activities];
          [newActivities[index], newActivities[newIndex]] = [
            newActivities[newIndex],
            newActivities[index],
          ];
          return { ...mod, activities: newActivities };
        }),
      };
    });

    const activity1 = updatedData
      .find((arg) => arg.id === argId)
      .modules.find((mod) => mod.id === modId).activities[index];
    const activity2 = updatedData
      .find((arg) => arg.id === argId)
      .modules.find((mod) => mod.id === modId).activities[newIndex];

    try {
      await writeProgrammate(programmateID, activity1.programId, {
        priority: activity2.priority,
        path: activity1.path,
      });
      await writeProgrammate(programmateID, activity2.programId, {
        priority: activity1.priority,
        path: activity2.path,
      });

      setData(updatedData);

      await publishMessage(classid, {
        timestamp: dayjs().format("YYYY/MM/DD HH:mm"),
        message: "programmate",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error updating priorities:", error);
    }
  };

  const deleteActivity = async (argId, modId, activityId, programId) => {
    setActivityToDelete({ argId, modId, activityId, programId });
    setShowDeleteModal(true);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="d-flex justify-content-center min-vh-100 bg-light">
      <div className="p-4 w-100" style={{ maxWidth: "800px" }}>
        {data.length === 0 ? (
          <h1 className="display-1 welcome text-center">
            Nessuna attività in programma
          </h1>
        ) : (
          data
            .sort((a, b) => {
              const idA = parseInt(a.id.match(/\d+/)[0], 10);
              const idB = parseInt(b.id.match(/\d+/)[0], 10);
              return idA - idB;
            })
            .map((arg) => (
              <Card key={arg.id} className="mb-4 shadow-sm border-0">
                <Card.Body className="p-4">
                  <h2 className="text-2xl font-bold text-primary mb-4">
                    {arg.title}
                  </h2>
                  {arg.modules
                    .sort((a, b) => {
                      const idA = parseInt(a.id.match(/\d+/)[0], 10);
                      const idB = parseInt(b.id.match(/\d+/)[0], 10);
                      return idA - idB;
                    })
                    .map((mod) => (
                      <div key={mod.id} className="mb-4">
                        <h3 className="text-xl font-semibold text-secondary mb-3">
                          {mod.title}
                        </h3>
                        {mod.activities.map((act, index) => (
                          <div
                            key={act.id}
                            className="d-flex align-items-center justify-content-between p-3 mb-3 bg-white rounded shadow-sm"
                          >
                            <span className="text-lg">{act.name + (
  act.arg === "arg0" && act.mod === "mod1"
    ? ""
    : act.isCompetitive === true
      ? " - Competitivo"
      : act.isCompetitive === false
        ? " - Collaborativo"
        : ""
)}</span>
                            <div className="d-flex gap-2">
                              {showArrowButtons && (
                                <>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() =>
                                      moveActivity(arg.id, mod.id, index, -1)
                                    }
                                    disabled={index === 0}
                                    className="d-flex align-items-center justify-content-center"
                                    style={{ width: "32px", height: "32px" }}
                                  >
                                    <ArrowUp size={16} />
                                  </Button>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() =>
                                      moveActivity(arg.id, mod.id, index, 1)
                                    }
                                    disabled={index === mod.activities.length - 1}
                                    className="d-flex align-items-center justify-content-center"
                                    style={{ width: "32px", height: "32px" }}
                                  >
                                    <ArrowDown size={16} />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  deleteActivity(arg.id, mod.id, act.id, act.programId)
                                }
                                className="d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px" }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </Card.Body>
              </Card>
            ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma Cancellazione</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Sei sicuro di voler cancellare questa attività?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annulla
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                const { argId, modId, activityId, programId } = activityToDelete;

                // Delete the activity from Firebase
                await deleteProgrammate(programmateID, programId);

                // Update local state to remove the activity
                const updatedData = data.map((arg) => {
                  if (arg.id !== argId) return arg;
                  return {
                    ...arg,
                    modules: arg.modules.map((mod) => {
                      if (mod.id !== modId) return mod;
                      return {
                        ...mod,
                        activities: mod.activities.filter((act) => act.id !== activityId),
                      };
                    }),
                  };
                });

                setData(updatedData); // Update the UI without reloading
                setShowDeleteModal(false); // Close the delete confirmation modal
                setShowSuccessModal(true); // Show the success modal

                await publishMessage(classid, {
                  timestamp: dayjs().format("YYYY/MM/DD HH:mm"),
                  message: "programmate",
                });
              } catch (error) {
                console.error("Error deleting activity:", error);
              }
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
        <Modal.Body>Attività cancellata con successo!</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}