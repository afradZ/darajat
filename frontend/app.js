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

let formationActuelle = "";

function showOverlay(id) {
    const overlay = document.getElementById(id);
    overlay.style.display = 'flex';
    // Petit délai pour permettre à la transition CSS de se déclencher
    setTimeout(() => overlay.classList.add('active'), 10);
}

function hideOverlay(id) {
    const overlay = document.getElementById(id);
    overlay.classList.remove('active');
    // Attendre la fin de l'animation pour cacher le display
    setTimeout(() => overlay.style.display = 'none', 300);
}

function ouvrirModalDetails(type) {
    formationActuelle = formationsData[type].titre;
    document.getElementById('modal-title').innerText = formationActuelle;
    
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
    document.getElementById('formationSelect').value = formationActuelle;
    setTimeout(() => showOverlay('modal-inscription'), 300); // Wait for details modal to fade out
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