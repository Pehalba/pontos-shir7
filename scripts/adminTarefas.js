/**
 * Gerenciamento de Tarefas - Admin
 * Agora usa Firebase (dataStore.firebase) para salvar a configuração
 * das tarefas de checklist/fáceis/intermediárias/difíceis.
 */

import {
  addTaskConfig,
  updateTaskConfig,
  deleteTaskConfig,
  getTasksConfigByType,
} from './dataStore.firebase.js';

let currentTab = 'checklist';
let editingTask = null;

/**
 * Inicializa a página
 */
function init() {
    console.log('🚀 AdminTarefas: Inicializando...');
    setupTabs();
    setupEventListeners();
    loadTasks();
    console.log('✅ AdminTarefas: Inicializado');
}

/**
 * Configura as tabs
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.tasks-admin__tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

/**
 * Alterna entre as tabs
 */
function switchTab(tabName) {
    currentTab = tabName;
    
    // Atualiza tabs
    document.querySelectorAll('.tasks-admin__tab').forEach(tab => {
        tab.classList.remove('tasks-admin__tab--active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('tasks-admin__tab--active');
        }
    });
    
    // Atualiza painéis
    document.querySelectorAll('.tasks-admin__panel').forEach(panel => {
        panel.classList.add('tasks-admin__panel--hidden');
    });
    
    const activePanel = document.getElementById(`panel-${tabName}`);
    if (activePanel) {
        activePanel.classList.remove('tasks-admin__panel--hidden');
    }
    
    loadTasks();
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Botões de adicionar
    document.getElementById('addChecklistBtn').addEventListener('click', () => {
        showTaskModal('checklist');
    });
    
    document.getElementById('addEasyBtn').addEventListener('click', () => {
        showTaskModal('easy');
    });
    
    document.getElementById('addIntermediateBtn').addEventListener('click', () => {
        showTaskModal('intermediate');
    });
    
    document.getElementById('addHardBtn').addEventListener('click', () => {
        showTaskModal('hard');
    });
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', hideTaskModal);
    document.getElementById('cancelBtn').addEventListener('click', hideTaskModal);
    
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        console.log('✅ Form encontrado, registrando evento submit');
        taskForm.addEventListener('submit', handleSaveTask);
    } else {
        console.error('❌ Form taskForm não encontrado!');
    }
    
    // Fechar modal ao clicar no overlay
    const overlay = document.querySelector('.modal__overlay');
    if (overlay) {
        overlay.addEventListener('click', hideTaskModal);
    }
}

/**
 * Carrega e renderiza as tarefas
 */
async function loadTasks() {
  if (currentTab === 'checklist') {
    await renderChecklistTasks();
  } else {
    await renderCategoryTasks(currentTab);
  }
}

// Renderiza tarefas do checklist a partir do Firebase
async function renderChecklistTasks() {
  const container = document.getElementById('checklistList');
  container.innerHTML =
    '<div class="tasks-admin__empty">Carregando tarefas...</div>';

  const tasks = await getTasksConfigByType('checklist');

  container.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    container.innerHTML =
      '<div class="tasks-admin__empty">Nenhuma tarefa cadastrada. Clique em "Adicionar Tarefa" para começar.</div>';
    return;
  }

  tasks.forEach((task, index) => {
    const item = createTaskItem('checklist', task, index, tasks.length);
    container.appendChild(item);
  });
}

// Renderiza tarefas de uma categoria (easy / intermediate / hard) do Firebase
async function renderCategoryTasks(category) {
  const container = document.getElementById(`${category}List`);
  container.innerHTML =
    '<div class="tasks-admin__empty">Carregando tarefas...</div>';

  const tasks = await getTasksConfigByType(category);

  container.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    container.innerHTML =
      '<div class="tasks-admin__empty">Nenhuma tarefa cadastrada. Clique em "Adicionar Tarefa" para começar.</div>';
    return;
  }

  tasks.forEach((task, index) => {
    const item = createTaskItem(category, task, index, tasks.length);
    container.appendChild(item);
  });
}

/**
 * Cria um item de tarefa
 */
function createTaskItem(category, task, index, total) {
    const item = document.createElement('div');
    item.className = 'tasks-admin__item';
    
    const pointsText = category !== 'checklist' ? ` • ${task.points} ponto${task.points > 1 ? 's' : ''}` : '';
    
    item.innerHTML = `
        <div class="tasks-admin__item-content">
            <h4 class="tasks-admin__item-title">${task.title}</h4>
            <div class="tasks-admin__item-meta">
                Ordem: ${index + 1}${pointsText}
            </div>
        </div>
        <div class="tasks-admin__item-actions">
            ${index > 0 ? `<button class="btn btn--secondary" data-action="move-up" data-id="${task.id}">↑</button>` : ''}
            ${index < total - 1 ? `<button class="btn btn--secondary" data-action="move-down" data-id="${task.id}">↓</button>` : ''}
            <button class="btn btn--secondary" data-action="edit" data-id="${task.id}">Editar</button>
            <button class="btn btn--danger" data-action="delete" data-id="${task.id}">Excluir</button>
        </div>
    `;
    
    // Event listeners
    item.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;
            
            if (action === 'edit') {
                editTask(category, id);
            } else if (action === 'delete') {
                deleteTask(category, id);
            } else if (action === 'move-up') {
                moveTask(category, id, 'up');
            } else if (action === 'move-down') {
                moveTask(category, id, 'down');
            }
        });
    });
    
    return item;
}

/**
 * Move uma tarefa para cima ou para baixo
 */
async function moveTask(category, id, direction) {
  const tasks = await getTasksConfigByType(category);
  const sortedTasks = [...tasks].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );
  const index = sortedTasks.findIndex((t) => t.id === id);
  if (index === -1) return;

  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= sortedTasks.length) return;

  const moved = sortedTasks.splice(index, 1)[0];
  sortedTasks.splice(newIndex, 0, moved);

  // Atualiza a ordem no Firebase
  await Promise.all(
    sortedTasks.map((t, i) =>
      updateTaskConfig(t.id, {
        order: i,
      })
    )
  );

  loadTasks();
}

/**
 * Mostra modal para adicionar/editar tarefa
 */
async function showTaskModal(category, taskId = null) {
    editingTask = taskId;
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const titleInput = document.getElementById('taskTitle');
    const pointsInput = document.getElementById('taskPoints');
    const pointsGroup = document.getElementById('pointsGroup');
    const modalTitle = document.getElementById('modalTitle');
    
    // Limpa formulário
    form.reset();
    document.getElementById('taskCategory').value = category;
    document.getElementById('taskId').value = taskId || '';
    
    // Configura título do modal
    if (taskId) {
        modalTitle.textContent = 'Editar Tarefa';
        
        // Carrega dados da tarefa do Firebase
        const tasks = await getTasksConfigByType(category);
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
            titleInput.value = task.title;
            if (category !== 'checklist') {
                pointsInput.value = task.points || getDefaultPoints(category);
            }
        }
    } else {
        modalTitle.textContent = 'Adicionar Tarefa';
        if (category !== 'checklist') {
            pointsInput.value = getDefaultPoints(category);
        }
    }
    
    // Mostra/esconde campo de pontos
    if (category === 'checklist') {
        pointsGroup.style.display = 'none';
    } else {
        pointsGroup.style.display = 'block';
    }
    
    modal.classList.add('modal--active');
    titleInput.focus();
}

/**
 * Esconde o modal
 */
function hideTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('modal--active');
    editingTask = null;
    document.getElementById('taskForm').reset();
}

/**
 * Manipula o salvamento da tarefa
 */
async function handleSaveTask(e) {
    e.preventDefault();
    
    console.log('🔵 handleSaveTask chamado');
    
    const category = document.getElementById('taskCategory').value;
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const points = parseInt(document.getElementById('taskPoints').value) || 1;
    
    console.log('📝 Dados:', { category, taskId, title, points });
    
    if (!title) {
        alert('Por favor, preencha o título da tarefa.');
        return;
    }
    
    try {
        if (taskId) {
            console.log('✏️ Editando tarefa:', taskId);
            const updates = category === 'checklist'
                ? { title }
                : { title, points };
            await updateTaskConfig(taskId, updates);
            console.log('✅ Tarefa editada com sucesso');
        } else {
            console.log('➕ Criando nova tarefa');
            const result = await addTaskConfig({
                type: category,
                title,
                points: category === 'checklist' ? null : points
            });
            console.log('✅ Tarefa criada:', result);
        }
        
        hideTaskModal();
        await loadTasks();
    } catch (error) {
        console.error('❌ Erro ao salvar tarefa:', error);
        alert('Erro ao salvar tarefa. Veja o console para mais detalhes.');
    }
}

/**
 * Edita uma tarefa
 */
function editTask(category, id) {
    showTaskModal(category, id);
}

/**
 * Exclui uma tarefa
 */
async function deleteTask(category, id) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }
    
    await deleteTaskConfig(id);
    loadTasks();
}

/**
 * Obtém pontos padrão para uma categoria
 */
function getDefaultPoints(category) {
    const points = {
        'easy': 1,
        'intermediate': 2,
        'hard': 3
    };
    return points[category] || 1;
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}



