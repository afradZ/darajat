function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json'
    };
}

async function fetchDashboardData() {
    const token = localStorage.getItem('admin_token');
    if (!token) return handleLogout();

    const headers = getAuthHeaders();

    const msgResponse = await fetch('https://darajat-sq11.onrender.com/api/admin/messages', { headers });
    if (msgResponse.status === 401 || msgResponse.status === 403) return handleLogout();
    const msgResult = await msgResponse.json();
    if (msgResult.success) {
        allMessages = msgResult.data;
        filtrerMessages();
    }

    fetchInscriptions();

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
        const res = await fetch(`https://darajat-sq11.onrender.com/api/admin/inscriptions?page=${currentInscPage}&limit=${rowsPerPage}&search=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}&formation=${encodeURIComponent(formation)}`, {
            headers: getAuthHeaders()
        });
        
        const result = await res.json();
        
        if (result.success) {
            document.getElementById('count-inscriptions').innerText = result.meta.unreadItems;
            renderInscriptions(result.data, result.meta);
        }
    } catch (err) {
        console.error("Erreur fetch inscriptions:", err);
    }
}

async function marquerCommeLuMessage(id) {
    try {
        const response = await fetch(`https://darajat-sq11.onrender.com/api/admin/messages/${id}/lu`, {
            method: 'PUT', headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) {
            const msg = allMessages.find(m => m.id === id);
            if (msg) msg.statut = 'lu';
            updateMessageCount();
            renderMessages();
        }
    } catch (error) { console.error("Erreur PUT message lu:", error); }
}

async function supprimerMessage(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return;
    try {
        const response = await fetch(`https://darajat-sq11.onrender.com/api/admin/messages/${id}`, {
            method: 'DELETE', headers: getAuthHeaders()
        });
        const result = await response.json();
        if (result.success) {
            allMessages = allMessages.filter(m => m.id !== id);
            filtrerMessages();
        }
    } catch (error) { console.error("Erreur DELETE message:", error); }
}

async function updateStatutEtudiant(id, nouveauStatut, selectElement) {
    selectElement.disabled = true;
    const previousValue = selectElement.dataset.previousValue || selectElement.value;

    try {
        const res = await fetch(`https://darajat-sq11.onrender.com/api/admin/etudiants/${id}/statut`, {
            method: 'PUT', headers: getAuthHeaders(),
            body: JSON.stringify({ statut_scolaire: nouveauStatut })
        });

        if (!res.ok) throw new Error('Server error');

        const data = await res.json();
        if (data.success) {
            selectElement.dataset.previousValue = nouveauStatut;
            applyStatusStyle(selectElement, nouveauStatut);
        } else {
            throw new Error(data.message || 'Update failed');
        }
    } catch (err) {
        console.error("Erreur mise à jour statut:", err);
        selectElement.value = previousValue;
        applyStatusStyle(selectElement, previousValue);
        alert("Erreur lors de la mise à jour du statut. La valeur a été restaurée.");
    } finally {
        selectElement.disabled = false;
    }
}

function applyStatusStyle(selectElement, status) {
    const baseStyle = 'padding:4px; border-radius:4px; border:1px solid; font-size:0.85rem; font-weight:600; cursor:pointer; outline:none; transition: all 0.2s ease; ';
    selectElement.style.cssText = baseStyle + getStatusStyle(status);
}

async function supprimerInscription(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette inscription ?")) return;
    try {
        const response = await fetch(`https://darajat-sq11.onrender.com/api/admin/inscriptions/${id}`, {
            method: 'DELETE', headers: getAuthHeaders()
        });
        const result = await response.json();
        if (result.success) fetchInscriptions(); 
    } catch (error) { console.error("Erreur DELETE inscription:", error); }
}

async function marquerCommeLuInscription(id) {
    try {
        const response = await fetch(`https://darajat-sq11.onrender.com/api/admin/inscriptions/${id}/lu`, {
            method: 'PUT', headers: getAuthHeaders()
        });
        const result = await response.json();
        if (result.success) fetchInscriptions(); 
    } catch (error) { console.error("Erreur PUT lu:", error); }
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
        const res = await fetch('https://darajat-sq11.onrender.com/api/admin/etudiants', {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeAjoutModal();
            fetchInscriptions(); 
        } else alert(data.message || "Erreur serveur");
    } catch (err) {
        console.error(err);
        alert("Erreur de connexion au serveur");
    }
}

async function genererAttestation(e) {
    e.preventDefault(); 
    const nom = document.getElementById('nom-etudiant').value.trim();
    const formation = document.getElementById('formation-etudiant').value.trim();
    const resultDiv = document.getElementById('resultat-attestation');

    try {
        const response = await fetch('https://darajat-sq11.onrender.com/api/admin/attestations', {
            method: 'POST', headers: getAuthHeaders(),
            body: JSON.stringify({ nom_etudiant: nom, formation: formation })
        });
        const data = await response.json();

        if (data.success) {
            resultDiv.style.display = 'block';
            resultDiv.style.background = '#f0fdf4';
            resultDiv.style.color = '#166534';
            resultDiv.style.border = '1px solid #bbf7d0';
            
            // Stacked layout: Text -> Code -> Button
            resultDiv.innerHTML = `
                <div style="text-align: center; padding: 10px 0;">
                    <p style="margin: 0 0 15px 0;">
                        Succès ! Le code pour <b>${escapeHTML(nom)}</b> est :<br>
                        <span style="display: inline-block; font-size: 1.4rem; margin-top: 10px; padding: 8px 20px; font-family: monospace; font-weight: bold;">
                            ${data.data.code_unique}
                        </span>
                    </p>
                    <button onclick="telechargerPDF('${data.data.code_unique}')" style="background: #166534; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; max-width: 250px;">
                        <i class="fa-solid fa-download"></i> Télécharger le PDF
                    </button>
                </div>
            `;  
            document.getElementById('nom-etudiant').value = ''; 
            document.getElementById('formation-etudiant').value = '';
        } else throw new Error(data.message || 'Erreur serveur');
    } catch (error) {
        resultDiv.style.display = 'block';
        resultDiv.style.background = '#fef2f2';
        resultDiv.style.color = '#991b1b';
        resultDiv.style.border = '1px solid #fecaca';
        resultDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${error.message}`;
    }
}

async function telechargerPDF(code) {
    try {
        const response = await fetch(`https://darajat-sq11.onrender.com/api/admin/attestations/download/${code}`, {
            method: 'GET',
            headers: getAuthHeaders() // We need the JWT token to access this route
        });

        if (!response.ok) throw new Error("Erreur lors du téléchargement");

        // Convert the response to a file Blob
        const blob = await response.blob();
        
        // Create an invisible link to trigger the browser's download manager
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Attestation_${code}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        alert(error.message);
    }
}