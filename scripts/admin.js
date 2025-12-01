/**
 * Sistema de Administração - SHIR7 (Firebase para colaboradores)
 */

import {
  getCollaborators,
  addCollaborator,
  updateCollaborator,
  getCollaboratorById,
} from "./dataStore.firebase.js";

const ADMIN_PASSWORD = "123456";

/**
 * Verifica se a senha do admin está correta
 */
export function checkAdminPassword(password) {
  return password === ADMIN_PASSWORD;
}

/**
 * Inicializa a página de admin
 */
async function init() {
  await renderCollaboratorsList();
  setupEventListeners();
}

/**
 * Renderiza a lista de colaboradores
 */
async function renderCollaboratorsList() {
  const container = document.getElementById("collaboratorsList");
  if (!container) return;

  container.innerHTML =
    '<p class="empty-message">Carregando colaboradores...</p>';

  let collaborators = [];
  try {
    collaborators = await getCollaborators();
  } catch (error) {
    console.error("Erro ao carregar colaboradores do Firebase:", error);
    container.innerHTML =
      '<p class="empty-message">Erro ao carregar colaboradores.</p>';
    return;
  }

  container.innerHTML = "";

  if (collaborators.length === 0) {
    container.innerHTML =
      '<p class="empty-message">Nenhum colaborador cadastrado ainda.</p>';
    return;
  }

  collaborators.forEach((collab) => {
    const card = document.createElement("div");
    card.className = "collaborator-card";
    card.innerHTML = `
            <div class="collaborator-card__info">
                <h3 class="collaborator-card__name">${collab.name}</h3>
                <span class="collaborator-card__status ${
                  collab.active
                    ? "collaborator-card__status--active"
                    : "collaborator-card__status--inactive"
                }">
                    ${collab.active ? "Ativo" : "Inativo"}
                </span>
            </div>
            <div class="collaborator-card__actions">
                <button class="btn btn--primary" data-action="manage" data-id="${
                  collab.id
                }">Gerenciar</button>
                <button class="btn btn--secondary" data-action="toggle" data-id="${
                  collab.id
                }">
                    ${collab.active ? "Desativar" : "Ativar"}
                </button>
                <button class="btn btn--secondary" data-action="edit" data-id="${
                  collab.id
                }">Editar</button>
            </div>
        `;
    container.appendChild(card);
  });
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
  // Botão adicionar colaborador
  const addBtn = document.getElementById("addCollaboratorBtn");
  if (addBtn) {
    addBtn.addEventListener("click", showAddCollaboratorModal);
  }

  // Botões dos cards de colaboradores
  document.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;

    if (action === "manage" && id) {
      window.location.href = `admin_colaborador.html?id=${id}`;
    } else if (action === "toggle" && id) {
      toggleCollaborator(id);
    } else if (action === "edit" && id) {
      editCollaborator(id);
    }
  });
}

/**
 * Alterna status ativo/inativo do colaborador
 */
async function toggleCollaborator(id) {
  const collab = await getCollaboratorById(id);
  if (collab) {
    await updateCollaborator(id, { active: !collab.active });
    renderCollaboratorsList();
  }
}

/**
 * Edita o nome do colaborador
 */
async function editCollaborator(id) {
  const collab = await getCollaboratorById(id);
  if (!collab) return;

  const newName = prompt("Digite o novo nome:", collab.name);
  if (newName && newName.trim()) {
    await updateCollaborator(id, { name: newName.trim() });
    renderCollaboratorsList();
  }
}

/**
 * Mostra modal para adicionar colaborador
 */
async function showAddCollaboratorModal() {
  const name = prompt("Digite o nome do novo colaborador:");
  if (name && name.trim()) {
    await addCollaborator({ name: name.trim(), active: true });
    renderCollaboratorsList();
  }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
