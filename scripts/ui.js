/**
 * Funções para montar elementos na tela
 */

import { isTaskCompletedToday, getCurrentDate } from './storage.js';

/**
 * Cria um card de tarefa
 */
export function createTaskCard(task, type, onToggle, onMoveUp, onMoveDown, canMoveUp, canMoveDown) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.taskId = task.id;
    card.dataset.taskType = type;
    
    const today = getCurrentDate();
    const isCompleted = isTaskCompletedToday(task.id, today);
    
    if (isCompleted) {
        card.classList.add('card--completed');
    }
    
    card.innerHTML = `
        <div class="card__header">
            <input 
                type="checkbox" 
                class="card__checkbox" 
                ${isCompleted ? 'checked' : ''}
            >
            <h3 class="card__title">${task.title}</h3>
        </div>
        <div class="card__footer">
            <span class="card__points">+${task.points} ponto${task.points > 1 ? 's' : ''}</span>
            <div class="card__actions">
                ${onMoveUp ? '<button class="card__move-btn" data-direction="up" title="Mover para cima">↑</button>' : ''}
                ${onMoveDown ? '<button class="card__move-btn" data-direction="down" title="Mover para baixo">↓</button>' : ''}
            </div>
        </div>
    `;
    
    const checkbox = card.querySelector('.card__checkbox');
    checkbox.addEventListener('change', () => {
        onToggle(task.id, type, task.points, !isCompleted);
    });
    
    if (onMoveUp) {
        const upBtn = card.querySelector('[data-direction="up"]');
        if (upBtn) {
            upBtn.disabled = !canMoveUp;
            upBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onMoveUp();
            });
        }
    }
    
    if (onMoveDown) {
        const downBtn = card.querySelector('[data-direction="down"]');
        if (downBtn) {
            downBtn.disabled = !canMoveDown;
            downBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onMoveDown();
            });
        }
    }
    
    return card;
}

/**
 * Cria um card do checklist diário
 */
export function createChecklistCard(task, isCompleted, onToggle, onMoveUp, onMoveDown, canMoveUp, canMoveDown) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.taskId = task.id;
    
    if (isCompleted) {
        card.classList.add('card--completed');
    }
    
    card.innerHTML = `
        <div class="card__header">
            <input 
                type="checkbox" 
                class="card__checkbox" 
                ${isCompleted ? 'checked' : ''}
            >
            <h3 class="card__title">${task.title}</h3>
        </div>
        ${onMoveUp || onMoveDown ? `
        <div class="card__footer">
            <div class="card__actions">
                ${onMoveUp ? '<button class="card__move-btn" data-direction="up" title="Mover para cima">↑</button>' : ''}
                ${onMoveDown ? '<button class="card__move-btn" data-direction="down" title="Mover para baixo">↓</button>' : ''}
            </div>
        </div>
        ` : ''}
    `;
    
    const checkbox = card.querySelector('.card__checkbox');
    checkbox.addEventListener('change', () => {
        // Usa o estado atual do checkbox, não o valor anterior
        onToggle(task.id, checkbox.checked);
    });
    
    if (onMoveUp) {
        const upBtn = card.querySelector('[data-direction="up"]');
        if (upBtn) {
            upBtn.disabled = !canMoveUp;
            upBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onMoveUp();
            });
        }
    }
    
    if (onMoveDown) {
        const downBtn = card.querySelector('[data-direction="down"]');
        if (downBtn) {
            downBtn.disabled = !canMoveDown;
            downBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onMoveDown();
            });
        }
    }
    
    return card;
}

/**
 * Cria um card de tarefa pessoal
 */
export function createPersonalTaskCard(task, boardId, onToggle, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.taskId = task.id;
    
    if (task.completed) {
        card.classList.add('card--completed');
    }
    
    card.innerHTML = `
        <div class="card__header">
            <input 
                type="checkbox" 
                class="card__checkbox" 
                ${task.completed ? 'checked' : ''}
            >
            <h3 class="card__title">${task.title}</h3>
        </div>
        <div class="card__footer">
            <div class="card__actions">
                ${onMoveUp ? '<button class="card__move-btn" data-direction="up" title="Mover para cima">↑</button>' : ''}
                ${onMoveDown ? '<button class="card__move-btn" data-direction="down" title="Mover para baixo">↓</button>' : ''}
                <button class="card__delete-btn">Excluir</button>
            </div>
        </div>
    `;
    
    const checkbox = card.querySelector('.card__checkbox');
    checkbox.addEventListener('change', () => {
        onToggle(boardId, task.id, !task.completed);
    });
    
    const deleteBtn = card.querySelector('.card__delete-btn');
    deleteBtn.addEventListener('click', () => {
        onDelete(boardId, task.id);
    });
    
    if (onMoveUp) {
        const upBtn = card.querySelector('[data-direction="up"]');
        if (upBtn) {
            upBtn.disabled = !canMoveUp;
            upBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onMoveUp();
            });
        }
    }
    
    if (onMoveDown) {
        const downBtn = card.querySelector('[data-direction="down"]');
        if (downBtn) {
            downBtn.disabled = !canMoveDown;
            downBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onMoveDown();
            });
        }
    }
    
    return card;
}

/**
 * Cria um quadro pessoal
 */
export function createPersonalBoard(board, onAddTask, onDeleteTask, onToggleTask, onDeleteBoard, onMoveTask) {
    const boardElement = document.createElement('div');
    boardElement.className = 'personal-board';
    boardElement.dataset.boardId = board.id;
    
    boardElement.innerHTML = `
        <div class="personal-board__header">
            <h3 class="personal-board__title">${board.name}</h3>
            <button class="personal-board__delete-btn">Excluir quadro</button>
        </div>
        <button class="personal-board__add-task-btn">Adicionar tarefa</button>
        <div class="personal-board__tasks"></div>
    `;
    
    const tasksContainer = boardElement.querySelector('.personal-board__tasks');
    
    // Renderiza tarefas existentes
    board.tasks.forEach((task, index) => {
        const canMoveUp = index > 0;
        const canMoveDown = index < board.tasks.length - 1;
        
        const taskCard = createPersonalTaskCard(
            task,
            board.id,
            onToggleTask,
            onDeleteTask,
            canMoveUp && onMoveTask ? () => onMoveTask(board.id, index, 'up') : null,
            canMoveDown && onMoveTask ? () => onMoveTask(board.id, index, 'down') : null,
            canMoveUp,
            canMoveDown
        );
        tasksContainer.appendChild(taskCard);
    });
    
    // Botão adicionar tarefa
    const addTaskBtn = boardElement.querySelector('.personal-board__add-task-btn');
    addTaskBtn.addEventListener('click', () => {
        onAddTask(board.id);
    });
    
    // Botão excluir quadro
    const deleteBoardBtn = boardElement.querySelector('.personal-board__delete-btn');
    deleteBoardBtn.addEventListener('click', () => {
        if (confirm(`Tem certeza que deseja excluir o quadro "${board.name}"?`)) {
            onDeleteBoard(board.id);
        }
    });
    
    return boardElement;
}

/**
 * Atualiza o resumo de pontos
 */
export function updatePointsSummary(monthTotal, todayTotal, categories) {
    document.getElementById('totalMonthPoints').textContent = monthTotal;
    document.getElementById('todayPoints').textContent = todayTotal;
    document.getElementById('checklistPoints').textContent = categories.checklist;
    document.getElementById('easyPoints').textContent = categories.easy;
    document.getElementById('intermediatePoints').textContent = categories.intermediate;
    document.getElementById('hardPoints').textContent = categories.hard;
}

/**
 * Cria modal para criar quadro pessoal
 */
export function showCreateBoardModal(onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal modal--active';
    modal.id = 'createBoardModal';
    
    modal.innerHTML = `
        <div class="modal__content">
            <h2 class="modal__title">Criar novo quadro pessoal</h2>
            <form class="modal__form" id="createBoardForm">
                <input 
                    type="text" 
                    class="modal__input" 
                    id="boardNameInput"
                    placeholder="Nome do quadro (ex: Tarefas Urgentes)"
                    required
                    autofocus
                >
                <div class="modal__buttons">
                    <button type="button" class="modal__btn modal__btn--secondary" id="cancelBtn">Cancelar</button>
                    <button type="submit" class="modal__btn modal__btn--primary">Criar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Foca no input após um pequeno delay para garantir que o modal está visível
    setTimeout(() => {
        const input = modal.querySelector('#boardNameInput');
        if (input) {
            input.focus();
        }
    }, 100);
    
    const form = modal.querySelector('#createBoardForm');
    const cancelBtn = modal.querySelector('#cancelBtn');
    const input = modal.querySelector('#boardNameInput');
    
    const closeModal = () => {
        if (modal && modal.parentNode) {
            document.body.removeChild(modal);
        }
    };
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = input.value.trim();
            if (name) {
                onConfirm(name);
                closeModal();
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Fecha com ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

/**
 * Cria modal para adicionar tarefa em quadro pessoal
 */
export function showAddTaskModal(onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal modal--active';
    modal.id = 'addTaskModal';
    
    modal.innerHTML = `
        <div class="modal__content">
            <h2 class="modal__title">Adicionar tarefa</h2>
            <form class="modal__form" id="addTaskForm">
                <textarea 
                    class="modal__textarea" 
                    id="taskTitleInput"
                    placeholder="Título da tarefa"
                    required
                    autofocus
                ></textarea>
                <div class="modal__buttons">
                    <button type="button" class="modal__btn modal__btn--secondary" id="cancelBtn">Cancelar</button>
                    <button type="submit" class="modal__btn modal__btn--primary">Adicionar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Foca no textarea após um pequeno delay
    setTimeout(() => {
        const textarea = modal.querySelector('#taskTitleInput');
        if (textarea) {
            textarea.focus();
        }
    }, 100);
    
    const form = modal.querySelector('#addTaskForm');
    const cancelBtn = modal.querySelector('#cancelBtn');
    const textarea = modal.querySelector('#taskTitleInput');
    
    const closeModal = () => {
        if (modal && modal.parentNode) {
            document.body.removeChild(modal);
        }
    };
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = textarea.value.trim();
            if (title) {
                onConfirm(title);
                closeModal();
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Fecha com ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

