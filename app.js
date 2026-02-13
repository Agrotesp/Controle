/* ========================================
AGROTESP PULVERIZAÇÃO - SISTEMA WEB
JavaScript Principal
======================================== */

// ========== Configuração Global ==========
const APP_CONFIG = {
version: ‘1.0.0’,
storageKeys: {
atendimentos: ‘agrotesp_atendimentos’,
atendimentoAtivo: ‘agrotesp_atendimento_ativo’,
config: ‘agrotesp_config’,
apiKeys: ‘agrotesp_api_keys’
},
weatherApiUrl: ‘https://api.openweathermap.org/data/2.5/weather’,
geocodingApiUrl: ‘https://nominatim.openstreetmap.org/reverse’,
weatherTimeout: 300000, // 5 minutos em ms
statusAtendimento: {
RASCUNHO: ‘rascunho’,
EM_ANDAMENTO: ‘em-andamento’,
PRONTO_ENVIO: ‘aguardando-envio’,
ENVIADO: ‘enviado’,
FALHA: ‘falha’
}
};

// ========== Estado da Aplicação ==========
let appState = {
atendimentos: [],
atendimentoAtivo: null,
config: {
emailjs: {
serviceId: ‘’,
templateId: ‘’,
publicKey: ‘’,
emailDestino: ‘’
}
},
apiKeys: {
weather: ‘’
},
lastWeatherAttempt: null,
weatherManualMode: false
};

// ========== Inicialização ==========
document.addEventListener(‘DOMContentLoaded’, () => {
initializeApp();
});

function initializeApp() {
console.log(‘Iniciando aplicação AGROTESP…’);
loadFromStorage();
initializeNavigation();
initializeEventListeners();
checkAtendimentoAtivo();

```
// Inicializar EmailJS se configurado
if (appState.config.emailjs.publicKey) {
    emailjs.init(appState.config.emailjs.publicKey);
}

console.log('Sistema inicializado com sucesso');
showToast('Sistema iniciado com sucesso', 'success');
```

}

// ========== Storage Management ==========
function loadFromStorage() {
try {
const atendimentos = localStorage.getItem(APP_CONFIG.storageKeys.atendimentos);
if (atendimentos) {
appState.atendimentos = JSON.parse(atendimentos);
}

```
    const atendimentoAtivo = localStorage.getItem(APP_CONFIG.storageKeys.atendimentoAtivo);
    if (atendimentoAtivo) {
        appState.atendimentoAtivo = JSON.parse(atendimentoAtivo);
    }
    
    const config = localStorage.getItem(APP_CONFIG.storageKeys.config);
    if (config) {
        appState.config = JSON.parse(config);
    }
    
    const apiKeys = localStorage.getItem(APP_CONFIG.storageKeys.apiKeys);
    if (apiKeys) {
        appState.apiKeys = JSON.parse(apiKeys);
    }
} catch (error) {
    console.error('Erro ao carregar dados:', error);
    showToast('Erro ao carregar dados salvos', 'error');
}
```

}

function saveToStorage() {
try {
localStorage.setItem(APP_CONFIG.storageKeys.atendimentos, JSON.stringify(appState.atendimentos));
localStorage.setItem(APP_CONFIG.storageKeys.atendimentoAtivo, JSON.stringify(appState.atendimentoAtivo));
localStorage.setItem(APP_CONFIG.storageKeys.config, JSON.stringify(appState.config));
localStorage.setItem(APP_CONFIG.storageKeys.apiKeys, JSON.stringify(appState.apiKeys));
} catch (error) {
console.error(‘Erro ao salvar dados:’, error);
showToast(‘Erro ao salvar dados’, ‘error’);
}
}

// ========== Navigation ==========
function initializeNavigation() {
const navItems = document.querySelectorAll(’.nav-item’);

```
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = item.dataset.page;
        if (pageName) {
            navigateToPage(pageName);
            // Atualizar hash sem scroll
            window.location.hash = pageName;
        }
    });
});

// Detectar mudanças no hash
window.addEventListener('hashchange', handleHashChange);

// Carregar página inicial baseada no hash
handleHashChange();
```

}

function handleHashChange() {
const hash = window.location.hash.slice(1); // Remove o #
const pageName = hash || ‘dashboard’; // Default para dashboard
navigateToPage(pageName);
}

function navigateToPage(pageName) {
console.log(‘Navegando para:’, pageName);

```
// Remover active de todas as páginas e nav items
document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
});
document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
});

// Ativar página e nav item correto
const page = document.getElementById(`page-${pageName}`);
const navItem = document.querySelector(`[data-page="${pageName}"]`);

if (page) {
    page.classList.add('active');
    console.log('Página ativada:', pageName);
} else {
    console.warn('Página não encontrada:', pageName);
    // Fallback para dashboard
    const dashboardPage = document.getElementById('page-dashboard');
    if (dashboardPage) {
        dashboardPage.classList.add('active');
    }
}

if (navItem) {
    navItem.classList.add('active');
}

// Scroll para o topo
window.scrollTo(0, 0);

// Atualizar conteúdo específico da página
try {
    switch(pageName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'execucao':
            updateExecucaoPage();
            break;
        case 'produtos':
            updateProdutosPage();
            break;
        case 'calculadora':
            updateCalculadoraPage();
            break;
        case 'clima':
            updateClimaPage();
            break;
        case 'fila':
            updateFilaPage();
            break;
        case 'configuracoes':
            updateConfigPage();
            break;
    }
} catch (error) {
    console.error('Erro ao atualizar página:', error);
}
```

}

// ========== Event Listeners ==========
function initializeEventListeners() {
// Novo Atendimento
document.getElementById(‘formNovoAtendimento’).addEventListener(‘submit’, handleNovoAtendimento);
document.getElementById(‘btnCapturarGPS’).addEventListener(‘click’, capturarGPS);

```
// Atendimento em Execução
document.getElementById('btnFinalizarAtendimento').addEventListener('click', finalizarAtendimento);

// Produtos
document.getElementById('btnAdicionarProduto').addEventListener('click', () => openModalProduto());
document.getElementById('btnFecharModalProduto').addEventListener('click', closeModalProduto);
document.getElementById('btnCancelarProduto').addEventListener('click', closeModalProduto);
document.getElementById('btnSalvarProduto').addEventListener('click', handleSalvarProduto);

// Calculadora
document.getElementById('btnCalcular').addEventListener('click', handleCalcular);

// Clima
document.getElementById('btnRegistrarClimaAuto').addEventListener('click', registrarClimaAutomatico);
document.getElementById('btnRegistrarClimaManual').addEventListener('click', () => openModalClimaManual());
document.getElementById('btnFecharModalClima').addEventListener('click', closeModalClimaManual);
document.getElementById('btnCancelarClima').addEventListener('click', closeModalClimaManual);
document.getElementById('btnSalvarClima').addEventListener('click', handleSalvarClimaManual);

// Configurações
document.getElementById('btnSalvarConfig').addEventListener('click', handleSalvarConfig);
document.getElementById('btnSalvarApiKeys').addEventListener('click', handleSalvarApiKeys);
document.getElementById('btnExportarDados').addEventListener('click', handleExportarDados);
document.getElementById('btnLimparDados').addEventListener('click', handleLimparDados);
```

}

// ========== Dashboard ==========
function updateDashboard() {
const total = appState.atendimentos.length;
const emAndamento = appState.atendimentos.filter(a => a.status === APP_CONFIG.statusAtendimento.EM_ANDAMENTO).length;
const aguardandoEnvio = appState.atendimentos.filter(a => a.status === APP_CONFIG.statusAtendimento.PRONTO_ENVIO).length;
const enviados = appState.atendimentos.filter(a => a.status === APP_CONFIG.statusAtendimento.ENVIADO).length;

```
document.getElementById('totalAtendimentos').textContent = total;
document.getElementById('emAndamento').textContent = emAndamento;
document.getElementById('aguardandoEnvio').textContent = aguardandoEnvio;
document.getElementById('enviados').textContent = enviados;

renderAtendimentosLista();
```

}

function renderAtendimentosLista() {
const lista = document.getElementById(‘atendimentosLista’);

```
if (appState.atendimentos.length === 0) {
    lista.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">📋</span>
            <p>Nenhum atendimento cadastrado</p>
            <p class="subtitle-sm">Crie um novo atendimento para começar</p>
        </div>
    `;
    return;
}

const sorted = [...appState.atendimentos].sort((a, b) => 
    new Date(b.timestamp_inicio) - new Date(a.timestamp_inicio)
);

lista.innerHTML = sorted.map(atendimento => `
    <div class="atendimento-card ${atendimento.status}" onclick="viewAtendimento('${atendimento.id}')">
        <div class="atendimento-header">
            <div class="atendimento-title">${atendimento.proprietario}</div>
            <div class="atendimento-badge ${atendimento.status}">
                ${getStatusLabel(atendimento.status)}
            </div>
        </div>
        <div class="atendimento-info">
            <div><strong>Fazenda:</strong> ${atendimento.fazenda}</div>
            <div><strong>Operador:</strong> ${atendimento.operador}</div>
            <div><strong>Local:</strong> ${atendimento.municipio || 'N/A'}, ${atendimento.estado || 'N/A'}</div>
            <div><strong>Data:</strong> ${formatDateTime(atendimento.timestamp_inicio)}</div>
        </div>
    </div>
`).join('');
```

}

function getStatusLabel(status) {
const labels = {
‘rascunho’: ‘Rascunho’,
‘em-andamento’: ‘Em Andamento’,
‘aguardando-envio’: ‘Aguardando Envio’,
‘enviado’: ‘Enviado’,
‘falha’: ‘Falha no Envio’
};
return labels[status] || status;
}

function viewAtendimento(id) {
const atendimento = appState.atendimentos.find(a => a.id === id);
if (!atendimento) return;

```
// TODO: Implementar visualização detalhada
showToast(`Visualizando: ${atendimento.proprietario}`, 'info');
```

}

// ========== Novo Atendimento ==========
function handleNovoAtendimento(e) {
e.preventDefault();

```
const proprietario = document.getElementById('proprietario').value.trim();
const fazenda = document.getElementById('fazenda').value.trim();
const operador = document.getElementById('operador').value.trim();
const observacoes = document.getElementById('observacoes').value.trim();

const gpsLat = document.getElementById('gpsLat').textContent;
const gpsLng = document.getElementById('gpsLng').textContent;

if (gpsLat === '-' || gpsLng === '-') {
    showToast('Por favor, capture a localização GPS', 'warning');
    return;
}

const novoAtendimento = {
    id: generateId(),
    proprietario,
    operador,
    fazenda,
    municipio: document.getElementById('gpsMunicipio').textContent,
    estado: document.getElementById('gpsEstado').textContent,
    latitude: parseFloat(gpsLat),
    longitude: parseFloat(gpsLng),
    precisao: parseFloat(document.getElementById('gpsPrecisao').textContent),
    timestamp_gps: new Date().toISOString(),
    clima_logs: [],
    produtos: [],
    calculos: null,
    status: APP_CONFIG.statusAtendimento.EM_ANDAMENTO,
    timestamp_inicio: new Date().toISOString(),
    timestamp_final: null,
    observacoes
};

appState.atendimentos.push(novoAtendimento);
appState.atendimentoAtivo = novoAtendimento;
saveToStorage();

// Mostrar item de navegação "Em Execução"
document.getElementById('navExecucao').classList.remove('hidden');

// Resetar formulário
e.target.reset();
document.getElementById('gpsStatus').classList.add('hidden');

showToast('Atendimento iniciado com sucesso!', 'success');
navigateToPage('execucao');
updateDashboard();
```

}

// ========== GPS ==========
async function capturarGPS() {
if (!navigator.geolocation) {
showToast(‘GPS não disponível neste dispositivo’, ‘error’);
return;
}

```
showLoading('Capturando localização GPS...');

try {
    const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        });
    });
    
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const precisao = position.coords.accuracy;
    
    // Atualizar UI
    document.getElementById('gpsLat').textContent = lat.toFixed(6);
    document.getElementById('gpsLng').textContent = lng.toFixed(6);
    document.getElementById('gpsPrecisao').textContent = precisao.toFixed(2);
    
    // Classificar precisão
    const badge = document.getElementById('gpsPrecisaoBadge');
    if (precisao <= 10) {
        badge.textContent = 'Excelente';
        badge.className = 'precision-badge excelente';
    } else if (precisao <= 25) {
        badge.textContent = 'Boa';
        badge.className = 'precision-badge boa';
    } else if (precisao <= 50) {
        badge.textContent = 'Aceitável';
        badge.className = 'precision-badge aceitavel';
    } else {
        badge.textContent = 'Ruim';
        badge.className = 'precision-badge ruim';
    }
    
    // Buscar município e estado
    await reverseGeocode(lat, lng);
    
    document.getElementById('gpsStatus').classList.remove('hidden');
    hideLoading();
    showToast('Localização capturada com sucesso!', 'success');
    
} catch (error) {
    hideLoading();
    console.error('Erro ao capturar GPS:', error);
    showToast('Erro ao capturar localização. Verifique as permissões.', 'error');
}
```

}

async function reverseGeocode(lat, lng) {
try {
const url = `${APP_CONFIG.geocodingApiUrl}?lat=${lat}&lon=${lng}&format=json`;
const response = await fetch(url);
const data = await response.json();

```
    if (data && data.address) {
        const municipio = data.address.city || data.address.town || data.address.village || 'N/A';
        const estado = data.address.state || 'N/A';
        
        document.getElementById('gpsMunicipio').textContent = municipio;
        document.getElementById('gpsEstado').textContent = estado;
    }
} catch (error) {
    console.error('Erro no geocoding reverso:', error);
    document.getElementById('gpsMunicipio').textContent = 'N/A';
    document.getElementById('gpsEstado').textContent = 'N/A';
}
```

}

// ========== Atendimento em Execução ==========
function updateExecucaoPage() {
const noExecucaoMsg = document.getElementById(‘noExecucaoMsg’);
const execucaoContent = document.getElementById(‘execucaoContent’);

```
if (!appState.atendimentoAtivo) {
    noExecucaoMsg.classList.remove('hidden');
    execucaoContent.classList.add('hidden');
    return;
}

noExecucaoMsg.classList.add('hidden');
execucaoContent.classList.remove('hidden');

// Atualizar resumo
const atendimento = appState.atendimentoAtivo;
document.getElementById('execProprietario').textContent = atendimento.proprietario;
document.getElementById('execFazenda').textContent = atendimento.fazenda;
document.getElementById('execOperador').textContent = atendimento.operador;
document.getElementById('execLocal').textContent = `${atendimento.municipio || 'N/A'}, ${atendimento.estado || 'N/A'}`;
document.getElementById('execInicio').textContent = formatDateTime(atendimento.timestamp_inicio);

// Atualizar checklist
updateChecklist();
```

}

function updateChecklist() {
const atendimento = appState.atendimentoAtivo;
if (!atendimento) return;

```
// Check GPS
const checkGPS = document.getElementById('checkGPS');
if (atendimento.latitude && atendimento.longitude && atendimento.municipio && atendimento.estado) {
    checkGPS.classList.add('completed');
    checkGPS.querySelector('.check-icon').textContent = '✅';
} else {
    checkGPS.classList.remove('completed');
    checkGPS.querySelector('.check-icon').textContent = '⬜';
}

// Check Produtos
const checkProdutos = document.getElementById('checkProdutos');
if (atendimento.produtos && atendimento.produtos.length > 0) {
    checkProdutos.classList.add('completed');
    checkProdutos.querySelector('.check-icon').textContent = '✅';
} else {
    checkProdutos.classList.remove('completed');
    checkProdutos.querySelector('.check-icon').textContent = '⬜';
}

// Check Cálculos
const checkCalculos = document.getElementById('checkCalculos');
if (atendimento.calculos) {
    checkCalculos.classList.add('completed');
    checkCalculos.querySelector('.check-icon').textContent = '✅';
} else {
    checkCalculos.classList.remove('completed');
    checkCalculos.querySelector('.check-icon').textContent = '⬜';
}

// Check Clima
const checkClima = document.getElementById('checkClima');
if (atendimento.clima_logs && atendimento.clima_logs.length > 0) {
    checkClima.classList.add('completed');
    checkClima.querySelector('.check-icon').textContent = '✅';
} else {
    checkClima.classList.remove('completed');
    checkClima.querySelector('.check-icon').textContent = '⬜';
}
```

}

function viewAtendimentoDetalhado() {
if (!appState.atendimentoAtivo) return;

```
const relatorio = gerarRelatorioTexto(appState.atendimentoAtivo);

// Criar modal para mostrar o relatório
const modal = document.createElement('div');
modal.className = 'modal active';
modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
            <h3>Detalhes do Atendimento</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <pre style="white-space: pre-wrap; font-size: 0.85rem; max-height: 70vh; overflow-y: auto;">${relatorio}</pre>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Fechar</button>
        </div>
    </div>
`;
document.body.appendChild(modal);
```

}

function finalizarAtendimento() {
if (!appState.atendimentoAtivo) {
showToast(‘Nenhum atendimento ativo’, ‘warning’);
return;
}

```
const atendimento = appState.atendimentoAtivo;
const erros = [];

// Validar campos obrigatórios
if (!atendimento.proprietario || !atendimento.proprietario.trim()) {
    erros.push('Nome do proprietário');
}

if (!atendimento.fazenda || !atendimento.fazenda.trim()) {
    erros.push('Nome da fazenda/local');
}

if (!atendimento.municipio || !atendimento.estado) {
    erros.push('Município e Estado (capture o GPS)');
}

if (!atendimento.latitude || !atendimento.longitude) {
    erros.push('Coordenadas GPS');
}

if (!atendimento.precisao) {
    erros.push('Precisão GPS');
}

if (!atendimento.clima_logs || atendimento.clima_logs.length === 0) {
    erros.push('Pelo menos 1 registro climático');
}

if (!atendimento.produtos || atendimento.produtos.length === 0) {
    erros.push('Pelo menos 1 produto com dose');
} else {
    // Validar que todos produtos têm dose
    const produtosSemDose = atendimento.produtos.filter(p => !p.dose || p.dose <= 0);
    if (produtosSemDose.length > 0) {
        erros.push('Todos os produtos devem ter dose válida');
    }
}

if (erros.length > 0) {
    const mensagem = 'Campos obrigatórios faltando:\n\n• ' + erros.join('\n• ');
    
    // Mostrar modal de erro
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⚠️ Validação de Atendimento</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 16px;">Para finalizar o atendimento, complete os seguintes itens:</p>
                <ul style="padding-left: 20px; line-height: 1.8;">
                    ${erros.map(e => `<li>${e}</li>`).join('')}
                </ul>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-block" onclick="this.closest('.modal').remove()">Entendi</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return;
}

// Confirmação antes de finalizar
const modal = document.createElement('div');
modal.className = 'modal active';
modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h3>✅ Finalizar Atendimento</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <p style="margin-bottom: 16px;">Tem certeza que deseja finalizar este atendimento?</p>
            <div class="info-row">
                <span class="label">Proprietário:</span>
                <span class="value">${atendimento.proprietario}</span>
            </div>
            <div class="info-row">
                <span class="label">Fazenda:</span>
                <span class="value">${atendimento.fazenda}</span>
            </div>
            <div class="info-row">
                <span class="label">Produtos:</span>
                <span class="value">${atendimento.produtos.length}</span>
            </div>
            <div class="info-row">
                <span class="label">Registros Climáticos:</span>
                <span class="value">${atendimento.clima_logs.length}</span>
            </div>
            <p style="margin-top: 16px; font-size: 0.9rem; color: var(--cinza-escuro);">
                Após finalizar, o atendimento ficará pronto para envio.
            </p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="confirmarFinalizacao(); this.closest('.modal').remove();">Finalizar</button>
        </div>
    </div>
`;
document.body.appendChild(modal);
```

}

function confirmarFinalizacao() {
const atendimento = appState.atendimentoAtivo;

```
showLoading('Finalizando atendimento...');

// Gravar timestamp de finalização
atendimento.timestamp_final = new Date().toISOString();

// Mudar status para PRONTO_ENVIO
atendimento.status = APP_CONFIG.statusAtendimento.PRONTO_ENVIO;

// Atualizar no array de atendimentos
const index = appState.atendimentos.findIndex(a => a.id === atendimento.id);
if (index !== -1) {
    appState.atendimentos[index] = atendimento;
}

// Limpar atendimento ativo
appState.atendimentoAtivo = null;

// Esconder navegação de execução
document.getElementById('navExecucao').classList.add('hidden');

// Salvar
saveToStorage();

hideLoading();
showToast('Atendimento finalizado com sucesso!', 'success');

// Navegar para fila de envio
setTimeout(() => {
    navigateToPage('fila');
    updateDashboard();
}, 500);
```

}

function checkAtendimentoAtivo() {
// Verificar se há atendimento ativo ao iniciar
if (appState.atendimentoAtivo) {
document.getElementById(‘navExecucao’).classList.remove(‘hidden’);
showToast(`Atendimento ativo: ${appState.atendimentoAtivo.proprietario}`, ‘info’);
} else {
document.getElementById(‘navExecucao’).classList.add(‘hidden’);
}
}

// ========== Produtos ==========
function updateProdutosPage() {
const noProdutosMsg = document.getElementById(‘noProdutosMsg’);
const produtosContent = document.getElementById(‘produtosContent’);

```
if (!appState.atendimentoAtivo) {
    noProdutosMsg.classList.remove('hidden');
    produtosContent.classList.add('hidden');
    return;
}

noProdutosMsg.classList.add('hidden');
produtosContent.classList.remove('hidden');
renderProdutosLista();
calcularResumoCalda();

// Atualizar checklist se estiver na página de execução
if (document.getElementById('page-execucao').classList.contains('active')) {
    updateChecklist();
}
```

}

function renderProdutosLista() {
const lista = document.getElementById(‘produtosLista’);

```
if (!appState.atendimentoAtivo.produtos || appState.atendimentoAtivo.produtos.length === 0) {
    lista.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">🧪</span>
            <p>Nenhum produto adicionado</p>
        </div>
    `;
    return;
}

lista.innerHTML = appState.atendimentoAtivo.produtos.map((produto, index) => `
    <div class="produto-card">
        <div class="produto-header">
            <div class="produto-tipo">${produto.tipo}</div>
            <div class="produto-actions">
                <button class="btn-icon-only" onclick="removerProduto(${index})" title="Remover">
                    🗑️
                </button>
            </div>
        </div>
        <div class="produto-nome">${produto.nome}</div>
        <div class="produto-info">
            ${produto.ingrediente ? `<div><strong>Ingrediente:</strong> ${produto.ingrediente}</div>` : ''}
            ${produto.fabricante ? `<div><strong>Fabricante:</strong> ${produto.fabricante}</div>` : ''}
            ${produto.lote ? `<div><strong>Lote:</strong> ${produto.lote}</div>` : ''}
            <div><strong>Dose:</strong> ${produto.dose} L/ha</div>
            ${produto.quantidadeTotal ? `<div><strong>Quantidade Total:</strong> ${produto.quantidadeTotal.toFixed(2)} L</div>` : ''}
        </div>
        ${produto.observacoes ? `<p style="margin-top: 8px; font-size: 0.9rem; color: var(--cinza-escuro);">${produto.observacoes}</p>` : ''}
    </div>
`).join('');
```

}

function calcularResumoCalda() {
const resumo = document.getElementById(‘resumoCalda’);

```
if (!appState.atendimentoAtivo.calculos || !appState.atendimentoAtivo.produtos.length) {
    resumo.innerHTML = '';
    return;
}

const calc = appState.atendimentoAtivo.calculos;
const totalProdutos = appState.atendimentoAtivo.produtos.reduce((sum, p) => sum + (p.quantidadeTotal || 0), 0);

resumo.innerHTML = `
    <h3>Resumo da Calda</h3>
    <div class="calc-result">
        <span class="label">Calda Total:</span>
        <span class="value">${calc.caldaTotal.toFixed(2)} L</span>
    </div>
    <div class="calc-result">
        <span class="label">Total de Produtos:</span>
        <span class="value">${totalProdutos.toFixed(2)} L</span>
    </div>
    <div class="calc-result">
        <span class="label">Água:</span>
        <span class="value">${(calc.caldaTotal - totalProdutos).toFixed(2)} L</span>
    </div>
`;
```

}

function openModalProduto(produtoIndex = null) {
const modal = document.getElementById(‘modalProduto’);
modal.classList.add(‘active’);

```
if (produtoIndex !== null) {
    // Editar produto existente
    const produto = appState.atendimentoAtivo.produtos[produtoIndex];
    document.getElementById('produtoTipo').value = produto.tipo;
    document.getElementById('produtoNome').value = produto.nome;
    document.getElementById('produtoIngrediente').value = produto.ingrediente || '';
    document.getElementById('produtoFabricante').value = produto.fabricante || '';
    document.getElementById('produtoLote').value = produto.lote || '';
    document.getElementById('produtoDose').value = produto.dose;
    document.getElementById('produtoObs').value = produto.observacoes || '';
} else {
    // Novo produto
    document.getElementById('formProduto').reset();
}
```

}

function closeModalProduto() {
document.getElementById(‘modalProduto’).classList.remove(‘active’);
}

function handleSalvarProduto() {
const tipo = document.getElementById(‘produtoTipo’).value;
const nome = document.getElementById(‘produtoNome’).value.trim();
const ingrediente = document.getElementById(‘produtoIngrediente’).value.trim();
const fabricante = document.getElementById(‘produtoFabricante’).value.trim();
const lote = document.getElementById(‘produtoLote’).value.trim();
const dose = parseFloat(document.getElementById(‘produtoDose’).value);
const observacoes = document.getElementById(‘produtoObs’).value.trim();

```
if (!nome || !dose || dose <= 0) {
    showToast('Preencha os campos obrigatórios', 'warning');
    return;
}

const produto = {
    tipo,
    nome,
    ingrediente,
    fabricante,
    lote,
    dose,
    observacoes,
    quantidadeTotal: null
};

// Calcular quantidade total se tiver área
if (appState.atendimentoAtivo.calculos && appState.atendimentoAtivo.calculos.areaTotal) {
    const area = appState.atendimentoAtivo.calculos.areaTotal;
    const margem = appState.atendimentoAtivo.calculos.margemOperacional || 0;
    produto.quantidadeTotal = dose * area * (1 + margem / 100);
}

appState.atendimentoAtivo.produtos.push(produto);
saveToStorage();

closeModalProduto();
updateProdutosPage();

// Atualizar checklist se estiver visível
if (appState.atendimentoAtivo) {
    updateChecklist();
}

showToast('Produto adicionado com sucesso!', 'success');
```

}

function removerProduto(index) {
if (!confirm(‘Deseja realmente remover este produto?’)) return;

```
appState.atendimentoAtivo.produtos.splice(index, 1);
saveToStorage();
updateProdutosPage();

// Atualizar checklist
if (appState.atendimentoAtivo) {
    updateChecklist();
}

showToast('Produto removido', 'info');
```

}

// ========== Calculadora ==========
function updateCalculadoraPage() {
const noCalcMsg = document.getElementById(‘noCalcMsg’);
const calculadoraContent = document.getElementById(‘calculadoraContent’);

```
if (!appState.atendimentoAtivo) {
    noCalcMsg.classList.remove('hidden');
    calculadoraContent.classList.add('hidden');
    return;
}

noCalcMsg.classList.add('hidden');
calculadoraContent.classList.remove('hidden');

// Preencher campos se já houver cálculo
if (appState.atendimentoAtivo.calculos) {
    const calc = appState.atendimentoAtivo.calculos;
    document.getElementById('areaTotal').value = calc.areaTotal;
    document.getElementById('taxaAplicacao').value = calc.taxaAplicacao;
    document.getElementById('capacidadeTanque').value = calc.capacidadeTanque;
    document.getElementById('produtividade').value = calc.produtividade;
    document.getElementById('margemOperacional').value = calc.margemOperacional;
    
    mostrarResultadosCalc(calc);
}
```

}

function handleCalcular() {
const areaTotal = parseFloat(document.getElementById(‘areaTotal’).value);
const taxaAplicacao = parseFloat(document.getElementById(‘taxaAplicacao’).value);
const capacidadeTanque = parseFloat(document.getElementById(‘capacidadeTanque’).value);
const produtividade = parseFloat(document.getElementById(‘produtividade’).value);
const margemOperacional = parseFloat(document.getElementById(‘margemOperacional’).value) || 0;

```
if (!areaTotal || !taxaAplicacao || !capacidadeTanque || !produtividade) {
    showToast('Preencha todos os campos obrigatórios', 'warning');
    return;
}

// Cálculos
const caldaTotal = areaTotal * taxaAplicacao * (1 + margemOperacional / 100);
const numAbastecimentos = Math.ceil(caldaTotal / capacidadeTanque);
const areaPorTanque = areaTotal / numAbastecimentos;
const numVoos = numAbastecimentos; // Assumindo 1 voo por abastecimento
const tempoEstimado = areaTotal / produtividade;

const calculos = {
    areaTotal,
    taxaAplicacao,
    capacidadeTanque,
    produtividade,
    margemOperacional,
    caldaTotal,
    numAbastecimentos,
    areaPorTanque,
    numVoos,
    tempoEstimado
};

appState.atendimentoAtivo.calculos = calculos;

// Recalcular quantidades dos produtos
appState.atendimentoAtivo.produtos.forEach(produto => {
    produto.quantidadeTotal = produto.dose * areaTotal * (1 + margemOperacional / 100);
});

saveToStorage();
mostrarResultadosCalc(calculos);
showToast('Cálculo realizado com sucesso!', 'success');
```

}

function mostrarResultadosCalc(calc) {
const resultados = document.getElementById(‘resultadosCalc’);
resultados.classList.remove(‘hidden’);

```
document.getElementById('caldaTotal').textContent = `${calc.caldaTotal.toFixed(2)} L`;
document.getElementById('numAbastecimentos').textContent = calc.numAbastecimentos;
document.getElementById('areaPorTanque').textContent = `${calc.areaPorTanque.toFixed(2)} ha`;
document.getElementById('numVoos').textContent = calc.numVoos;

const horas = Math.floor(calc.tempoEstimado);
const minutos = Math.round((calc.tempoEstimado - horas) * 60);
document.getElementById('tempoEstimado').textContent = `${horas}h ${minutos}min`;

// Atualizar checklist
if (appState.atendimentoAtivo) {
    updateChecklist();
}
```

}

// ========== Clima ==========
function updateClimaPage() {
const noClimaMsg = document.getElementById(‘noClimaMsg’);
const climaContent = document.getElementById(‘climaContent’);

```
if (!appState.atendimentoAtivo) {
    noClimaMsg.classList.remove('hidden');
    climaContent.classList.add('hidden');
    return;
}

noClimaMsg.classList.add('hidden');
climaContent.classList.remove('hidden');

renderClimaLista();
atualizarSemaforoAtual();
```

}

async function registrarClimaAutomatico() {
if (!appState.apiKeys.weather) {
showToast(‘Configure a API Key do OpenWeatherMap nas configurações’, ‘warning’);
return;
}

```
if (!appState.atendimentoAtivo) {
    showToast('Nenhum atendimento ativo', 'warning');
    return;
}

showLoading('Obtendo dados climáticos...');

try {
    const lat = appState.atendimentoAtivo.latitude;
    const lng = appState.atendimentoAtivo.longitude;
    
    const url = `${APP_CONFIG.weatherApiUrl}?lat=${lat}&lon=${lng}&appid=${appState.apiKeys.weather}&units=metric&lang=pt_br`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('Falha na API de clima');
    }
    
    const data = await response.json();
    
    const registro = {
        timestamp: new Date().toISOString(),
        temperatura: data.main.temp,
        umidade: data.main.humidity,
        vento: data.wind.speed * 3.6, // Converter m/s para km/h
        origem: 'API'
    };
    
    adicionarRegistroClima(registro);
    hideLoading();
    showToast('Clima registrado com sucesso!', 'success');
    appState.lastWeatherAttempt = Date.now();
    appState.weatherManualMode = false;
    
} catch (error) {
    hideLoading();
    console.error('Erro ao obter clima:', error);
    
    const timeSinceLastAttempt = appState.lastWeatherAttempt ? Date.now() - appState.lastWeatherAttempt : Infinity;
    
    if (timeSinceLastAttempt > APP_CONFIG.weatherTimeout) {
        appState.weatherManualMode = true;
        showToast('API falhou. Use o registro manual.', 'warning');
        openModalClimaManual();
    } else {
        showToast('Erro ao obter dados climáticos. Tente novamente.', 'error');
    }
}
```

}

function openModalClimaManual() {
document.getElementById(‘modalClimaManual’).classList.add(‘active’);
}

function closeModalClimaManual() {
document.getElementById(‘modalClimaManual’).classList.remove(‘active’);
}

function handleSalvarClimaManual() {
const temperatura = parseFloat(document.getElementById(‘climaTemp’).value);
const umidade = parseFloat(document.getElementById(‘climaUmidade’).value);
const vento = parseFloat(document.getElementById(‘climaVento’).value);

```
if (isNaN(temperatura) || isNaN(umidade) || isNaN(vento)) {
    showToast('Preencha todos os campos', 'warning');
    return;
}

const registro = {
    timestamp: new Date().toISOString(),
    temperatura,
    umidade,
    vento,
    origem: 'Manual'
};

adicionarRegistroClima(registro);
closeModalClimaManual();
document.getElementById('formClimaManual').reset();
showToast('Clima registrado manualmente!', 'success');
```

}

function adicionarRegistroClima(registro) {
// Calcular semáforo
registro.semaforo = calcularSemaforo(registro.temperatura, registro.umidade, registro.vento);

```
appState.atendimentoAtivo.clima_logs.push(registro);
saveToStorage();
updateClimaPage();

// Atualizar checklist
if (appState.atendimentoAtivo) {
    updateChecklist();
}
```

}

function calcularSemaforo(temp, umidade, vento) {
const motivos = [];

```
// Verificar vento
if (vento < 3) {
    motivos.push('Vento muito fraco (< 3 km/h)');
} else if (vento > 14) {
    motivos.push('Vento muito forte (> 14 km/h)');
}

// Verificar temperatura
if (temp > 33) {
    motivos.push('Temperatura muito alta (> 33°C)');
}

// Verificar umidade
if (umidade < 45) {
    motivos.push('Umidade muito baixa (< 45%)');
}

// Determinar status
if (motivos.length > 0) {
    return {
        status: 'VERMELHO',
        cor: 'vermelho',
        motivos
    };
}

// Verificar condições amarelas
if (vento >= 10 && vento <= 14) {
    motivos.push('Vento entre 10-14 km/h');
}
if (temp >= 30 && temp <= 33) {
    motivos.push('Temperatura entre 30-33°C');
}
if (umidade >= 45 && umidade <= 55) {
    motivos.push('Umidade entre 45-55%');
}

if (motivos.length > 0) {
    return {
        status: 'AMARELO',
        cor: 'amarelo',
        motivos
    };
}

// Condições verdes
return {
    status: 'VERDE',
    cor: 'verde',
    motivos: ['Condições ideais para pulverização']
};
```

}

function renderClimaLista() {
const lista = document.getElementById(‘climaLista’);

```
if (!appState.atendimentoAtivo.clima_logs || appState.atendimentoAtivo.clima_logs.length === 0) {
    lista.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">🌤️</span>
            <p>Nenhum registro climático</p>
        </div>
    `;
    return;
}

const sorted = [...appState.atendimentoAtivo.clima_logs].reverse();

lista.innerHTML = sorted.map(registro => `
    <div class="clima-item">
        <div class="clima-item-header">
            <div class="clima-hora">${formatTime(registro.timestamp)}</div>
            <div class="clima-origem ${registro.origem.toLowerCase()}">${registro.origem}</div>
        </div>
        <div class="clima-dados">
            <div>
                <strong>Temperatura</strong>
                <span>${registro.temperatura.toFixed(1)}°C</span>
            </div>
            <div>
                <strong>Umidade</strong>
                <span>${registro.umidade.toFixed(0)}%</span>
            </div>
            <div>
                <strong>Vento</strong>
                <span>${registro.vento.toFixed(1)} km/h</span>
            </div>
            <div>
                <strong>Status</strong>
                <span style="color: var(--status-${registro.semaforo.cor}); font-weight: 700;">
                    ${registro.semaforo.status}
                </span>
            </div>
        </div>
    </div>
`).join('');
```

}

function atualizarSemaforoAtual() {
const indicator = document.getElementById(‘semaforoIndicator’);
const status = document.getElementById(‘semaforoStatus’);
const motivo = document.getElementById(‘semaforoMotivo’);

```
if (!appState.atendimentoAtivo.clima_logs || appState.atendimentoAtivo.clima_logs.length === 0) {
    indicator.className = 'semaforo-indicator';
    status.textContent = 'Aguardando leitura';
    motivo.textContent = '';
    return;
}

const ultimo = appState.atendimentoAtivo.clima_logs[appState.atendimentoAtivo.clima_logs.length - 1];
const semaforo = ultimo.semaforo;

indicator.className = `semaforo-indicator ${semaforo.cor}`;
status.textContent = semaforo.status;
motivo.textContent = semaforo.motivos.join(' • ');
```

}

// ========== Fila de Envio ==========
function updateFilaPage() {
const lista = document.getElementById(‘filaLista’);

```
const prontos = appState.atendimentos.filter(a => 
    a.status === APP_CONFIG.statusAtendimento.PRONTO_ENVIO || 
    a.status === APP_CONFIG.statusAtendimento.FALHA
);

if (prontos.length === 0) {
    lista.innerHTML = `
        <div class="empty-state">
            <span class="empty-icon">📤</span>
            <p>Nenhum relatório na fila</p>
            <p class="subtitle-sm">Finalize um atendimento para enviá-lo</p>
        </div>
    `;
    return;
}

lista.innerHTML = prontos.map(atendimento => `
    <div class="fila-item">
        <div class="fila-header">
            <div class="fila-title">${atendimento.proprietario}</div>
            <div class="atendimento-badge ${atendimento.status}">
                ${getStatusLabel(atendimento.status)}
            </div>
        </div>
        <div class="fila-info">
            <div><strong>Fazenda:</strong> ${atendimento.fazenda}</div>
            <div><strong>Data:</strong> ${formatDateTime(atendimento.timestamp_inicio)}</div>
        </div>
        <div class="fila-actions">
            <button class="btn btn-primary" onclick="enviarRelatorio('${atendimento.id}')">
                <span class="btn-icon">📧</span>
                Enviar Relatório
            </button>
        </div>
    </div>
`).join('');
```

}

async function enviarRelatorio(id) {
const atendimento = appState.atendimentos.find(a => a.id === id);
if (!atendimento) return;

```
if (!appState.config.emailjs.serviceId || !appState.config.emailjs.templateId) {
    showToast('Configure o EmailJS nas configurações', 'warning');
    navigateToPage('configuracoes');
    return;
}

showLoading('Enviando relatório...');

try {
    const relatorio = gerarRelatorioTexto(atendimento);
    
    const templateParams = {
        to_email: appState.config.emailjs.emailDestino,
        proprietario: atendimento.proprietario,
        fazenda: atendimento.fazenda,
        operador: atendimento.operador,
        data: formatDateTime(atendimento.timestamp_inicio),
        relatorio: relatorio
    };
    
    await emailjs.send(
        appState.config.emailjs.serviceId,
        appState.config.emailjs.templateId,
        templateParams
    );
    
    // Atualizar status
    atendimento.status = APP_CONFIG.statusAtendimento.ENVIADO;
    saveToStorage();
    
    hideLoading();
    showToast('Relatório enviado com sucesso!', 'success');
    updateFilaPage();
    updateDashboard();
    
} catch (error) {
    hideLoading();
    console.error('Erro ao enviar:', error);
    atendimento.status = APP_CONFIG.statusAtendimento.FALHA;
    saveToStorage();
    showToast('Erro ao enviar relatório. Tente novamente.', 'error');
    updateFilaPage();
}
```

}

# function gerarRelatorioTexto(atendimento) {
let relatorio = `

# RELATÓRIO DE PULVERIZAÇÃO AGRÍCOLA
AGROTESP PULVERIZAÇÃO

## DADOS DO CLIENTE

Proprietário: ${atendimento.proprietario}
Fazenda/Local: ${atendimento.fazenda}
Operador: ${atendimento.operador}

## LOCALIZAÇÃO

Município: ${atendimento.municipio}
Estado: ${atendimento.estado}
Latitude: ${atendimento.latitude.toFixed(6)}
Longitude: ${atendimento.longitude.toFixed(6)}
Precisão GPS: ${atendimento.precisao.toFixed(2)} m
Data/Hora GPS: ${formatDateTime(atendimento.timestamp_gps)}

`;

```
// Produtos
if (atendimento.produtos && atendimento.produtos.length > 0) {
    relatorio += `
```

## PRODUTOS APLICADOS

`; atendimento.produtos.forEach((produto, i) => { relatorio += `
${i + 1}. ${produto.nome}
Tipo: ${produto.tipo}
${produto.ingrediente ? `Ingrediente Ativo: ${produto.ingrediente}\n   ` : ‘’}${produto.fabricante ? `Fabricante: ${produto.fabricante}\n   ` : ‘’}${produto.lote ? `Lote: ${produto.lote}\n   ` : ‘’}Dose: ${produto.dose} L/ha
${produto.quantidadeTotal ? `Quantidade Total: ${produto.quantidadeTotal.toFixed(2)} L\n` : ‘’}${produto.observacoes ? `   Observações: ${produto.observacoes}\n` : ‘’}`;
});
}

```
// Cálculos
if (atendimento.calculos) {
    const calc = atendimento.calculos;
    relatorio += `
```

## PLANEJAMENTO OPERACIONAL

Área Total: ${calc.areaTotal} ha
Taxa de Aplicação: ${calc.taxaAplicacao} L/ha
Capacidade do Tanque: ${calc.capacidadeTanque} L
Produtividade: ${calc.produtividade} ha/h
Margem Operacional: ${calc.margemOperacional}%

Calda Total: ${calc.caldaTotal.toFixed(2)} L
Número de Abastecimentos: ${calc.numAbastecimentos}
Área por Tanque: ${calc.areaPorTanque.toFixed(2)} ha
Voos Estimados: ${calc.numVoos}
Tempo Estimado: ${Math.floor(calc.tempoEstimado)}h ${Math.round((calc.tempoEstimado - Math.floor(calc.tempoEstimado)) * 60)}min
`;
}

```
// Clima
if (atendimento.clima_logs && atendimento.clima_logs.length > 0) {
    relatorio += `
```

## REGISTRO CLIMÁTICO

`; atendimento.clima_logs.forEach((registro, i) => { relatorio += `
${formatTime(registro.timestamp)} - ${registro.origem}
Temperatura: ${registro.temperatura.toFixed(1)}°C
Umidade: ${registro.umidade.toFixed(0)}%
Vento: ${registro.vento.toFixed(1)} km/h
Status: ${registro.semaforo.status}
${registro.semaforo.motivos.join(’, ’)}
`;
});
}

```
// Observações
if (atendimento.observacoes) {
    relatorio += `
```

## OBSERVAÇÕES

${atendimento.observacoes}
`;
}

```
relatorio += `
```

# ========================================
Relatório gerado em: ${formatDateTime(new Date().toISOString())}
AGROTESP Pulverização - Sistema v${APP_CONFIG.version}

`;

```
return relatorio;
```

}

// ========== Configurações ==========
function updateConfigPage() {
// EmailJS
document.getElementById(‘emailjsServiceId’).value = appState.config.emailjs.serviceId || ‘’;
document.getElementById(‘emailjsTemplateId’).value = appState.config.emailjs.templateId || ‘’;
document.getElementById(‘emailjsPublicKey’).value = appState.config.emailjs.publicKey || ‘’;
document.getElementById(‘emailDestino’).value = appState.config.emailjs.emailDestino || ‘’;

```
// API Keys
document.getElementById('weatherApiKey').value = appState.apiKeys.weather || '';
```

}

function handleSalvarConfig() {
appState.config.emailjs = {
serviceId: document.getElementById(‘emailjsServiceId’).value.trim(),
templateId: document.getElementById(‘emailjsTemplateId’).value.trim(),
publicKey: document.getElementById(‘emailjsPublicKey’).value.trim(),
emailDestino: document.getElementById(‘emailDestino’).value.trim()
};

```
if (appState.config.emailjs.publicKey) {
    emailjs.init(appState.config.emailjs.publicKey);
}

saveToStorage();
showToast('Configurações do EmailJS salvas!', 'success');
```

}

function handleSalvarApiKeys() {
appState.apiKeys.weather = document.getElementById(‘weatherApiKey’).value.trim();
saveToStorage();
showToast(‘API Keys salvas!’, ‘success’);
}

function handleExportarDados() {
const dados = {
atendimentos: appState.atendimentos,
config: appState.config,
exportadoEm: new Date().toISOString()
};

```
const json = JSON.stringify(dados, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `agrotesp-backup-${formatDateForFilename()}.json`;
a.click();

URL.revokeObjectURL(url);
showToast('Dados exportados com sucesso!', 'success');
```

}

function handleLimparDados() {
if (!confirm(‘ATENÇÃO: Todos os dados serão apagados permanentemente. Deseja continuar?’)) return;
if (!confirm(‘Tem certeza absoluta? Esta ação não pode ser desfeita!’)) return;

```
localStorage.clear();
appState = {
    atendimentos: [],
    atendimentoAtivo: null,
    config: { emailjs: {} },
    apiKeys: {},
    lastWeatherAttempt: null,
    weatherManualMode: false
};

showToast('Todos os dados foram apagados!', 'info');
navigateToPage('dashboard');
updateDashboard();
```

}

// ========== Utilities ==========
function generateId() {
return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatDateTime(isoString) {
if (!isoString) return ‘N/A’;
const date = new Date(isoString);
return date.toLocaleString(‘pt-BR’);
}

function formatTime(isoString) {
if (!isoString) return ‘N/A’;
const date = new Date(isoString);
return date.toLocaleTimeString(‘pt-BR’, { hour: ‘2-digit’, minute: ‘2-digit’ });
}

function formatDateForFilename() {
const now = new Date();
return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

function showLoading(text = ‘Processando…’) {
document.getElementById(‘loadingText’).textContent = text;
document.getElementById(‘loadingOverlay’).classList.add(‘active’);
}

function hideLoading() {
document.getElementById(‘loadingOverlay’).classList.remove(‘active’);
}

function showToast(message, type = ‘info’) {
const container = document.getElementById(‘toastContainer’);

```
const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
};

const toast = document.createElement('div');
toast.className = `toast ${type}`;
toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
        <div class="toast-message">${message}</div>
    </div>
`;

container.appendChild(toast);

setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
}, 3000);
```

}