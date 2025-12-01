/**
 * Camada de abstração de dados - DataStore
 * 
 * Esta camada abstrai o acesso aos dados, permitindo trocar
 * localStorage por Firebase no futuro sem alterar o resto do código.
 */

const STORAGE_KEYS = {
    COLLABORATORS: 'shir7_collaborators',
    ACTIVITIES: 'shir7_activities',
    REDEMPTIONS: 'shir7_redemptions',
    ADJUSTMENTS: 'shir7_adjustments',
    CURRENT_COLLABORATOR: 'shir7_current_collaborator',
    CHECKLIST_TASKS: 'shir7_checklist_tasks',
    EASY_TASKS: 'shir7_easy_tasks',
    INTERMEDIATE_TASKS: 'shir7_intermediate_tasks',
    HARD_TASKS: 'shir7_hard_tasks'
};

/**
 * ============================================
 * COLABORADORES
 * ============================================
 */

/**
 * Obtém todos os colaboradores
 */
export function getCollaborators() {
    const saved = localStorage.getItem(STORAGE_KEYS.COLLABORATORS);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Salva a lista de colaboradores
 */
export function saveCollaborators(collaborators) {
    localStorage.setItem(STORAGE_KEYS.COLLABORATORS, JSON.stringify(collaborators));
}

/**
 * Adiciona um novo colaborador
 */
export function addCollaborator(collabData) {
    const collaborators = getCollaborators();
    const newCollaborator = {
        id: `colab-${Date.now()}`,
        name: collabData.name,
        active: collabData.active !== undefined ? collabData.active : true,
        createdAt: new Date().toISOString()
    };
    collaborators.push(newCollaborator);
    saveCollaborators(collaborators);
    return newCollaborator;
}

/**
 * Atualiza um colaborador
 */
export function updateCollaborator(id, newData) {
    const collaborators = getCollaborators();
    const index = collaborators.findIndex(c => c.id === id);
    if (index !== -1) {
        collaborators[index] = { ...collaborators[index], ...newData };
        saveCollaborators(collaborators);
        return collaborators[index];
    }
    return null;
}

/**
 * Obtém um colaborador por ID
 */
export function getCollaboratorById(id) {
    const collaborators = getCollaborators();
    return collaborators.find(c => c.id === id) || null;
}

/**
 * Define o colaborador atual (sessão)
 */
export function setCurrentCollaborator(collaboratorId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_COLLABORATOR, collaboratorId);
}

/**
 * Obtém o colaborador atual
 */
export function getCurrentCollaborator() {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_COLLABORATOR);
    return id ? getCollaboratorById(id) : null;
}

/**
 * ============================================
 * ATIVIDADES / PONTOS
 * ============================================
 */

/**
 * Obtém todas as atividades
 */
function getAllActivities() {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Salva todas as atividades
 */
function saveAllActivities(activities) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
}

/**
 * Obtém atividades de um colaborador específico
 */
export function getActivitiesByCollaborator(collaboratorId) {
    const activities = getAllActivities();
    return activities.filter(a => a.collaboratorId === collaboratorId);
}

/**
 * Adiciona uma nova atividade
 */
export function addActivity(activityObject) {
    const activities = getAllActivities();
    const newActivity = {
        id: `act-${Date.now()}`,
        collaboratorId: activityObject.collaboratorId,
        type: activityObject.type, // "checklist", "tarefa_facil", "tarefa_media", "tarefa_dificil"
        points: activityObject.points,
        date: activityObject.date || new Date().toISOString(),
        description: activityObject.description || '',
        ...activityObject
    };
    activities.push(newActivity);
    saveAllActivities(activities);
    return newActivity;
}

/**
 * ============================================
 * RESGATES
 * ============================================
 */

/**
 * Obtém todos os resgates
 */
function getAllRedemptions() {
    const saved = localStorage.getItem(STORAGE_KEYS.REDEMPTIONS);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Salva todos os resgates
 */
function saveAllRedemptions(redemptions) {
    localStorage.setItem(STORAGE_KEYS.REDEMPTIONS, JSON.stringify(redemptions));
}

/**
 * Obtém resgates de um colaborador específico
 */
export function getRedemptionsByCollaborator(collaboratorId) {
    const redemptions = getAllRedemptions();
    return redemptions.filter(r => r.collaboratorId === collaboratorId);
}

/**
 * Adiciona um novo resgate
 */
export function addRedemption(redemptionObject) {
    const redemptions = getAllRedemptions();
    const newRedemption = {
        id: `red-${Date.now()}`,
        collaboratorId: redemptionObject.collaboratorId,
        product: redemptionObject.product,
        shirtName: redemptionObject.shirtName || null,
        personalization: redemptionObject.personalization || false,
        name: redemptionObject.name || null,
        size: redemptionObject.size,
        pointsCost: redemptionObject.pointsCost,
        status: redemptionObject.status || 'solicitado',
        date: redemptionObject.date || new Date().toISOString(),
        month: redemptionObject.month || getCurrentMonth(),
        ...redemptionObject
    };
    redemptions.push(newRedemption);
    saveAllRedemptions(redemptions);
    return newRedemption;
}

/**
 * ============================================
 * AJUSTES MANUAIS
 * ============================================
 */

/**
 * Obtém todos os ajustes
 */
function getAllAdjustments() {
    const saved = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Salva todos os ajustes
 */
function saveAllAdjustments(adjustments) {
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
}

/**
 * Obtém ajustes de um colaborador específico
 */
export function getAdjustmentsByCollaborator(collaboratorId) {
    const adjustments = getAllAdjustments();
    return adjustments.filter(a => a.collaboratorId === collaboratorId);
}

/**
 * Adiciona um novo ajuste
 */
export function addAdjustment(adjustmentObject) {
    const adjustments = getAllAdjustments();
    const newAdjustment = {
        id: `adj-${Date.now()}`,
        collaboratorId: adjustmentObject.collaboratorId,
        type: adjustmentObject.type, // "bonus", "desconto", "correcao"
        points: adjustmentObject.points,
        date: adjustmentObject.date || new Date().toISOString(),
        reason: adjustmentObject.reason || '',
        ...adjustmentObject
    };
    adjustments.push(newAdjustment);
    saveAllAdjustments(adjustments);
    return newAdjustment;
}

/**
 * ============================================
 * FUNÇÕES AUXILIARES
 * ============================================
 */

/**
 * Obtém a data atual no formato YYYY-MM-DD
 */
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Obtém o mês atual no formato YYYY-MM
 */
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Funções auxiliares para compatibilidade (importadas de storage.js)
 */
function loadDailyPoints() {
    const saved = localStorage.getItem('shir7_daily_points');
    return saved ? JSON.parse(saved) : {};
}

function loadCompletedTasks() {
    const saved = localStorage.getItem('shir7_completed_tasks');
    return saved ? JSON.parse(saved) : [];
}

/**
 * Calcula o saldo de pontos de um colaborador
 */
export function calculateCollaboratorBalance(collaboratorId) {
    const activities = getActivitiesByCollaborator(collaboratorId);
    const redemptions = getRedemptionsByCollaborator(collaboratorId);
    const adjustments = getAdjustmentsByCollaborator(collaboratorId);
    
    let balance = 0;
    
    // Soma pontos das atividades
    activities.forEach(activity => {
        balance += activity.points || 0;
    });
    
    // Subtrai pontos dos resgates
    redemptions.forEach(redemption => {
        balance -= redemption.pointsCost || 0;
    });
    
    // Soma/subtrai ajustes
    adjustments.forEach(adjustment => {
        balance += adjustment.points || 0;
    });
    
    return Math.max(0, balance);
}

/**
 * Calcula pontos ganhos no mês atual
 */
export function calculateMonthPoints(collaboratorId) {
    const month = getCurrentMonth();
    const activities = getActivitiesByCollaborator(collaboratorId);
    const adjustments = getAdjustmentsByCollaborator(collaboratorId);
    
    let points = 0;
    
    // Soma atividades do mês
    activities.forEach(activity => {
        const activityDate = new Date(activity.date);
        const activityMonth = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}`;
        if (activityMonth === month) {
            points += activity.points || 0;
        }
    });
    
    // Soma ajustes positivos do mês
    adjustments.forEach(adjustment => {
        const adjDate = new Date(adjustment.date);
        const adjMonth = `${adjDate.getFullYear()}-${String(adjDate.getMonth() + 1).padStart(2, '0')}`;
        if (adjMonth === month && adjustment.points > 0) {
            points += adjustment.points;
        }
    });
    
    return points;
}

/**
 * Conta resgates do mês atual
 */
export function countMonthlyRedemptions(collaboratorId) {
    const month = getCurrentMonth();
    const redemptions = getRedemptionsByCollaborator(collaboratorId);
    return redemptions.filter(r => r.month === month).length;
}

/**
 * ============================================
 * GERENCIAMENTO DE TAREFAS
 * ============================================
 */

/**
 * Obtém todas as tarefas do checklist diário
 */
export function getChecklistTasks() {
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKLIST_TASKS);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Salva as tarefas do checklist diário
 */
export function saveChecklistTasks(tasks) {
    localStorage.setItem(STORAGE_KEYS.CHECKLIST_TASKS, JSON.stringify(tasks));
}

/**
 * Adiciona uma tarefa ao checklist
 */
export function addChecklistTask(task) {
    const tasks = getChecklistTasks();
    const newTask = {
        id: task.id || `checklist-${Date.now()}`,
        title: task.title,
        order: task.order !== undefined ? task.order : tasks.length
    };
    tasks.push(newTask);
    saveChecklistTasks(tasks);
    return newTask;
}

/**
 * Atualiza uma tarefa do checklist
 */
export function updateChecklistTask(id, updates) {
    const tasks = getChecklistTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        saveChecklistTasks(tasks);
        return tasks[index];
    }
    return null;
}

/**
 * Remove uma tarefa do checklist
 */
export function removeChecklistTask(id) {
    const tasks = getChecklistTasks();
    const filtered = tasks.filter(t => t.id !== id);
    saveChecklistTasks(filtered);
    return filtered;
}

/**
 * Obtém tarefas de uma categoria (easy, intermediate, hard)
 */
export function getTasksByCategory(category) {
    const key = getTasksStorageKey(category);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Salva tarefas de uma categoria
 */
export function saveTasksByCategory(category, tasks) {
    const key = getTasksStorageKey(category);
    localStorage.setItem(key, JSON.stringify(tasks));
}

/**
 * Adiciona uma tarefa a uma categoria
 */
export function addTaskToCategory(category, task) {
    const tasks = getTasksByCategory(category);
    const newTask = {
        id: task.id || `${category}-${Date.now()}`,
        title: task.title,
        points: task.points || getDefaultPoints(category),
        order: task.order !== undefined ? task.order : tasks.length
    };
    tasks.push(newTask);
    saveTasksByCategory(category, tasks);
    return newTask;
}

/**
 * Atualiza uma tarefa de uma categoria
 */
export function updateTaskInCategory(category, id, updates) {
    const tasks = getTasksByCategory(category);
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        saveTasksByCategory(category, tasks);
        return tasks[index];
    }
    return null;
}

/**
 * Remove uma tarefa de uma categoria
 */
export function removeTaskFromCategory(category, id) {
    const tasks = getTasksByCategory(category);
    const filtered = tasks.filter(t => t.id !== id);
    saveTasksByCategory(category, filtered);
    return filtered;
}

/**
 * Obtém a chave de storage para uma categoria
 */
function getTasksStorageKey(category) {
    const keys = {
        'easy': STORAGE_KEYS.EASY_TASKS,
        'intermediate': STORAGE_KEYS.INTERMEDIATE_TASKS,
        'hard': STORAGE_KEYS.HARD_TASKS
    };
    return keys[category] || null;
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

