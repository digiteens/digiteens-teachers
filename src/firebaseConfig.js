import { initializeApp, getApps } from "firebase/app";
import { getDatabase, onValue, ref, set, get , push, runTransaction } from "firebase/database";
import { remove } from "firebase/database";
import { collection, getDocs } from 'firebase/firestore/lite';

require('datejs');

const firebaseConfig = {
  apiKey: "AIzaSyCJEJG2CBvUbty-l64i_An4OOF9K2Jykbs",
  authDomain: "digi-teens.firebaseapp.com",
  databaseURL: "https://digi-teens-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "digi-teens",
  storageBucket: "digi-teens.appspot.com",
  messagingSenderId: "344249149250",
  appId: "1:344249149250:web:4d491ed61b7d66d15e8adb",
  measurementId: "G-5MQM8LR1F1"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig); // Inizializza Firebase solo se non è già inizializzato
} else {
    app = getApps()[0]; // Se è già inizializzato, usa l'app esistente
}

const db = getDatabase(app);

export function writeTest(activityObject){
  const argRef = ref(db, 'argomenti/arg1/moduli/mod3/attivita/att3');

  set(argRef, activityObject)
  .then(() => {
    console.log('Dati salvati con successo!');
  })
  .catch((error) => {
    console.error('Errore nel salvataggio dei dati:', error);
  });
}

export async function getTest() {
  const myref = ref(db, 'argomenti/arg1/moduli/mod3/attivita/att3/');
  return new Promise((res, rej) => {
    onValue(myref, (snapshot) => {
      const data = snapshot.val();
      res(data);
    }, (error) => {
      rej(error);
    });
  });
}

export async function getActivities() {
  const myref = ref(db, 'argomenti/arg1/');
  return new Promise((res, rej) => {
    onValue(myref, (snapshot) => {
      const data = snapshot.val();
      res(data);
    }, (error) => {
      rej(error);
    });
  });
}

export async function getArgomenti() {
  const myref = ref(db, 'argomenti');
  try{
    const snapshot = await get(myref);
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  }
  catch(error){
    throw error;
  }
}

export async function getClassi() {
  const myref = ref(db, 'classi');
  try{
    const snapshot = await get(myref);
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  }
  catch(error){
    throw error;
  }
}

export async function getClasse(idClass) {
  const myref = ref(db, 'classi/' + idClass);
  try{
    const snapshot = await get(myref);
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  }
  catch(error){
    throw error;
  }
}

export async function getUtenti() {
  const myref = ref(db, 'utenti');
  try{
    const snapshot = await get(myref);
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  }
  catch(error){
    throw error;
  }
}

export async function getUtentiFromID(idUser) {
  const myref = ref(db, 'utenti/' + idUser);
  try{
    const snapshot = await get(myref);
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  }
  catch(error){
    throw error;
  }
}

export async function getProgrammate(idProgrammate) {
  const myref = ref(db, 'programmate/' + idProgrammate);
  try {
    const snapshot = await get(myref);
    const data = snapshot.val();

    // Check if data is null or undefined
    if (!data) {
      return []; // Return an empty array if no data is found
    }

    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })).sort((a, b) => {
      if (a.attivazione !== undefined && b.attivazione !== undefined)
        return Date.parse(a.attivazione) - Date.parse(b.attivazione); // Fix: Use subtraction for comparison
      else if (a.attivazione)
        return -1;
      else
        return 1;
    });
  } catch (error) {
    throw error; // Re-throw the error for the caller to handle
  }
}

export async function getAttivita(pathAttivita) {
  const myref = ref(db, 'argomenti/' + pathAttivita);
  try{
    const snapshot = await get(myref);
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  }
  catch(error){
    throw error;
  }
}

export async function getProgrammateModuli(idProgrammate) {
  const myref = ref(db, 'programmate_moduli/' + idProgrammate);
  try{
    const snapshot = await get(myref);
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })).sort((a, b) => {
      if(a.attivazione !== undefined && b.attivazione !== undefined)
        return Date.compare(Date.parse(a.attivazione), Date.parse(b.attivazione));
      else if(a.attivazione)
        return -1;
      else
        return 1;
    });
  }
  catch(error){
    throw error;
  }
}

export function writeProgrammateModuli(pathProg, modID, activityObject){
  const argRef = ref(db, 'programmate_moduli/' + pathProg + '/' + modID);

  set(argRef, activityObject)
  .then(() => {
    console.log('Dati salvati con successo!');
  })
  .catch((error) => {
    console.error('Errore nel salvataggio dei dati:', error);
  });
}

export function writeProgrammate(pathProg, attID, activityObject){
  const argRef = ref(db, 'programmate/' + pathProg + '/' + attID);

  set(argRef, activityObject)
  .then(() => {
    console.log('Dati salvati con successo!');
  })
  .catch((error) => {
    console.error('Errore nel salvataggio dei dati:', error);
  });
}

export const publishMessage = async (channel, message) => {
  if (!channel) return;

  const messagesRef = ref(db, "pubsub/" + channel + "/messages");
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, {
    message,
    timestamp: Date.now(),
  });
  console.log("Messaggio pubblicato:", message);
};

export async function deleteProgrammate(programmateID, programId) {
  const programmateRef = ref(db, `programmate/${programmateID}/${programId}`);
  try {
    await remove(programmateRef);
    console.log("Activity deleted successfully!");
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

export async function getUserClassFromId(uid) {
  const myref = ref(db, 'utenti/' + uid);
  try{
    const snapshot = await get(myref);
    const user = snapshot.val();
    const classref = ref(db, 'classi/' + user.classe);
    const classeSnapshot = await get(classref);
    const classe = classeSnapshot.val();
    return {user: user, classe: classe};
  }
  catch(error){
    throw error;
  }
}

// Set tutorial completion status (RTDB version)
export const setTutorialCompletion = async (programmateId, hasSeen) => {
  const tutorialRef = ref(db, `programmate/${programmateId}/hasSeenClassroomTutorial`);
  await set(tutorialRef, hasSeen);
};

// Get tutorial status (RTDB version)
export const getTutorialStatus = async (programmateId) => {
  const tutorialRef = ref(db, `programmate/${programmateId}/hasSeenClassroomTutorial`);
  try {
    const snapshot = await get(tutorialRef);
    return snapshot.exists() ? snapshot.val() : false;
  } catch (error) {
    console.error("Error getting tutorial status:", error);
    return false; // Default to false if error occurs
  }
};

// Check if planning tutorial was seen
export const getPlanningTutorialStatus = async (programmateId) => {
  const tutorialRef = ref(db, `programmate/${programmateId}/hasSeenPlanningTutorial`);
  const snapshot = await get(tutorialRef);
  return snapshot.exists() ? snapshot.val() : false;
};

// Mark planning tutorial as seen
export const setPlanningTutorialSeen = async (programmateId) => {
  await set(ref(db, `programmate/${programmateId}/hasSeenPlanningTutorial`), true);
};