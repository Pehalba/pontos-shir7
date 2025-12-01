// DataStore usando Firebase para COLABORADORES / PONTOS / RESGATES / AJUSTES / TAREFAS

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
  updateDoc,
  query,
  where
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

// ===================== ATIVIDADES / PONTOS =====================

export async function getActivitiesByCollaborator(collaboratorId) {
  const q = query(
    collection(db, 'activities'),
    where('collaboratorId', '==', collaboratorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addActivity(activityObject) {
  const data = {
    collaboratorId: activityObject.collaboratorId,
    type: activityObject.type,
    points: activityObject.points,
    date: activityObject.date || new Date().toISOString(),
    description: activityObject.description || ''
  };
  const ref = await addDoc(collection(db, 'activities'), data);
  return { id: ref.id, ...data };
}

// ===================== RESGATES =====================

export async function getRedemptionsByCollaborator(collaboratorId) {
  const q = query(
    collection(db, 'redemptions'),
    where('collaboratorId', '==', collaboratorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addRedemption(redemptionObject) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;

  const data = {
    collaboratorId: redemptionObject.collaboratorId,
    product: redemptionObject.product,
    shirtName: redemptionObject.shirtName || null,
    personalization: redemptionObject.personalization || false,
    name: redemptionObject.name || null,
    size: redemptionObject.size || null,
    pointsCost: redemptionObject.pointsCost,
    status: redemptionObject.status || 'solicitado',
    date: redemptionObject.date || new Date().toISOString(),
    month: redemptionObject.month || month
  };

  const ref = await addDoc(collection(db, 'redemptions'), data);
  return { id: ref.id, ...data };
}

// ===================== AJUSTES MANUAIS =====================

export async function getAdjustmentsByCollaborator(collaboratorId) {
  const q = query(
    collection(db, 'adjustments'),
    where('collaboratorId', '==', collaboratorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addAdjustment(adjustmentObject) {
  const data = {
    collaboratorId: adjustmentObject.collaboratorId,
    type: adjustmentObject.type,
    points: adjustmentObject.points,
    date: adjustmentObject.date || new Date().toISOString(),
    reason: adjustmentObject.reason || ''
  };
  const ref = await addDoc(collection(db, 'adjustments'), data);
  return { id: ref.id, ...data };
}

// ===================== CÁLCULOS =====================

export async function calculateCollaboratorBalance(collaboratorId) {
  const [activities, redemptions, adjustments] = await Promise.all([
    getActivitiesByCollaborator(collaboratorId),
    getRedemptionsByCollaborator(collaboratorId),
    getAdjustmentsByCollaborator(collaboratorId)
  ]);

  let balance = 0;

  activities.forEach(a => {
    balance += a.points || 0;
  });

  redemptions.forEach(r => {
    balance -= r.pointsCost || 0;
  });

  adjustments.forEach(adj => {
    balance += adj.points || 0;
  });

  return Math.max(0, balance);
}

export async function calculateMonthPoints(collaboratorId) {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;

  const [activities, adjustments] = await Promise.all([
    getActivitiesByCollaborator(collaboratorId),
    getAdjustmentsByCollaborator(collaboratorId)
  ]);

  let points = 0;

  activities.forEach(activity => {
    const d = new Date(activity.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (m === monthStr) {
      points += activity.points || 0;
    }
  });

  adjustments.forEach(adjustment => {
    const d = new Date(adjustment.date);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (m === monthStr && adjustment.points > 0) {
      points += adjustment.points;
    }
  });

  return points;
}

export async function countMonthlyRedemptions(collaboratorId) {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;

  const reds = await getRedemptionsByCollaborator(collaboratorId);
  return reds.filter(r => r.month === monthStr).length;
}

// ===================== CONFIGURAÇÃO DE TAREFAS (CHECKLIST / FÁCEIS / ETC) =====================

const TASKS_COLLECTION = 'tasks';

// Busca tarefas de um tipo (checklist / easy / intermediate / hard)
export async function getTasksConfigByType(type) {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('type', '==', type)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(t => !t.deleted) // Filtra deletados no código
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

// Cria nova tarefa de configuração
export async function addTaskConfig(task) {
  const { type, title, points, order } = task;
  const data = {
    type,
    title,
    points: typeof points === 'number' ? points : null,
    order: typeof order === 'number' ? order : 0,
    deleted: false,
    createdAt: new Date().toISOString(),
  };

  const ref = await addDoc(collection(db, TASKS_COLLECTION), data);
  return { id: ref.id, ...data };
}

// Atualiza campos de uma tarefa de configuração
export async function updateTaskConfig(id, updates) {
  const ref = doc(db, TASKS_COLLECTION, id);
  await updateDoc(ref, updates);
}

// Marca tarefa como removida (soft delete)
export async function deleteTaskConfig(id) {
  const ref = doc(db, TASKS_COLLECTION, id);
  await updateDoc(ref, { deleted: true });
}


