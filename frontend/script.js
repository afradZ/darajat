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

// === CONNECTED TO BACKEND: SENDS DATA TO POSTGRESQL ===
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

// === CONNECTED TO BACKEND: CHECKS POSTGRESQL FOR CERTIFICATES ===
async function verifierAttestation() {
    let codeInput = document.getElementById("codeAttestation").value.trim();
    let resultat = document.getElementById("resultat");

    if(codeInput === "") {
        resultat.innerHTML = "<i class='fa-solid fa-circle-exclamation'></i> Veuillez entrer un code.";
        resultat.style.backgroundColor = "#f1f5f9";
        resultat.style.color = "var(--text-light)";
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codeInput })
        });

        const data = await response.json();

        if(data.valide) {
            resultat.innerHTML = `<i class='fa-solid fa-shield-check'></i> Attestation authentique. <br> Délivrée à : <b>${data.etudiant}</b>`;
            resultat.style.backgroundColor = "#d1fae5";
            resultat.style.color = "#047857";
        } else {
            resultat.innerHTML = "<i class='fa-solid fa-circle-xmark'></i> Attestation introuvable ou invalide.";
            resultat.style.backgroundColor = "#fee2e2";
            resultat.style.color = "#b91c1c"; 
        }
    } catch (error) {
        console.error("Erreur de connexion au serveur:", error);
        resultat.innerHTML = "Erreur de connexion au serveur de vérification.";
        resultat.style.backgroundColor = "#fee2e2";
        resultat.style.color = "#b91c1c";
    }
}

// === CONNECTED TO BACKEND: SENDS CONTACT MESSAGES ===
async function envoyerMessage(event) {
    event.preventDefault(); // Empêche la page de se recharger
    console.log("🕵️‍♂️ BOUTON CLIQUÉ ! Démarrage de l'envoi...");
    
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