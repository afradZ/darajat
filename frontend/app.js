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

let categorieActuelle = ""; // Enregistre si l'utilisateur a cliqué sur 'edu' ou 'pro'

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
    categorieActuelle = type; // Sauvegarde la catégorie cliquée
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

// Construit le menu déroulant dynamiquement en fonction de la catégorie
function ouvrirModalInscription() {
    hideOverlay('modal-details');
    
    const select = document.getElementById('formationSelect');
    // Réinitialise le menu avec l'option par défaut
    select.innerHTML = '<option value="" disabled selected>Choisir une formation spécifique...</option>';
    
    // Ajoute uniquement les cours de la catégorie sélectionnée
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

function soumettreInscription(event) {
    event.preventDefault(); 
    alert('Inscription réussie pour : ' + document.getElementById('formationSelect').value + ' !');
    fermerModal('modal-inscription');
}

function verifierAttestation() {
    let code = document.getElementById("codeAttestation").value.trim();
    let resultat = document.getElementById("resultat");
    let codesValides = ["DAR-2026-001", "DAR-2026-002"];

    if(code === "") {
        resultat.innerHTML = "<i class='fa-solid fa-circle-exclamation'></i> Veuillez entrer un code.";
        resultat.style.backgroundColor = "#f1f5f9";
        resultat.style.color = "var(--text-light)";
        return;
    }

    if(codesValides.includes(code)) {
        resultat.innerHTML = "<i class='fa-solid fa-shield-check'></i> Attestation authentique et reconnue.";
        resultat.style.backgroundColor = "#d1fae5";
        resultat.style.color = "#047857";
    } else {
        resultat.innerHTML = "<i class='fa-solid fa-circle-xmark'></i> Attestation introuvable ou invalide.";
        resultat.style.backgroundColor = "#fee2e2";
        resultat.style.color = "#b91c1c"; 
    }
}