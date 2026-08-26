
// UTILS 
const escapeHTML = (str) => str ? str.toString().replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]) : '';

const showOverlay = (id) => {
    const overlay = document.getElementById(id);
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('active'), 10);
};

const hideOverlay = (id) => {
    const overlay = document.getElementById(id);
    overlay.classList.remove('active');
    setTimeout(() => overlay.style.display = 'none', 300);
};

const fermerModal = (modalId, event) => {
    if (event) event.stopPropagation();
    hideOverlay(modalId);
};

function ouvrirInscriptionDirecte(nomFormation) {
    const selectElement = document.getElementById('formationSelect');
    
    if (selectElement) {
        selectElement.value = nomFormation;
    }
    
    showOverlay('modal-inscription');
}

// --- UI INTERACTIONS ---

function scrollCarousel(direction) {
    const container = document.getElementById('formation-carousel');
    const firstCard = container.querySelector('.carousel-card');
    if (!firstCard) return;
    
    const cardWidth = firstCard.offsetWidth + 24; // Card width + gap

    if (direction === 1) { // Next (Right)
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
        
        // Wait for smooth scroll to finish, then move 1st card to the end invisibly
        setTimeout(() => {
            container.appendChild(container.firstElementChild);
            container.style.scrollBehavior = 'auto'; // Turn off animation
            container.scrollLeft -= cardWidth;       // Rewind instantly
            container.style.scrollBehavior = 'smooth'; // Turn animation back on
        }, 300); // 300ms matches standard browser smooth scroll duration
        
    } else { // Previous (Left)
        // Move last card to the beginning instantly *before* scrolling
        container.style.scrollBehavior = 'auto';
        container.prepend(container.lastElementChild);
        container.scrollLeft += cardWidth;
        container.style.scrollBehavior = 'smooth';
        
        // Use requestAnimationFrame to let the browser process the DOM shift before animating
        requestAnimationFrame(() => {
            container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        });
    }
}

// --- API CALLS ---
async function soumettreInscription(event) {
    event.preventDefault(); 
    
    const rawTel = document.getElementById('insc-tel').value.replace(/\D/g, '');
    const finalTel = rawTel.startsWith('212') ? `+${rawTel}` : `+212${rawTel.replace(/^0/, '')}`;
    const formation = document.getElementById('formationSelect').value;

    const payload = {
        nom: document.querySelector('#modal-inscription input[type="text"]').value.trim(),
        email: document.querySelector('#modal-inscription input[type="email"]').value.trim(),
        telephone: finalTel,
        formation,
        cin: document.getElementById('insc-cin').value.trim().toUpperCase()
    };

    try {
        const res = await fetch('https://darajat-sq11.onrender.com/api/inscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            alert(`Inscription réussie pour : ${formation} ! Veuillez vérifier votre dossier Spam ou Courrier indésirable pour la brochure.`);
            fermerModal('modal-inscription');
            document.querySelector('#modal-inscription form').reset();
        } else throw new Error();
    } catch {
        alert("Erreur de connexion au serveur.");
    }
}

async function verifierAttestation() {
    const code = document.getElementById('codeAttestation').value.trim();
    const resultDiv = document.getElementById('resultat');

    if (!code) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<p style="color: #ef4444; text-align: center; margin-top: 15px;">Veuillez entrer un code.</p>';
        return;
    }

    Object.assign(resultDiv.style, { display: 'block', marginTop: '20px', padding: '20px', borderRadius: '8px', textAlign: 'left', background: 'transparent', border: 'none' });
    resultDiv.innerHTML = '<p style="text-align: center; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Vérification en cours...</p>';

    try {
        const res = await fetch('https://darajat-sq11.onrender.com/api/verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (data.valide) {
            const dateStr = new Date(data.date_emission).toLocaleDateString('fr-FR');
            Object.assign(resultDiv.style, { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' });
            resultDiv.innerHTML = `
                <h3 style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-circle-check"></i> Attestation Valide
                </h3>
                <div style="line-height: 1.6;">
                    <p style="margin: 0;"><b>Étudiant :</b> ${escapeHTML(data.nom_etudiant)}</p>
                    <p style="margin: 0;"><b>Formation :</b> <span style="background: white; padding: 2px 8px; border-radius: 12px; font-size: 0.9em; border: 1px solid #bbf7d0;">${escapeHTML(data.formation)}</span></p>
                    <p style="margin: 0;"><b>Délivrée le :</b> ${dateStr}</p>
                </div>`;
        } else {
            Object.assign(resultDiv.style, { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' });
            resultDiv.innerHTML = `<p style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="fa-solid fa-circle-xmark"></i> Code introuvable ou attestation révoquée.</p>`;
        }
    } catch {
        Object.assign(resultDiv.style, { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' });
        resultDiv.innerHTML = `<p style="margin: 0; text-align: center;">Erreur de connexion au serveur.</p>`;
    }
}

async function envoyerMessage(event) {
    event.preventDefault(); 
    
    const payload = {
        nom: document.getElementById('contactNom').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        message: document.getElementById('contactMessage').value.trim()
    };

    try {
        const res = await fetch('https://darajat-sq11.onrender.com/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            alert('Votre message a été envoyé avec succès ! Nous vous contacterons bientôt.');
            document.querySelector('.contact-form').reset();
        } else throw new Error();
    } catch {
        alert("Erreur de connexion au serveur.");
    }
}