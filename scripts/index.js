/**
 * Sistema de Pontos SHIR7 - Lógica Principal
 */

import {
    getCurrentDate,
    saveChecklistStatus,
    loadChecklistStatus,
    saveDailyChecklistPoint,
    loadDailyPoints,
    saveCompletedTask,
    removeCompletedTask,
    loadCompletedTasks,
    isTaskCompletedToday,
    savePersonalBoards,
    loadPersonalBoards,
    calculateMonthPoints,
    calculateMonthPointsWithDeductions,
    calculateTodayPoints,
    calculateTodayPointsWithDeductions,
    calculatePointsByCategory,
    saveTaskOrder,
    getTaskOrder
} from './storage.js';

import {
    getCurrentCollaborator,
    setCurrentCollaborator,
    addActivity,
    getActivitiesByCollaborator,
    calculateCollaboratorBalance,
    calculateMonthPoints as calculateMonthPointsDataStore
} from './dataStore.firebase.js';

import {
    getChecklistTasks,
    getTasksByCategory
} from './dataStore.js';

import { requireAuth, getCurrentUser } from './auth.js';

import {
    createTaskCard,
    createChecklistCard,
    createPersonalBoard,
    updatePointsSummary,
    showCreateBoardModal,
    showAddTaskModal
} from './ui.js';

// Tarefas serão carregadas do dataStore
let CHECKLIST_TASKS = [];
let EASY_TASKS = [];
let INTERMEDIATE_TASKS = [];
let HARD_TASKS = [];

/**
 * Carrega tarefas do dataStore
 */
function loadTasksFromStore() {
    CHECKLIST_TASKS = getChecklistTasks();
    EASY_TASKS = getTasksByCategory('easy');
    INTERMEDIATE_TASKS = getTasksByCategory('intermediate');
    HARD_TASKS = getTasksByCategory('hard');
    
    // Se não há tarefas cadastradas, usa valores padrão
    if (CHECKLIST_TASKS.length === 0) {
        CHECKLIST_TASKS = [
            { id: 'checklist-1', title: 'Revisar e-mails recebidos', order: 0 },
            { id: 'checklist-2', title: 'Atualizar planilha de atividades', order: 1 },
            { id: 'checklist-3', title: 'Participar da reunião diária', order: 2 },
            { id: 'checklist-4', title: 'Enviar relatório de progresso', order: 3 }
        ];
    }
    
    if (EASY_TASKS.length === 0) {
        EASY_TASKS = [
            { id: 'easy-1', title: 'Organizar arquivos da pasta compartilhada', points: 1, order: 0 },
            { id: 'easy-2', title: 'Responder mensagens pendentes no chat', points: 1, order: 1 },
            { id: 'easy-3', title: 'Atualizar perfil no sistema', points: 1, order: 2 }
        ];
    }
    
    if (INTERMEDIATE_TASKS.length === 0) {
        INTERMEDIATE_TASKS = [
            { id: 'intermediate-1', title: 'Criar relatório semanal de atividades', points: 2, order: 0 },
            { id: 'intermediate-2', title: 'Revisar e atualizar documentação do projeto', points: 2, order: 1 },
            { id: 'intermediate-3', title: 'Participar de treinamento interno', points: 2, order: 2 }
        ];
    }
    
    if (HARD_TASKS.length === 0) {
        HARD_TASKS = [
            { id: 'hard-1', title: 'Desenvolver nova funcionalidade do sistema', points: 3, order: 0 },
            { id: 'hard-2', title: 'Resolver problema crítico reportado', points: 3, order: 1 },
            { id: 'hard-3', title: 'Apresentar proposta de melhoria para equipe', points: 3, order: 2 }
        ];
    }
    
    // Ordena todas as tarefas
    CHECKLIST_TASKS.sort((a, b) => (a.order || 0) - (b.order || 0));
    EASY_TASKS.sort((a, b) => (a.order || 0) - (b.order || 0));
    INTERMEDIATE_TASKS.sort((a, b) => (a.order || 0) - (b.order || 0));
    HARD_TASKS.sort((a, b) => (a.order || 0) - (b.order || 0));
}

// Estado da aplicação
let personalBoards = [];

/**
 * Inicializa a aplicação
 */
async function init() {
    // Verifica autenticação
    if (!requireAuth()) {
        return;
    }
    
    // Inicializa sistema (cria colaborador padrão se necessário)
    const { initializeSystem } = await import('./init.js');
    initializeSystem();
    
    // Atualiza nome do colaborador no header
    const currentUser = getCurrentUser();
    if (currentUser) {
        const nameElement = document.getElementById('collaboratorName');
        if (nameElement) {
            nameElement.textContent = currentUser.name;
        }
    }
    
    // Carrega tarefas do dataStore
    loadTasksFromStore();
    
    checkDailyReset();
    loadPersonalBoardsData();
    renderChecklist();
    renderTaskColumns();
    renderPersonalBoards();
    updatePointsDisplay();
    
    // Event listener para criar quadro pessoal
    const createBtn = document.getElementById('createPersonalBoardBtn');
    if (createBtn) {
        createBtn.addEventListener('click', handleCreatePersonalBoard);
    } else {
        console.error('Botão createPersonalBoardBtn não encontrado!');
    }
    
    // Configura botões do header
    const { setupHeaderButtons } = await import('./headerButtons.js');
    setupHeaderButtons();
}

/**
 * Verifica se precisa resetar o checklist (novo dia)
 */
function checkDailyReset() {
    const savedStatus = loadChecklistStatus();
    const today = getCurrentDate();
    
    // Se não há status salvo ou é um novo dia, reseta o checklist
    if (!savedStatus) {
        const defaultStatus = {};
        CHECKLIST_TASKS.forEach(task => {
            defaultStatus[task.id] = false;
        });
        saveChecklistStatus(defaultStatus);
    }
}

/**
 * Obtém tarefas ordenadas do checklist
 */
function getOrderedChecklistTasks() {
    const savedOrder = getTaskOrder('checklist');
    if (savedOrder && Array.isArray(savedOrder)) {
        // Ordena baseado na ordem salva
        const orderedTasks = [];
        const taskMap = new Map(CHECKLIST_TASKS.map(t => [t.id, t]));
        
        savedOrder.forEach(id => {
            if (taskMap.has(id)) {
                orderedTasks.push(taskMap.get(id));
                taskMap.delete(id);
            }
        });
        
        // Adiciona tarefas que não estavam na ordem salva
        taskMap.forEach(task => orderedTasks.push(task));
        
        return orderedTasks;
    }
    return CHECKLIST_TASKS;
}

/**
 * Renderiza o checklist diário
 */
function renderChecklist() {
    const container = document.getElementById('checklistColumn');
    container.innerHTML = '';
    
    let status = loadChecklistStatus();
    
    // Se não há status ou é um novo dia, inicializa com todas as tarefas como false
    if (!status) {
        status = {};
        CHECKLIST_TASKS.forEach(task => {
            status[task.id] = false;
        });
        saveChecklistStatus(status);
    }
    
    // Garante que todas as tarefas existem no status
    CHECKLIST_TASKS.forEach(task => {
        if (!(task.id in status)) {
            status[task.id] = false;
        }
    });
    
    const orderedTasks = getOrderedChecklistTasks();
    
    orderedTasks.forEach((task, index) => {
        const isCompleted = status[task.id] === true;
        const canMoveUp = index > 0;
        const canMoveDown = index < orderedTasks.length - 1;
        
        const card = createChecklistCard(
            task, 
            isCompleted, 
            handleChecklistToggle,
            canMoveUp ? () => moveChecklistTask(index, 'up') : null,
            canMoveDown ? () => moveChecklistTask(index, 'down') : null,
            canMoveUp,
            canMoveDown
        );
        container.appendChild(card);
    });
    
    // Verifica completude e renderiza botão de resgatar
    checkChecklistCompletion();
}

/**
 * Move uma tarefa do checklist para cima ou para baixo
 */
function moveChecklistTask(currentIndex, direction) {
    const orderedTasks = getOrderedChecklistTasks();
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= orderedTasks.length) {
        return;
    }
    
    // Troca as posições
    [orderedTasks[currentIndex], orderedTasks[newIndex]] = [orderedTasks[newIndex], orderedTasks[currentIndex]];
    
    // Salva a nova ordem
    const order = orderedTasks.map(t => t.id);
    saveTaskOrder('checklist', order);
    
    // Re-renderiza
    renderChecklist();
}

/**
 * Manipula o toggle de uma tarefa do checklist
 */
function handleChecklistToggle(taskId, isCompleted) {
    const status = loadChecklistStatus() || {};
    
    // Garante que todas as tarefas existem no status
    CHECKLIST_TASKS.forEach(task => {
        if (!(task.id in status)) {
            status[task.id] = false;
        }
    });
    
    status[taskId] = isCompleted;
    saveChecklistStatus(status);
    
    // Renderiza novamente e depois verifica completude
    renderChecklist();
    updatePointsDisplay();
}

/**
 * Verifica se o checklist está 100% completo e mostra botão de resgatar
 */
function checkChecklistCompletion() {
    let status = loadChecklistStatus();
    const today = getCurrentDate();
    
    // Se não há status, inicializa
    if (!status) {
        status = {};
        CHECKLIST_TASKS.forEach(task => {
            status[task.id] = false;
        });
    }
    
    // Garante que todas as tarefas do checklist existem no status
    CHECKLIST_TASKS.forEach(task => {
        if (!(task.id in status)) {
            status[task.id] = false;
        }
    });
    
    // Usa a ordem atual das tarefas para verificar completude
    const orderedTasks = getOrderedChecklistTasks();
    
    // Verifica se todas estão completas (verifica explicitamente se é true)
    const allCompleted = orderedTasks.length > 0 && 
                         orderedTasks.every(task => {
                             const taskStatus = status[task.id];
                             return taskStatus === true;
                         });
    
    const dailyPoints = loadDailyPoints();
    const currentChecklistPoints = dailyPoints[today]?.checklist || 0;
    
    // Renderiza o botão de resgatar
    renderRedeemButton(allCompleted, currentChecklistPoints === 1);
    
    // Se não está completo mas tinha ganho ponto, remove
    if (!allCompleted && currentChecklistPoints === 1) {
        saveDailyChecklistPoint(today, 0);
        updatePointsDisplay();
    } else if (allCompleted && currentChecklistPoints === 1) {
        // Já está completo e já tem o ponto, só atualiza display
        updatePointsDisplay();
    }
}

/**
 * Renderiza o botão de resgatar ponto do checklist
 */
function renderRedeemButton(isCompleted, alreadyRedeemed) {
    const container = document.getElementById('checklistRedeemContainer');
    if (!container) {
        console.error('Container checklistRedeemContainer não encontrado!');
        return;
    }
    
    container.innerHTML = '';
    
    if (isCompleted && !alreadyRedeemed) {
        const button = document.createElement('button');
        button.className = 'board__redeem-btn';
        button.textContent = '🎉 Resgatar 1 ponto';
        button.addEventListener('click', handleRedeemChecklistPoint);
        container.appendChild(button);
    } else if (isCompleted && alreadyRedeemed) {
        const message = document.createElement('div');
        message.style.cssText = 'text-align: center; padding: 0.5rem; color: #28a745; font-weight: 600; font-size: 0.9rem;';
        message.textContent = '✅ Ponto resgatado hoje!';
        container.appendChild(message);
    }
}

/**
 * Manipula o resgate do ponto do checklist
 */
function handleRedeemChecklistPoint() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const today = getCurrentDate();
    const dailyPoints = loadDailyPoints();
    const currentChecklistPoints = dailyPoints[today]?.checklist || 0;
    
    // Só resgata se ainda não foi resgatado
    if (currentChecklistPoints !== 1) {
        saveDailyChecklistPoint(today, 1);
        
        // Registra atividade no dataStore
        addActivity({
            collaboratorId: currentUser.id,
            type: 'checklist',
            points: 1,
            date: new Date().toISOString(),
            description: 'Checklist diário completo'
        });
        
        updatePointsDisplay();
        renderRedeemButton(true, true);
    }
}

/**
 * Obtém tarefas ordenadas de uma categoria
 */
function getOrderedTasks(originalTasks, category) {
    const savedOrder = getTaskOrder(category);
    if (savedOrder && Array.isArray(savedOrder)) {
        const orderedTasks = [];
        const taskMap = new Map(originalTasks.map(t => [t.id, t]));
        
        savedOrder.forEach(id => {
            if (taskMap.has(id)) {
                orderedTasks.push(taskMap.get(id));
                taskMap.delete(id);
            }
        });
        
        taskMap.forEach(task => orderedTasks.push(task));
        return orderedTasks;
    }
    return originalTasks;
}

/**
 * Renderiza as colunas de tarefas extras
 */
function renderTaskColumns() {
    // Recarrega tarefas do dataStore (caso tenham sido atualizadas)
    loadTasksFromStore();
    
    renderTaskColumn('easyColumn', EASY_TASKS, 'easy');
    renderTaskColumn('intermediateColumn', INTERMEDIATE_TASKS, 'intermediate');
    renderTaskColumn('hardColumn', HARD_TASKS, 'hard');
}

/**
 * Renderiza uma coluna de tarefas
 */
function renderTaskColumn(containerId, tasks, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const orderedTasks = getOrderedTasks(tasks, type);
    
    orderedTasks.forEach((task, index) => {
        const canMoveUp = index > 0;
        const canMoveDown = index < orderedTasks.length - 1;
        
        const card = createTaskCard(
            task, 
            type, 
            handleTaskToggle,
            canMoveUp ? () => moveTask(type, index, 'up', tasks) : null,
            canMoveDown ? () => moveTask(type, index, 'down', tasks) : null,
            canMoveUp,
            canMoveDown
        );
        container.appendChild(card);
    });
}

/**
 * Move uma tarefa extra para cima ou para baixo
 */
function moveTask(type, currentIndex, direction, originalTasks) {
    const orderedTasks = getOrderedTasks(originalTasks, type);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= orderedTasks.length) {
        return;
    }
    
    [orderedTasks[currentIndex], orderedTasks[newIndex]] = [orderedTasks[newIndex], orderedTasks[currentIndex]];
    
    const order = orderedTasks.map(t => t.id);
    saveTaskOrder(type, order);
    
    renderTaskColumns();
}

/**
 * Manipula o toggle de uma tarefa extra
 */
function handleTaskToggle(taskId, type, points, isCompleting) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const today = getCurrentDate();
    
    if (isCompleting) {
        const saved = saveCompletedTask(taskId, type, points, today);
        if (saved) {
            // Registra atividade no dataStore
            const typeMap = {
                'easy': 'tarefa_facil',
                'intermediate': 'tarefa_media',
                'hard': 'tarefa_dificil'
            };
            
            addActivity({
                collaboratorId: currentUser.id,
                type: typeMap[type] || type,
                points: points,
                date: new Date().toISOString(),
                description: `Tarefa ${type} concluída`
            });
            
            updatePointsDisplay();
            renderTaskColumns(); // Atualiza visual
        }
    } else {
        removeCompletedTask(taskId, today);
        updatePointsDisplay();
        renderTaskColumns(); // Atualiza visual
    }
}

/**
 * Carrega os quadros pessoais do localStorage
 */
function loadPersonalBoardsData() {
    personalBoards = loadPersonalBoards();
}

/**
 * Renderiza os quadros pessoais
 */
function renderPersonalBoards() {
    const container = document.getElementById('personalBoardsContainer');
    container.innerHTML = '';
    
    personalBoards.forEach(board => {
        const boardElement = createPersonalBoard(
            board,
            handleAddPersonalTask,
            handleDeletePersonalTask,
            handleTogglePersonalTask,
            handleDeletePersonalBoard,
            handleMovePersonalTask
        );
        container.appendChild(boardElement);
    });
}

/**
 * Move uma tarefa pessoal para cima ou para baixo
 */
function handleMovePersonalTask(boardId, currentIndex, direction) {
    const board = personalBoards.find(b => b.id === boardId);
    if (!board || !board.tasks) {
        return;
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= board.tasks.length) {
        return;
    }
    
    // Troca as posições
    [board.tasks[currentIndex], board.tasks[newIndex]] = [board.tasks[newIndex], board.tasks[currentIndex]];
    
    // Salva
    savePersonalBoards(personalBoards);
    
    // Re-renderiza
    renderPersonalBoards();
}

/**
 * Manipula a criação de um novo quadro pessoal
 */
function handleCreatePersonalBoard() {
    showCreateBoardModal((name) => {
        const newBoard = {
            id: `board-${Date.now()}`,
            name: name,
            tasks: []
        };
        
        personalBoards.push(newBoard);
        savePersonalBoards(personalBoards);
        renderPersonalBoards();
    });
}

/**
 * Manipula a adição de tarefa em quadro pessoal
 */
function handleAddPersonalTask(boardId) {
    showAddTaskModal((title) => {
        const board = personalBoards.find(b => b.id === boardId);
        if (board) {
            const newTask = {
                id: `task-${Date.now()}`,
                title: title,
                completed: false
            };
            
            board.tasks.push(newTask);
            savePersonalBoards(personalBoards);
            renderPersonalBoards();
        }
    });
}

/**
 * Manipula o toggle de tarefa pessoal
 */
function handleTogglePersonalTask(boardId, taskId, isCompleted) {
    const board = personalBoards.find(b => b.id === boardId);
    if (board) {
        const task = board.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = isCompleted;
            savePersonalBoards(personalBoards);
            renderPersonalBoards();
        }
    }
}

/**
 * Manipula a exclusão de tarefa pessoal
 */
function handleDeletePersonalTask(boardId, taskId) {
    const board = personalBoards.find(b => b.id === boardId);
    if (board) {
        board.tasks = board.tasks.filter(t => t.id !== taskId);
        savePersonalBoards(personalBoards);
        renderPersonalBoards();
    }
}

/**
 * Manipula a exclusão de quadro pessoal
 */
function handleDeletePersonalBoard(boardId) {
    personalBoards = personalBoards.filter(b => b.id !== boardId);
    savePersonalBoards(personalBoards);
    renderPersonalBoards();
}

/**
 * Atualiza o display de pontos
 */
async function updatePointsDisplay() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Usa dataStore (Firebase) para calcular pontos do colaborador atual
    const monthTotal = await calculateMonthPointsDataStore(currentUser.id);
    
    // Para hoje, ainda usa o sistema antigo temporariamente (compatibilidade)
    const todayTotal = calculateTodayPointsWithDeductions();
    const categories = calculatePointsByCategory();
    
    updatePointsSummary(monthTotal, todayTotal, categories);
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

