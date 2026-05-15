const formationsData = {
    edu: {
        titre: "Formations éducatives",
        points: ["Pédagogie moderne et appliquée", "Psychologie de l’enfant et de l'adolescent", "Méthodologies de soutien scolaire"]
    },
    pro: {
        titre: "Formations professionnelles",
        points: ["Développement Web & Ingénierie logicielle", "Marketing Digital & Stratégie", "Design Graphique & UI/UX"]
    }
};

let categorieActuelle = ""; 

function showOverlay(id) {
    const overlay = document.getElementById(id);
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('active'), 10);
}

function hideOverlay(id) {
    const overlay = document.getElementById(id);
    overlay.classList.remove('active');
    setTimeout(() => overlay.style.display = 'none', 300);
}

function ouvrirModalDetails(type) {
    categorieActuelle = type; 
    document.getElementById('modal-title').innerText = formationsData[type].titre;
    
    const ul = document.getElementById('modal-list');
    ul.innerHTML = "";
    formationsData[type].points.forEach(point => {
        let li = document.createElement('li');
        li.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${point}`;
        ul.appendChild(li);
    });

    showOverlay('modal-details');
}

function ouvrirModalInscription() {
    hideOverlay('modal-details');
    
    const select = document.getElementById('formationSelect');
    select.innerHTML = '<option value="" disabled selected>Choisir une formation spécifique...</option>';
    
    formationsData[categorieActuelle].points.forEach(point => {
        let option = document.createElement('option');
        option.value = point;
        option.textContent = point;
        select.appendChild(option);
    });

    setTimeout(() => showOverlay('modal-inscription'), 300); 
}

function fermerModal(modalId, event) {
    if(event) event.stopPropagation();
    hideOverlay(modalId);
}

// CONNECTED TO BACKEND: SENDS DATA TO POSTGRESQL 
async function soumettreInscription(event) {
    event.preventDefault(); 
    
    const formData = {
        nom: document.querySelector('#modal-inscription input[type="text"]').value,
        email: document.querySelector('#modal-inscription input[type="email"]').value,
        telephone: document.querySelector('#modal-inscription input[type="tel"]').value,
        formation: document.getElementById('formationSelect').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/inscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if(data.success) {
            alert('Inscription réussie pour : ' + formData.formation + ' !');
            fermerModal('modal-inscription');
            // Optionnel : Vider le formulaire après succès
            document.querySelector('#modal-inscription form').reset();
        } else {
            alert("Une erreur s'est produite lors de l'inscription.");
        }
    } catch (error) {
        console.error("Erreur de connexion au serveur:", error);
        alert("Impossible de contacter le serveur.");
    }
}

// CONNECTED TO BACKEND: CHECKS POSTGRESQL FOR CERTIFICATES 
async function verifierAttestation() {
    const codeInput = document.getElementById('codeAttestation');
    const code = codeInput.value.trim();
    const resultDiv = document.getElementById('resultat');

    if (!code) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<p style="color: #ef4444; text-align: center; margin-top: 15px;">Veuillez entrer un code.</p>';
        return;
    }

    // Reset styles while fetching
    resultDiv.style.display = 'block';
    resultDiv.style.marginTop = '20px';
    resultDiv.style.padding = '20px';
    resultDiv.style.borderRadius = '8px';
    resultDiv.style.textAlign = 'left';
    resultDiv.innerHTML = '<p style="text-align: center; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Vérification en cours...</p>';

    try {
        const response = await fetch('http://localhost:3000/api/verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();

        if (data.valide) {
            const dateStr = new Date(data.date_emission).toLocaleDateString('fr-FR');
            
            resultDiv.style.background = '#f0fdf4';
            resultDiv.style.color = '#166534';
            resultDiv.style.border = '1px solid #bbf7d0';
            resultDiv.innerHTML = `
                <h3 style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-circle-check"></i> Attestation Valide
                </h3>
                <div style="line-height: 1.6;">
                    <p style="margin: 0;"><b>Étudiant :</b> ${data.nom_etudiant}</p>
                    <p style="margin: 0;"><b>Formation :</b> <span style="background: white; padding: 2px 8px; border-radius: 12px; font-size: 0.9em; border: 1px solid #bbf7d0;">${data.formation}</span></p>
                    <p style="margin: 0;"><b>Délivrée le :</b> ${dateStr}</p>
                </div>
            `;
        } else {
            resultDiv.style.background = '#fef2f2';
            resultDiv.style.color = '#991b1b';
            resultDiv.style.border = '1px solid #fecaca';
            resultDiv.innerHTML = `
                <p style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fa-solid fa-circle-xmark"></i> Code introuvable ou attestation révoquée.
                </p>
            `;
        }
    } catch (error) {
        console.error('Erreur de vérification:', error);
        resultDiv.style.background = '#fef2f2';
        resultDiv.style.color = '#991b1b';
        resultDiv.style.border = '1px solid #fecaca';
        resultDiv.innerHTML = `<p style="margin: 0; text-align: center;">Erreur de connexion au serveur.</p>`;
    }
}

// CONNECTED TO BACKEND: SENDS CONTACT MESSAGES
async function envoyerMessage(event) {
    event.preventDefault(); // Empêche la page de se recharger
    
    const formData = {
        nom: document.getElementById('contactNom').value,
        email: document.getElementById('contactEmail').value,
        message: document.getElementById('contactMessage').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if(data.success) {
            alert('Votre message a été envoyé avec succès ! Nous vous contacterons bientôt.');
            // Vide le formulaire
            document.querySelector('.contact-form').reset();
        } else {
            alert("Une erreur s'est produite lors de l'envoi du message.");
        }
    } catch (error) {
        console.error("Erreur de connexion:", error);
        alert("Impossible de contacter le serveur.");
    }
}