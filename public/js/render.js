function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const formatMailtoParams = (email) => {
    if (!email) return '';
    return encodeURIComponent(email.trim()).replace(/%40/g, '@');
};

const getStatusStyle = (status) => {
    if (status === 'Diplômé') return 'background-color: #f0fdf4; color: #166534; border-color: #bbf7d0;';
    if (status === 'Abandon') return 'background-color: #fef2f2; color: #991b1b; border-color: #fecaca;';
    return 'background-color: #eff6ff; color: #1d4ed8; border-color: #bfdbfe;'; 
};

window.handleStatusChange = function(selectElement, studentId) {
    // Optimistic UI: Instantly inject the new color scheme
    const baseStyle = 'padding:4px; border-radius:4px; border:1px solid; font-size:0.85rem; font-weight:600; cursor:pointer; outline:none; transition: all 0.2s ease; ';
    selectElement.style.cssText = baseStyle + getStatusStyle(selectElement.value);
    
    // Dispatch the API call in the background
    updateStatutEtudiant(studentId, selectElement.value);
};

window.triggerMailApp = function(rawEmail) {
    if (!rawEmail) return;
    
    // Attempt the protocol launch via synthetic click
    const link = document.createElement('a');
    link.href = `mailto:${formatMailtoParams(rawEmail)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Fallback UX: Copy to clipboard automatically
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(rawEmail).then(() => {
            console.log(`Fallback: ${rawEmail} copié dans le presse-papiers.`);
        }).catch(err => console.error("Erreur presse-papiers:", err));
    }
};

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
                    <a href="mailto:${formatMailtoParams(msg.email)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-mail" title="Envoyer un email">
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
        
        // Double-escaped for JS function injection inside HTML
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
            ${!isDashboard ? `
            <td>
                <select onchange="updateStatutEtudiant('${etu.id}', this.value, this)" data-previous-value="${escapeHTML(currentStatus)}" style="padding:4px; border-radius:4px; border:1px solid; font-size:0.85rem; font-weight:600; cursor:pointer; outline:none; transition: all 0.2s ease; ${getStatusStyle(currentStatus)}">
                    <option value="En cours" style="background:white; color:#334155; font-weight:normal;" ${currentStatus === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Diplômé" style="background:white; color:#334155; font-weight:normal;" ${currentStatus === 'Diplômé' ? 'selected' : ''}>Diplômé</option>
                    <option value="Abandon" style="background:white; color:#334155; font-weight:normal;" ${currentStatus === 'Abandon' ? 'selected' : ''}>Abandon</option>
                </select>
            </td>
            ` : ''}
            <td>
                <div class="actions-cell">
                    ${isDashboard ? `
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${checkBtn}
                        <button class="btn-action" style="background:#ef4444;" onclick="supprimerInscription('${etu.id}')" title="Supprimer">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    ` : `
                    <a href="https://wa.me/${telClean}" target="_blank" class="btn-action btn-wa" title="WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                    
                    <a href="mailto:${formatMailtoParams(etu.email)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-mail" title="Envoyer un email">
                        <i class="fa-solid fa-envelope"></i>
                    </a>

                    <button class="btn-action" style="background:#f59e0b;" onclick="prefillCertificate('${safeName}', '${safeFormation}')" title="Créer Attestation">
                        <i class="fa-solid fa-certificate"></i>
                    </button>
                    
                    <button class="btn-action" style="background:#ef4444;" onclick="supprimerInscription('${etu.id}')" title="Supprimer">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    `}
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