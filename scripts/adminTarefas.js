/**
 * Gerenciamento de Tarefas - Admin
 */

import {
    getChecklistTasks,
    addChecklistTask,
    updateChecklistTask,
    removeChecklistTask,
    saveChecklistTasks,
    getTasksByCategory,
    addTaskToCategory,
    updateTaskInCategory,
    removeTaskFromCategory,
    saveTasksByCategory
} from './dataStore.js';

let currentTab = 'checklist';
let editingTask = null;

/**
 * Inicializa a página
 */
function init() {
    setupTabs();
    setupEventListeners();
    loadTasks();
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
    document.getElementById('taskForm').addEventListener('submit', handleSaveTask);
    
    // Fechar modal ao clicar no overlay
    document.querySelector('.modal__overlay').addEventListener('click', hideTaskModal);
}

/**
 * Carrega e renderiza as tarefas
 */
function loadTasks() {
    if (currentTab === 'checklist') {
        renderChecklistTasks();
    } else {
        renderCategoryTasks(currentTab);
    }
}

/**
 * Renderiza tarefas do checklist
 */
function renderChecklistTasks() {
    const container = document.getElementById('checklistList');
    const tasks = getChecklistTasks();
    
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="tasks-admin__empty">Nenhuma tarefa cadastrada. Clique em "Adicionar Tarefa" para começar.</div>';
        return;
    }
    
    // Ordena por ordem
    const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedTasks.forEach((task, index) => {
        const item = createTaskItem('checklist', task, index, sortedTasks.length);
        container.appendChild(item);
    });
}

/**
 * Renderiza tarefas de uma categoria
 */
function renderCategoryTasks(category) {
    const container = document.getElementById(`${category}List`);
    const tasks = getTasksByCategory(category);
    
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="tasks-admin__empty">Nenhuma tarefa cadastrada. Clique em "Adicionar Tarefa" para começar.</div>';
        return;
    }
    
    // Ordena por ordem
    const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedTasks.forEach((task, index) => {
        const item = createTaskItem(category, task, index, sortedTasks.length);
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
function moveTask(category, id, direction) {
    let tasks;
    
    if (category === 'checklist') {
        tasks = getChecklistTasks();
    } else {
        tasks = getTasksByCategory(category);
    }
    
    const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = sortedTasks.findIndex(t => t.id === id);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedTasks.length) return;
    
    // Troca as ordens
    const temp = sortedTasks[index].order || index;
    sortedTasks[index].order = sortedTasks[newIndex].order || newIndex;
    sortedTasks[newIndex].order = temp;
    
    // Salva
    if (category === 'checklist') {
        saveChecklistTasks(sortedTasks);
    } else {
        saveTasksByCategory(category, sortedTasks);
    }
    
    loadTasks();
}

/**
 * Mostra modal para adicionar/editar tarefa
 */
function showTaskModal(category, taskId = null) {
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
        
        // Carrega dados da tarefa
        let task;
        if (category === 'checklist') {
            const tasks = getChecklistTasks();
            task = tasks.find(t => t.id === taskId);
        } else {
            const tasks = getTasksByCategory(category);
            task = tasks.find(t => t.id === taskId);
        }
        
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
function handleSaveTask(e) {
    e.preventDefault();
    
    const category = document.getElementById('taskCategory').value;
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const points = parseInt(document.getElementById('taskPoints').value) || 1;
    
    if (!title) {
        alert('Por favor, preencha o título da tarefa.');
        return;
    }
    
    if (category === 'checklist') {
        if (taskId) {
            updateChecklistTask(taskId, { title });
        } else {
            addChecklistTask({ title });
        }
    } else {
        if (taskId) {
            updateTaskInCategory(category, taskId, { title, points });
        } else {
            addTaskToCategory(category, { title, points });
        }
    }
    
    hideTaskModal();
    loadTasks();
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
function deleteTask(category, id) {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }
    
    if (category === 'checklist') {
        removeChecklistTask(id);
    } else {
        removeTaskFromCategory(category, id);
    }
    
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



