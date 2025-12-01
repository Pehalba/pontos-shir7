/**
 * Sistema de Resgate de Camisas - SHIR7
 */

import {
    getCurrentDate,
    getCurrentMonth,
    calculateMonthPointsWithDeductions,
    deductPoints
} from './storage.js';

import {
    getCurrentCollaborator,
    addRedemption,
    getRedemptionsByCollaborator,
    calculateCollaboratorBalance,
    calculateMonthPoints as calculateMonthPointsDataStore,
    countMonthlyRedemptions as countMonthlyRedemptionsDataStore,
    setCurrentCollaborator
} from './dataStore.js';

import { requireAuth, getCurrentUser } from './auth.js';

// Tabela de produtos e pontos
const PRODUCTS = [
    { id: 'torcedor', name: 'Camisa Torcedor', points: 12 },
    { id: 'retro', name: 'Camisa Retrô', points: 14 },
    { id: 'infantil', name: 'Camisa Infantil', points: 14 },
    { id: 'manga-longa', name: 'Camisa Manga Longa', points: 15 },
    { id: 'jogador', name: 'Camisa Jogador', points: 18 }
];

const PERSONALIZATION_POINTS = 3;

// Estado
let selectedProduct = null;
let personalization = false;

/**
 * Inicializa a aplicação
 */
function init() {
    // Verifica autenticação
    if (!requireAuth()) {
        return;
    }
    
    // Atualiza nome do colaborador no header
    const currentUser = getCurrentUser();
    if (currentUser) {
        const nameElement = document.getElementById('collaboratorName');
        if (nameElement) {
            nameElement.textContent = currentUser.name;
        }
    }
    
    renderProducts();
    setupEventListeners();
    updateDisplay();
    renderHistory();
}

/**
 * Renderiza os produtos disponíveis
 */
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    PRODUCTS.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        
        card.innerHTML = `
            <div class="product-card__name">${product.name}</div>
            <div class="product-card__points">${product.points}</div>
            <div class="product-card__points-label">pontos</div>
        `;
        
        card.addEventListener('click', () => {
            selectProduct(product);
        });
        
        grid.appendChild(card);
    });
}

/**
 * Seleciona um produto
 */
function selectProduct(product) {
    selectedProduct = product;
    
    // Atualiza visual dos cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.remove('product-card--selected');
    });
    
    const selectedCard = document.querySelector(`[data-product-id="${product.id}"]`);
    if (selectedCard) {
        selectedCard.classList.add('product-card--selected');
    }
    
    // Atualiza o select
    const select = document.getElementById('productSelect');
    select.value = product.id;
    
    updateDisplay();
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    const select = document.getElementById('productSelect');
    const personalizationCheck = document.getElementById('personalizationCheck');
    const nameInput = document.getElementById('nameInput');
    const sizeSelect = document.getElementById('sizeSelect');
    const confirmBtn = document.getElementById('confirmRedeemBtn');
    
    // Preenche o select
    PRODUCTS.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.points} pontos)`;
        select.appendChild(option);
    });
    
    // Select change
    select.addEventListener('change', (e) => {
        const productId = e.target.value;
        if (productId) {
            const product = PRODUCTS.find(p => p.id === productId);
            if (product) {
                selectProduct(product);
            }
        } else {
            selectedProduct = null;
            document.querySelectorAll('.product-card').forEach(card => {
                card.classList.remove('product-card--selected');
            });
            updateDisplay();
        }
    });
    
    // Personalização checkbox
    personalizationCheck.addEventListener('change', (e) => {
        personalization = e.target.checked;
        updateDisplay();
    });
    
    // Nome da camisa input
    shirtNameInput.addEventListener('input', () => {
        updateDisplay();
    });
    
    // Nome para personalização input
    nameInput.addEventListener('input', () => {
        updateDisplay();
    });
    
    // Tamanho select
    sizeSelect.addEventListener('change', () => {
        updateDisplay();
    });
    
    // Botão confirmar
    confirmBtn.addEventListener('click', handleRedeem);
}

/**
 * Atualiza o display com informações atuais
 */
function updateDisplay() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Usa dataStore para calcular pontos do colaborador atual
    const availablePoints = calculateCollaboratorBalance(currentUser.id);
    
    // Atualiza pontos disponíveis
    document.getElementById('availablePoints').textContent = availablePoints;
    document.getElementById('availablePointsSummary').textContent = availablePoints;
    
    // Calcula custo total
    let totalCost = 0;
    if (selectedProduct) {
        totalCost = selectedProduct.points;
        if (personalization) {
            totalCost += PERSONALIZATION_POINTS;
        }
    }
    
    document.getElementById('totalCost').textContent = totalCost;
    
    // Habilita/desabilita botão
    const confirmBtn = document.getElementById('confirmRedeemBtn');
    const shirtNameInput = document.getElementById('shirtNameInput').value.trim();
    const nameInput = document.getElementById('nameInput').value.trim();
    const sizeSelect = document.getElementById('sizeSelect').value;
    
    const canRedeem = selectedProduct && 
                      totalCost > 0 && 
                      availablePoints >= totalCost &&
                      shirtNameInput !== '' && // Nome da camisa é obrigatório
                      sizeSelect !== ''; // Tamanho é obrigatório
    
    confirmBtn.disabled = !canRedeem;
    
    // Mostra mensagens de erro se necessário
    const messageDiv = document.getElementById('redeemMessage');
    messageDiv.className = 'selection-card__message';
    messageDiv.textContent = '';
    
    if (selectedProduct) {
        if (availablePoints < totalCost) {
            messageDiv.className = 'selection-card__message selection-card__message--error';
            messageDiv.textContent = 'Você não tem pontos suficientes para esse resgate.';
        } else if (shirtNameInput === '') {
            messageDiv.className = 'selection-card__message selection-card__message--error';
            messageDiv.textContent = 'Por favor, informe o nome da camisa.';
        } else if (sizeSelect === '') {
            messageDiv.className = 'selection-card__message selection-card__message--error';
            messageDiv.textContent = 'Por favor, selecione o tamanho da camisa.';
        }
    }
}

/**
 * Manipula o resgate
 */
function handleRedeem() {
    const currentUser = getCurrentUser();
    if (!currentUser || !selectedProduct) {
        return;
    }
    
    const availablePoints = calculateCollaboratorBalance(currentUser.id);
    const totalCost = selectedProduct.points + (personalization ? PERSONALIZATION_POINTS : 0);
    const shirtNameInput = document.getElementById('shirtNameInput');
    const nameInput = document.getElementById('nameInput');
    const sizeSelect = document.getElementById('sizeSelect');
    
    const shirtName = shirtNameInput.value.trim();
    const name = nameInput.value.trim();
    const size = sizeSelect.value;
    
    // Validações
    if (availablePoints < totalCost) {
        showMessage('Você não tem pontos suficientes para esse resgate.', 'error');
        return;
    }
    
    if (!shirtName) {
        showMessage('Por favor, informe o nome da camisa.', 'error');
        return;
    }
    
    if (!size) {
        showMessage('Por favor, selecione o tamanho da camisa.', 'error');
        return;
    }
    
    // Cria o resgate usando dataStore
    addRedemption({
        collaboratorId: currentUser.id,
        product: selectedProduct.name,
        shirtName: shirtName,
        personalization: personalization,
        pointsCost: totalCost,
        status: 'solicitado',
        name: name || null,
        size: size
    });
    
    // Mantém compatibilidade com sistema antigo
    deductPoints(totalCost);
    
    // Mensagem de sucesso
    const productName = selectedProduct.name + (personalization ? ' com personalização' : '');
    showMessage(`Resgate realizado com sucesso! Você resgatou: ${productName} - ${shirtName} (Tamanho: ${size}).`, 'success');
    
    // Reset
    selectedProduct = null;
    personalization = false;
    document.getElementById('productSelect').value = '';
    document.getElementById('personalizationCheck').checked = false;
    shirtNameInput.value = '';
    nameInput.value = '';
    sizeSelect.value = '';
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.remove('product-card--selected');
    });
    
    // Atualiza displays
    updateDisplay();
    renderHistory();
}

/**
 * Mostra uma mensagem
 */
function showMessage(text, type) {
    const messageDiv = document.getElementById('redeemMessage');
    messageDiv.className = `selection-card__message selection-card__message--${type}`;
    messageDiv.textContent = text;
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.className = 'selection-card__message';
            messageDiv.textContent = '';
        }, 5000);
    }
}

/**
 * Renderiza o histórico de resgates
 */
function renderHistory() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const container = document.getElementById('historyContainer');
    const redemptions = getRedemptionsByCollaborator(currentUser.id);
    
    // Ordena por data (mais recente primeiro)
    const sortedRedemptions = redemptions.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    if (sortedRedemptions.length === 0) {
        container.innerHTML = '<p class="history-empty">Nenhum resgate realizado ainda.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    sortedRedemptions.forEach(redemption => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = new Date(redemption.date);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const details = [];
        if (redemption.shirtName) {
            details.push(`Camisa: ${redemption.shirtName}`);
        }
        if (redemption.size) {
            details.push(`Tamanho: ${redemption.size}`);
        }
        if (redemption.name) {
            details.push(`Nome: ${redemption.name}`);
        }
        if (redemption.personalization) {
            details.push('Com personalização');
        }
        details.push(`Status: ${redemption.status}`);
        
        item.innerHTML = `
            <div class="history-item__info">
                <div class="history-item__date">${formattedDate}</div>
                <div class="history-item__product">${redemption.product}</div>
                <div class="history-item__details">${details.join(' • ')}</div>
            </div>
            <div class="history-item__points">
                <div class="history-item__points-value">-${redemption.pointsCost}</div>
                <div class="history-item__points-label">pontos</div>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        setupLogout();
    });
} else {
    init();
    setupLogout();
}

// Configura botão de logout
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            setCurrentCollaborator(null);
            window.location.href = 'login.html';
        });
    }
}

