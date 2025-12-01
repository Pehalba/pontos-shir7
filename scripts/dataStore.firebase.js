// DataStore usando Firebase para COLABORADORES (primeira etapa de migração)

import { firebaseConfig } from './firebaseConfig.js';
import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';

// Inicializa Firebase / Firestore uma única vez
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================== COLABORADORES (Firebase) =====================

export async function getCollaborators() {
  const snap = await getDocs(collection(db, 'collaborators'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCollaborator(collabData) {
  const ref = await addDoc(collection(db, 'collaborators'), {
    name: collabData.name,
    active: collabData.active ?? true,
    createdAt: new Date().toISOString()
  });
  return { id: ref.id, ...collabData };
}

export async function updateCollaborator(id, newData) {
  const ref = doc(db, 'collaborators', id);
  await updateDoc(ref, newData);
}

export async function getCollaboratorById(id) {
  const ref = doc(db, 'collaborators', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// Sessão continua em localStorage (simples)
const CURRENT_COLLABORATOR_KEY = 'shir7_current_collaborator';

export function setCurrentCollaborator(collaboratorId) {
  localStorage.setItem(CURRENT_COLLABORATOR_KEY, collaboratorId);
}

export async function getCurrentCollaborator() {
  const id = localStorage.getItem(CURRENT_COLLABORATOR_KEY);
  if (!id) return null;
  return await getCollaboratorById(id);
}


