// --- GLOBAL STATE & APP LOGIC ---

let allMessages = [];
let filteredMessages = [];
let currentMsgPage = 1;
let currentInscPage = 1;
const rowsPerPage = 10;

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function handleLogout() {
    localStorage.removeItem('admin_token');
    document.getElementById('login-overlay').classList.remove('hidden');
}

function updateMessageCount() {
    const unread = allMessages.filter(m => m.statut !== 'lu').length;
    document.getElementById('count-messages').innerText = unread;
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

function filtrerBaseEtudiants() {
    currentInscPage = 1; 
    fetchInscriptions();
}

function filtrerInscriptions() {
    filtrerBaseEtudiants(); 
}

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

    if(viewName === 'etudiants') fetchInscriptions(); 
}

function prefillCertificate(nom, formation) {
    document.getElementById('nom-etudiant').value = nom;
    document.getElementById('formation-etudiant').value = formation;
    const resultDiv = document.getElementById('resultat-attestation');
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    document.getElementById('cert-modal-overlay').classList.remove('hidden');
}

function closeCertModal() { document.getElementById('cert-modal-overlay').classList.add('hidden'); }
function openAjoutModal() { document.getElementById('ajout-modal-overlay').classList.remove('hidden'); }
function closeAjoutModal() { 
    document.getElementById('ajout-modal-overlay').classList.add('hidden');
    document.getElementById('form-ajout-etudiant').reset();
}

function lancerImpression(nom, formation, code) {
    // Fill the hidden template with real data
    document.getElementById('cert-print-nom').innerText = nom;
    document.getElementById('cert-print-formation').innerText = formation;
    document.getElementById('cert-print-code').innerText = code;
    
    const today = new Date().toLocaleDateString('fr-FR');
    document.getElementById('cert-print-date').innerText = `Fait le : ${today}`;

    // Trigger the browser's print dialog
    window.print();
}

// EVENT LISTENERS & INIT
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
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

window.onload = () => {
    if (localStorage.getItem('admin_token')) {
        document.getElementById('login-overlay').classList.add('hidden');
        fetchDashboardData();
    }
    document.getElementById('search-msg')?.addEventListener('input', debounce(filtrerMessages, 300));
    document.getElementById('search-insc')?.addEventListener('input', debounce(filtrerInscriptions, 300));
};