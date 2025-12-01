/**
 * Gerenciamento de localStorage
 */

const STORAGE_KEYS = {
    CHECKLIST_STATUS: 'shir7_checklist_status',
    CHECKLIST_DATE: 'shir7_checklist_date',
    DAILY_POINTS: 'shir7_daily_points',
    COMPLETED_TASKS: 'shir7_completed_tasks',
    PERSONAL_BOARDS: 'shir7_personal_boards',
    TASK_ORDER: 'shir7_task_order',
    REDEMPTIONS: 'shir7_redemptions'
};

/**
 * Obtém a data atual no formato YYYY-MM-DD
 */
export function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Obtém o mês atual no formato YYYY-MM
 */
export function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Salva o status do checklist do dia
 */
export function saveChecklistStatus(tasks) {
    const date = getCurrentDate();
    localStorage.setItem(STORAGE_KEYS.CHECKLIST_STATUS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.CHECKLIST_DATE, date);
}

/**
 * Carrega o status do checklist do dia
 */
export function loadChecklistStatus() {
    const savedDate = localStorage.getItem(STORAGE_KEYS.CHECKLIST_DATE);
    const currentDate = getCurrentDate();
    
    // Se for um novo dia, retorna null para resetar
    if (savedDate !== currentDate) {
        return null;
    }
    
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKLIST_STATUS);
    return saved ? JSON.parse(saved) : null;
}

/**
 * Registra pontos diários do checklist
 */
export function saveDailyChecklistPoint(date, points) {
    const dailyPoints = loadDailyPoints();
    if (!dailyPoints[date]) {
        dailyPoints[date] = { checklist: 0, tasks: [] };
    }
    dailyPoints[date].checklist = points;
    localStorage.setItem(STORAGE_KEYS.DAILY_POINTS, JSON.stringify(dailyPoints));
}

/**
 * Carrega todos os pontos diários
 */
export function loadDailyPoints() {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_POINTS);
    return saved ? JSON.parse(saved) : {};
}

/**
 * Registra uma tarefa extra concluída
 */
export function saveCompletedTask(taskId, type, points, date) {
    const completedTasks = loadCompletedTasks();
    const task = {
        id: taskId,
        type,
        points,
        date,
        timestamp: Date.now()
    };
    
    // Verifica se já foi concluída hoje
    const todayTasks = completedTasks.filter(t => 
        t.id === taskId && t.date === date
    );
    
    if (todayTasks.length === 0) {
        completedTasks.push(task);
        localStorage.setItem(STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(completedTasks));
        return true;
    }
    
    return false;
}

/**
 * Remove uma tarefa extra concluída
 */
export function removeCompletedTask(taskId, date) {
    const completedTasks = loadCompletedTasks();
    const filtered = completedTasks.filter(t => 
        !(t.id === taskId && t.date === date)
    );
    localStorage.setItem(STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(filtered));
}

/**
 * Carrega todas as tarefas concluídas
 */
export function loadCompletedTasks() {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Verifica se uma tarefa foi concluída hoje
 */
export function isTaskCompletedToday(taskId, date) {
    const completedTasks = loadCompletedTasks();
    return completedTasks.some(t => t.id === taskId && t.date === date);
}

/**
 * Salva os quadros pessoais
 */
export function savePersonalBoards(boards) {
    localStorage.setItem(STORAGE_KEYS.PERSONAL_BOARDS, JSON.stringify(boards));
}

/**
 * Carrega os quadros pessoais
 */
export function loadPersonalBoards() {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONAL_BOARDS);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Calcula pontos totais do mês
 */
export function calculateMonthPoints() {
    const month = getCurrentMonth();
    const dailyPoints = loadDailyPoints();
    const completedTasks = loadCompletedTasks();
    
    let total = 0;
    
    // Soma pontos do checklist
    Object.keys(dailyPoints).forEach(date => {
        if (date.startsWith(month)) {
            total += dailyPoints[date].checklist || 0;
        }
    });
    
    // Soma pontos das tarefas extras
    completedTasks.forEach(task => {
        if (task.date.startsWith(month)) {
            total += task.points || 0;
        }
    });
    
    return total;
}

/**
 * Calcula pontos de hoje (sem deduções, apenas ganhos)
 */
export function calculateTodayPoints() {
    const today = getCurrentDate();
    const dailyPoints = loadDailyPoints();
    const completedTasks = loadCompletedTasks();
    
    let total = 0;
    
    // Pontos do checklist
    if (dailyPoints[today]) {
        total += dailyPoints[today].checklist || 0;
    }
    
    // Pontos das tarefas extras
    completedTasks.forEach(task => {
        if (task.date === today) {
            total += task.points || 0;
        }
    });
    
    return total;
}

/**
 * Calcula pontos de hoje considerando deduções
 */
export function calculateTodayPointsWithDeductions() {
    const today = getCurrentDate();
    const dailyPoints = loadDailyPoints();
    const completedTasks = loadCompletedTasks();
    
    let total = 0;
    let deductions = 0;
    
    // Pontos do checklist
    if (dailyPoints[today]) {
        total += dailyPoints[today].checklist || 0;
        deductions += dailyPoints[today].deductions || 0;
    }
    
    // Pontos das tarefas extras
    completedTasks.forEach(task => {
        if (task.date === today) {
            total += task.points || 0;
        }
    });
    
    return Math.max(0, total - deductions);
}

/**
 * Calcula pontos por categoria hoje
 */
export function calculatePointsByCategory() {
    const today = getCurrentDate();
    const dailyPoints = loadDailyPoints();
    const completedTasks = loadCompletedTasks();
    
    const categories = {
        checklist: dailyPoints[today]?.checklist || 0,
        easy: 0,
        intermediate: 0,
        hard: 0
    };
    
    completedTasks.forEach(task => {
        if (task.date === today) {
            if (task.type === 'easy') categories.easy += task.points;
            else if (task.type === 'intermediate') categories.intermediate += task.points;
            else if (task.type === 'hard') categories.hard += task.points;
        }
    });
    
    return categories;
}

/**
 * Salva a ordem das tarefas
 */
export function saveTaskOrder(category, order) {
    const allOrders = loadTaskOrder();
    allOrders[category] = order;
    localStorage.setItem(STORAGE_KEYS.TASK_ORDER, JSON.stringify(allOrders));
}

/**
 * Carrega a ordem das tarefas
 */
export function loadTaskOrder() {
    const saved = localStorage.getItem(STORAGE_KEYS.TASK_ORDER);
    return saved ? JSON.parse(saved) : {};
}

/**
 * Obtém a ordem de uma categoria específica
 */
export function getTaskOrder(category) {
    const allOrders = loadTaskOrder();
    return allOrders[category] || null;
}

/**
 * Salva um resgate
 */
export function saveRedemption(redemption) {
    const redemptions = loadRedemptions();
    const newRedemption = {
        id: `redemption-${Date.now()}`,
        date: getCurrentDate(),
        month: getCurrentMonth(),
        product: redemption.product,
        personalization: redemption.personalization || false,
        pointsCost: redemption.pointsCost,
        status: redemption.status || 'solicitado',
        ...redemption
    };
    redemptions.push(newRedemption);
    localStorage.setItem(STORAGE_KEYS.REDEMPTIONS, JSON.stringify(redemptions));
    return newRedemption;
}

/**
 * Carrega todos os resgates
 */
export function loadRedemptions() {
    const saved = localStorage.getItem(STORAGE_KEYS.REDEMPTIONS);
    return saved ? JSON.parse(saved) : [];
}

/**
 * Conta quantas camisas foram resgatadas no mês atual
 */
export function countMonthlyRedemptions() {
    const month = getCurrentMonth();
    const redemptions = loadRedemptions();
    return redemptions.filter(r => r.month === month).length;
}

/**
 * Desconta pontos do saldo total
 */
export function deductPoints(points) {
    // Os pontos são calculados dinamicamente, então precisamos subtrair
    // Vamos criar um registro de pontos descontados
    const today = getCurrentDate();
    const dailyPoints = loadDailyPoints();
    
    if (!dailyPoints[today]) {
        dailyPoints[today] = { checklist: 0, tasks: [], deductions: 0 };
    }
    
    if (!dailyPoints[today].deductions) {
        dailyPoints[today].deductions = 0;
    }
    
    dailyPoints[today].deductions = (dailyPoints[today].deductions || 0) + points;
    localStorage.setItem(STORAGE_KEYS.DAILY_POINTS, JSON.stringify(dailyPoints));
}

/**
 * Calcula pontos totais do mês considerando deduções
 */
export function calculateMonthPointsWithDeductions() {
    const month = getCurrentMonth();
    const dailyPoints = loadDailyPoints();
    const completedTasks = loadCompletedTasks();
    
    let total = 0;
    let deductions = 0;
    
    // Soma pontos do checklist
    Object.keys(dailyPoints).forEach(date => {
        if (date.startsWith(month)) {
            total += dailyPoints[date].checklist || 0;
            deductions += dailyPoints[date].deductions || 0;
        }
    });
    
    // Soma pontos das tarefas extras
    completedTasks.forEach(task => {
        if (task.date.startsWith(month)) {
            total += task.points || 0;
        }
    });
    
    return Math.max(0, total - deductions);
}

