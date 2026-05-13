// --- GLOBAL VARIABLES --- 
let allMessages = [];
let allInscriptions = [];
let filteredMessages = [];
let filteredInscriptions = [];
let currentMsgPage = 1;
let currentInscPage = 1;
const rowsPerPage = 5;
 
// 1. DATA FETCHING 

async function fetchDashboardData() {
    try {
        const msgResponse = await fetch('http://localhost:3000/api/admin/messages');
        const msgResult = await msgResponse.json();
        if (msgResult.success) {
            allMessages = msgResult.data;
            filtrerMessages();
        }

        const inscResponse = await fetch('http://localhost:3000/api/admin/inscriptions');
        const inscResult = await inscResponse.json();
        if (inscResult.success) {
            allInscriptions = inscResult.data;
            filtrerInscriptions();
        }
    } catch (error) {
        console.error("Erreur de chargement des données:", error);
    }
}

// 2. LIVE SEARCH / FILTER 

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function filtrerMessages() {
    const query = document.getElementById('search-msg').value.toLowerCase().trim();
    filteredMessages = allMessages.filter(msg =>
        msg.nom.toLowerCase().includes(query) ||
        msg.email.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query)
    );
    currentMsgPage = 1;
    updateMessageCount();
    renderMessages();
}

function filtrerInscriptions() {
    const query = document.getElementById('search-insc').value.toLowerCase().trim();
    filteredInscriptions = allInscriptions.filter(insc =>
        insc.nom_complet.toLowerCase().includes(query) ||
        insc.email.toLowerCase().includes(query) ||
        insc.telephone.toLowerCase().includes(query) ||
        insc.formation.toLowerCase().includes(query)
    );
    currentInscPage = 1;
    updateInscriptionCount();
    renderInscriptions();
}

// 3. COUNTERS 

function updateMessageCount() {
    const unread = filteredMessages.filter(m => m.statut !== 'lu').length;
    document.getElementById('count-messages').innerText = unread;
}

function updateInscriptionCount() {
    const unread = filteredInscriptions.filter(i => i.statut !== 'lu').length;
    document.getElementById('count-inscriptions').innerText = unread;
}
 
// 4. RENDERING TABLES WITH PAGINATION 

function renderMessages() {
    const tbody = document.getElementById('messages-body');
    const emptyState = document.getElementById('empty-messages');
    const pagination = document.getElementById('messages-pagination');
    tbody.innerHTML = "";

    if (filteredMessages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#64748b;">Aucun résultat.</td></tr>`;
        emptyState.style.display = 'block';
        pagination.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';

    const start = (currentMsgPage - 1) * rowsPerPage;
    const paginatedMessages = filteredMessages.slice(start, start + rowsPerPage);

    let html = "";
    paginatedMessages.forEach(msg => {
        const isNew = msg.statut !== 'lu';
        const checkBtn = isNew
            ? `<button class="btn-action btn-check" onclick="marquerCommeLuMessage(${msg.id})" title="Marquer comme lu"><i class="fa-solid fa-check"></i></button>`
            : `<button class="btn-action" style="background:#10b981;opacity:0.4;cursor:default;" disabled title="Déjà lu"><i class="fa-solid fa-check"></i></button>`;

        html += `
        <tr class="${isNew ? 'row-new' : ''}">
            <td><span class="status-dot ${isNew ? 'new' : ''}"></span></td>
            <td>
                <b>${msg.nom}</b><br>
                <small style="color:#64748b;">${msg.email}</small>
            </td>
            <td>${msg.message}</td>
            <td>
                <div class="actions-cell">
                    <a href="mailto:${msg.email}" class="btn-action btn-mail" title="Envoyer un email">
                        <i class="fa-solid fa-envelope"></i>
                    </a>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${checkBtn}
                        <button class="btn-action" style="background:#ef4444;" onclick="supprimerMessage(${msg.id})" title="Supprimer">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;

    renderPaginationControls('messages-pagination', filteredMessages.length, currentMsgPage, (newPage) => {
        currentMsgPage = newPage;
        renderMessages();
    });
}

function renderInscriptions() {
    const tbody = document.getElementById('inscriptions-body');
    const emptyState = document.getElementById('empty-inscriptions');
    const pagination = document.getElementById('inscriptions-pagination');
    tbody.innerHTML = "";

    if (filteredInscriptions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#64748b;">Aucun résultat.</td></tr>`;
        emptyState.style.display = 'block';
        pagination.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';

    const start = (currentInscPage - 1) * rowsPerPage;
    const paginatedInscriptions = filteredInscriptions.slice(start, start + rowsPerPage);

    let html = "";
    paginatedInscriptions.forEach(insc => {
        const isNew = insc.statut !== 'lu';
        const telClean = insc.telephone.replace(/\D/g, '');
        const checkBtn = isNew
            ? `<button class="btn-action btn-check" onclick="marquerCommeLuInscription(${insc.id})" title="Marquer comme lu"><i class="fa-solid fa-check"></i></button>`
            : `<button class="btn-action" style="background:#10b981;opacity:0.4;cursor:default;" disabled title="Déjà lu"><i class="fa-solid fa-check"></i></button>`;

        html += `
        <tr class="${isNew ? 'row-new' : ''}">
            <td><span class="status-dot ${isNew ? 'new' : ''}"></span></td>
            <td>
                <b>${insc.nom_complet}</b><br>
                <small style="color:#64748b;">${insc.email}</small>
            </td>
            <td><span class="badge">${insc.formation}</span></td>
            <td>
                <div class="actions-cell">
                    <a href="mailto:${insc.email}" class="btn-action btn-mail" title="Envoyer un email">
                        <i class="fa-solid fa-envelope"></i>
                    </a>
                    <a href="https://wa.me/${telClean}" target="_blank" class="btn-action btn-wa" title="WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${checkBtn}
                        <button class="btn-action" style="background:#ef4444;" onclick="supprimerInscription(${insc.id})" title="Supprimer">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;

    renderPaginationControls('inscriptions-pagination', filteredInscriptions.length, currentInscPage, (newPage) => {
        currentInscPage = newPage;
        renderInscriptions();
    });
}

// 5. ACTIONS  

async function marquerCommeLuMessage(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/messages/${id}/lu`, {
            method: 'PUT'
        });
        const result = await response.json();

        if (result.success) {
            const msg = allMessages.find(m => m.id === id);
            if (msg) msg.statut = 'lu';
            updateMessageCount();
            renderMessages();
        } else {
            alert("Erreur lors du marquage du message.");
        }
    } catch (error) {
        console.error("Erreur PUT message lu:", error);
        alert("Impossible de contacter le serveur.");
    }
}

async function marquerCommeLuInscription(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/inscriptions/${id}/lu`, {
            method: 'PUT'
        });
        const result = await response.json();

        if (result.success) {
            const insc = allInscriptions.find(i => i.id === id);
            if (insc) insc.statut = 'lu';
            updateInscriptionCount();
            renderInscriptions();
        } else {
            alert("Erreur lors du marquage de l'inscription.");
        }
    } catch (error) {
        console.error("Erreur PUT inscription lu:", error);
        alert("Impossible de contacter le serveur.");
    }
}

async function supprimerMessage(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/messages/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            allMessages = allMessages.filter(m => m.id !== id);
            filtrerMessages();
        } else {
            alert("Erreur lors de la suppression du message.");
        }
    } catch (error) {
        console.error("Erreur DELETE message:", error);
        alert("Impossible de contacter le serveur.");
    }
}

async function supprimerInscription(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette inscription ?")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/inscriptions/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            allInscriptions = allInscriptions.filter(i => i.id !== id);
            filtrerInscriptions();
        } else {
            alert("Erreur lors de la suppression de l'inscription.");
        }
    } catch (error) {
        console.error("Erreur DELETE inscription:", error);
        alert("Impossible de contacter le serveur.");
    }
}
 
// 6. PAGINATION BUTTON BUILDER  

function renderPaginationControls(containerId, totalItems, currentPage, onPageChange) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.innerText = i;
        pageBtn.onclick = () => onPageChange(i);
        container.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    container.appendChild(nextBtn);
}

window.onload = () => {
    fetchDashboardData();
    
    // Bind debounced search listeners
    document.getElementById('search-msg').addEventListener('input', debounce(filtrerMessages, 300));
    document.getElementById('search-insc').addEventListener('input', debounce(filtrerInscriptions, 300));
};