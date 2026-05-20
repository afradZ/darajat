// --- GLOBAL VARIABLES --- 
let allMessages = [];
let filteredMessages = [];
let currentMsgPage = 1;
let currentInscPage = 1;
const rowsPerPage = 10;

// --- Neutralizes HTML tags to prevent XSS execution ---
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- AUTHENTICATION ---
function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
    };
}

function handleLogout() {
    localStorage.removeItem('admin_token');
    document.getElementById('login-overlay').classList.remove('hidden');
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    
    const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    });
    
    const data = await res.json();
    
    if (data.success) {
        localStorage.setItem('admin_token', data.token);
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('login-error').style.display = 'none';
        fetchDashboardData();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

// 1. DATA FETCHING 
async function fetchDashboardData() {
    const token = localStorage.getItem('admin_token');
    if (!token) return handleLogout();

    const headers = getAuthHeaders();

    // 1. Fetch Messages (Still handled in-memory for now)
    const msgResponse = await fetch('http://localhost:3000/api/admin/messages', { headers });
    if (msgResponse.status === 401 || msgResponse.status === 403) return handleLogout();
    const msgResult = await msgResponse.json();
    if (msgResult.success) {
        allMessages = msgResult.data;
        filtrerMessages();
    }

    // 2. Fetch Inscriptions (Server-side paginated)
    fetchInscriptions();

    // 3. Restore View
    const savedView = localStorage.getItem('active_admin_view') || 'dashboard';
    switchView(savedView);
}

async function fetchInscriptions() {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const query = document.getElementById('search-etudiants')?.value || document.getElementById('search-insc')?.value || '';
    const status = document.getElementById('filter-status')?.value || 'all';
    const formation = document.getElementById('filter-formation')?.value || 'all';

    try {
        const res = await fetch(`http://localhost:3000/api/admin/inscriptions?page=${currentInscPage}&limit=${rowsPerPage}&search=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}&formation=${encodeURIComponent(formation)}`, {
            headers: getAuthHeaders()
        });
        
        const result = await res.json();
        
        if (result.success) {
            // Read the dedicated unread count from the server meta tag
            document.getElementById('count-inscriptions').innerText = result.meta.unreadItems;
            renderInscriptions(result.data, result.meta);
        }
    } catch (err) {
        console.error("Erreur fetch inscriptions:", err);
    }
}

// 2. FILTERS
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

function filtrerBaseEtudiants() {
    currentInscPage = 1; 
    fetchInscriptions();
}

function filtrerInscriptions() {
    filtrerBaseEtudiants(); 
}

// 3. COUNTERS 
function updateMessageCount() {
    const unread = filteredMessages.filter(m => m.statut !== 'lu').length;
    document.getElementById('count-messages').innerText = unread;
}

// 4. RENDERING TABLES
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
            ? `<button class="btn-action btn-check" onclick="marquerCommeLuMessage('${msg.id}')" title="Marquer comme lu"><i class="fa-solid fa-check"></i></button>`
            : `<button class="btn-action" style="background:#10b981;opacity:0.4;cursor:default;" disabled title="Déjà lu"><i class="fa-solid fa-check"></i></button>`;

        html += `
        <tr class="${isNew ? 'row-new' : ''}">
            <td><span class="status-dot ${isNew ? 'new' : ''}"></span></td>
            <td>
                <b>${escapeHTML(msg.nom)}</b><br>
                <small style="color:#64748b;">${escapeHTML(msg.email)}</small>
            </td>
            <td>${escapeHTML(msg.message)}</td>
            <td>
                <div class="actions-cell">
                    <a href="mailto:${escapeHTML(msg.email)}" class="btn-action btn-mail" title="Envoyer un email">
                        <i class="fa-solid fa-envelope"></i>
                    </a>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${checkBtn}
                        <button class="btn-action" style="background:#ef4444;" onclick="supprimerMessage('${msg.id}')" title="Supprimer">
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

function renderInscriptions(dataChunk, meta) {
    const isDashboard = !document.getElementById('view-dashboard').classList.contains('hidden');
    const tbody = document.getElementById(isDashboard ? 'inscriptions-body' : 'base-etudiants-body');
    const emptyState = document.getElementById('empty-inscriptions'); 
    const paginationId = isDashboard ? 'inscriptions-pagination' : 'base-etudiants-pagination'; 
    
    tbody.innerHTML = "";

    if (dataChunk.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px;">Aucun étudiant trouvé.</td></tr>`;
        if (emptyState && isDashboard) emptyState.style.display = 'block';
        if (paginationId) document.getElementById(paginationId).innerHTML = '';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = dataChunk.map(etu => {
        let telClean = etu.telephone.replace(/\D/g, '');
        if (telClean.startsWith('0') && telClean.length === 10) telClean = '212' + telClean.substring(1);
        else if (!telClean.startsWith('212')) telClean = '212' + telClean;

        const currentStatus = etu.statut_scolaire || 'En cours';
        const isNew = etu.statut !== 'lu';
        const safeName = etu.nom_complet.replace(/\\/g, '\\\\').replace(/['’]/g, "\\'").replace(/"/g, "&quot;").replace(/</g, "&lt;");
        const safeFormation = etu.formation.replace(/\\/g, '\\\\').replace(/['’]/g, "\\'").replace(/"/g, "&quot;").replace(/</g, "&lt;");

        const dotHtml = isDashboard ? `<td><span class="status-dot ${isNew ? 'new' : ''}"></span></td>` : '';
        
        let checkBtn = '';
        if (isDashboard) {
            checkBtn = isNew 
                ? `<button class="btn-action btn-check" onclick="marquerCommeLuInscription('${etu.id}')" title="Marquer comme lu"><i class="fa-solid fa-check"></i></button>`
                : `<button class="btn-action" style="background:#10b981;opacity:0.4;cursor:default;" disabled title="Déjà lu"><i class="fa-solid fa-check"></i></button>`;
        }

        return `
        <tr class="${isNew && isDashboard ? 'row-new' : ''}">
            ${dotHtml}
            <td>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                    <b>${escapeHTML(etu.nom_complet)}</b>
                    <span style="font-family: monospace; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;" title="ID Étudiant">
                        #${etu.id}
                    </span>
                </div>
                <small style="color:#64748b;">${escapeHTML(etu.email)}</small>
            </td>
            ${isDashboard ? `<td><span class="badge">${escapeHTML(etu.formation)}</span></td>` : `<td><small style="color:#64748b;">${escapeHTML(etu.telephone)}</small></td><td>${escapeHTML(etu.formation)}</td>`}
            <td>
                <select onchange="updateStatutEtudiant('${etu.id}', this.value)" style="padding:4px; border-radius:4px; border:1px solid #cbd5e1; font-size:0.85rem;">
                    <option value="En cours" ${currentStatus === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Diplômé" ${currentStatus === 'Diplômé' ? 'selected' : ''}>Diplômé</option>
                    <option value="Abandon" ${currentStatus === 'Abandon' ? 'selected' : ''}>Abandon</option>
                </select>
            </td>
            <td>
                <div class="actions-cell">
                    <a href="https://wa.me/${telClean}" target="_blank" class="btn-action btn-wa" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
                    <button class="btn-action" style="background:#f59e0b;" onclick="prefillCertificate('${safeName}', '${safeFormation}')" title="Créer Attestation">
                        <i class="fa-solid fa-certificate"></i>
                    </button>
                    ${isDashboard ? `<div style="display:flex;flex-direction:column;gap:6px;">${checkBtn}</div>` : ''}
                    <button class="btn-action" style="background:#ef4444;" onclick="supprimerInscription('${etu.id}')" title="Supprimer">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    if (paginationId) {
        renderPaginationControls(paginationId, meta.totalItems, meta.currentPage, (newPage) => {
            currentInscPage = newPage;
            fetchInscriptions();
        });
    }
}

// 5. ACTIONS  
async function marquerCommeLuMessage(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/messages/${id}/lu`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) {
            const msg = allMessages.find(m => m.id === id);
            if (msg) msg.statut = 'lu';
            updateMessageCount();
            renderMessages();
        }
    } catch (error) {
        console.error("Erreur PUT message lu:", error);
    }
}

async function supprimerMessage(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/messages/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) {
            allMessages = allMessages.filter(m => m.id !== id);
            filtrerMessages();
        }
    } catch (error) {
        console.error("Erreur DELETE message:", error);
    }
}

async function updateStatutEtudiant(id, nouveauStatut) {
    try {
        const res = await fetch(`http://localhost:3000/api/admin/etudiants/${id}/statut`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ statut_scolaire: nouveauStatut })
        });
        if (res.ok) fetchInscriptions(); 
    } catch (err) {
        alert("Erreur lors de la mise à jour du statut.");
    }
}

async function supprimerInscription(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette inscription ?")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/inscriptions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) fetchInscriptions(); 
    } catch (error) {
        console.error("Erreur DELETE inscription:", error);
    }
}

async function marquerCommeLuInscription(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/inscriptions/${id}/lu`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) fetchInscriptions(); 
    } catch (error) {
        console.error("Erreur PUT lu:", error);
    }
}

async function ajouterEtudiantManuel(e) {
    e.preventDefault();
    
    let rawTel = document.getElementById('ajout-tel').value.replace(/\D/g, ''); 
    if (rawTel.startsWith('212')) rawTel = rawTel.substring(3); 
    if (rawTel.startsWith('0')) rawTel = rawTel.substring(1);   
    const finalTel = '+212' + rawTel; 

    const payload = {
        nom: document.getElementById('ajout-nom').value.trim(),
        email: document.getElementById('ajout-email').value.trim() || 'Non renseigné',
        telephone: finalTel, 
        formation: document.getElementById('ajout-formation').value
    };

    try {
        const res = await fetch('http://localhost:3000/api/admin/etudiants', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (data.success) {
            closeAjoutModal();
            fetchInscriptions(); 
        } else {
            alert(data.message || "Erreur serveur");
        }
    } catch (err) {
        console.error(err);
        alert("Erreur de connexion au serveur");
    }
}

// --- CERTIFICATE GENERATION ---
async function genererAttestation(e) {
    e.preventDefault(); 

    const nom = document.getElementById('nom-etudiant').value.trim();
    const formation = document.getElementById('formation-etudiant').value.trim();
    const resultDiv = document.getElementById('resultat-attestation');

    try {
        const response = await fetch('http://localhost:3000/api/admin/attestations', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ nom_etudiant: nom, formation: formation })
        });
        
        const data = await response.json();

        if (data.success) {
            resultDiv.style.display = 'block';
            resultDiv.style.background = '#f0fdf4';
            resultDiv.style.color = '#166534';
            resultDiv.style.border = '1px solid #bbf7d0';
            resultDiv.innerHTML = `Succès ! Le code pour <b>${nom}</b> est : <span style="font-size: 1.2rem; margin-left: 10px; padding: 4px 10px; background: white; border-radius: 4px; border: 1px dashed #166534;">${data.data.code_unique}</span>`;
            
            document.getElementById('nom-etudiant').value = ''; 
            document.getElementById('formation-etudiant').value = ''; 
        } else {
            throw new Error(data.message || 'Erreur serveur');
        }
    } catch (error) {
        resultDiv.style.display = 'block';
        resultDiv.style.background = '#fef2f2';
        resultDiv.style.color = '#991b1b';
        resultDiv.style.border = '1px solid #fecaca';
        resultDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${error.message}`;
    }
}

// --- VIEW ROUTING & MODALS ---
function switchView(viewName) {
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-etudiants').classList.add('hidden');
    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    const isDash = viewName === 'dashboard';
    document.getElementById('nav-btn-dashboard').style.background = isDash ? 'var(--primary)' : 'transparent';
    document.getElementById('nav-btn-dashboard').style.color = isDash ? 'white' : 'var(--primary)';
    
    document.getElementById('nav-btn-etudiants').style.background = !isDash ? 'var(--primary)' : 'transparent';
    document.getElementById('nav-btn-etudiants').style.color = !isDash ? 'white' : 'var(--primary)';
    
    localStorage.setItem('active_admin_view', viewName);

    if(viewName === 'etudiants') renderBaseEtudiants();
}

function prefillCertificate(nom, formation) {
    document.getElementById('nom-etudiant').value = nom;
    document.getElementById('formation-etudiant').value = formation;
    
    const resultDiv = document.getElementById('resultat-attestation');
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    
    document.getElementById('cert-modal-overlay').classList.remove('hidden');
}

function closeCertModal() {
    document.getElementById('cert-modal-overlay').classList.add('hidden');
}

function openAjoutModal() {
    document.getElementById('ajout-modal-overlay').classList.remove('hidden');
}

function closeAjoutModal() {
    document.getElementById('ajout-modal-overlay').classList.add('hidden');
    document.getElementById('form-ajout-etudiant').reset();
}
 
// 6. PAGINATION BUILDER  
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

// INIT
window.onload = () => {
    if (localStorage.getItem('admin_token')) {
        document.getElementById('login-overlay').classList.add('hidden');
        fetchDashboardData();
    }
    
    document.getElementById('search-msg').addEventListener('input', debounce(filtrerMessages, 300));
    document.getElementById('search-insc').addEventListener('input', debounce(filtrerInscriptions, 300));
};