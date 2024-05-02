bindedFields.push({ name: "rep1" });
bindedFields.push({ name: "lien1" });
bindedFields.push({ name: "rep2" });
bindedFields.push({ name: "lien2" });
bindedFields.push({ name: "rep3" });
bindedFields.push({ name: "lien3" });




function Convertir() {
    majDescription(); // Appeler la fonction pour ajouter la description

    const csv = document.getElementById('mot').value;
    const texte = csv.trim(); // Suppression des espaces en trop
    const ligne = texte.split('\n');
    ligne.shift(); // Permet de supprimer la première ligne (LIEN,MOTS CLES TROUVE,REPETITION).

    const mindmap = {
        "displayName": "Veille technologique",
        "skills": [],
        "xOffset": 0,
        "yOffset": 0,
        "scale": 0.5
    };

    // Créer le nœud pour "Mot clés"
    const noeudVeille = {
        "icon": "",
        "id": 0,
        "name": "Veille technologique",
        "parents": [],
        "childs": [],
        "fillColor": "#007bff",
        "posX": 5000,
        "posY": 100
    };
    mindmap.skills.push(noeudVeille);

    let posX = 500;
    const posY = 250;
    const espace = 200; // Espacement entre les nœuds
    const liensRencontre = []; // Stocker quand le lien est rencontré

    // Créer les nœuds de site et les relier à "Mot clés"
    for (let i = 0; i < ligne.length; i++) {
        const [lien, motsCles, repetition] = ligne[i].split(',');
        const lienT = lien.trim();
        const mot = motsCles.trim();
        const repetitionTrim = repetition.trim();

        if (!liensRencontre.includes(lienT)) {
            liensRencontre.push(lienT); // Ajout du lien à la liste des liens rencontrés

            noeudLien = {
                "icon": "",
                "id": mindmap.skills.length,
                "name": lienT,
                "parents": [{ "id": 0 }], // Relier à "Mot clés"
                "childs": [],
                "fillColor": "#77B5FE",
                "posX": posX,
                "posY": posY + 200
            };
            mindmap.skills.push(noeudLien); // Ajouter à la liste de compétences dans mindmap le lien  
            posX += espace; // Augmenter la position X pour le prochain nœud 
        }

        // Créer le nœud pour les mots clés
        const noeudMot = {
            "icon": "",
            "id": mindmap.skills.length,
            "name": mot,
            "parents": [{ "id": noeudLien.id }],
            "childs": [],
            "fillColor": "#C0C0C0",
            "posX": posX,
            "posY": posY + 400,
            "description": `Répétition: ${repetitionTrim}` // Ajouter la répétition dans la description
        };
        mindmap.skills.push(noeudMot); // Ajouter à la liste de compétences dans mindmap le mot clé

        posX += espace; // Pour qu'il y ait un espace entre chaque nœud
    }

    const json = document.getElementById('result');
    json.value = JSON.stringify(mindmap, null, 2); // Convertir une valeur JavaScript en chaîne JSON
}


document.addEventListener("treenodeSelected",function(){
    var lien1 = document.getElementsByName('lien1')[0];
    var txtLien1 = document.getElementsByName('txt-lien1')[0];
    var rep1 = document.getElementsByName('rep1')[0];
    var txtRep1 = document.getElementsByName('txt-rep1')[0];

    var lien2 = document.getElementsByName('lien2')[0];
    var txtLien2 = document.getElementsByName('txt-lien2')[0];
    var rep2 = document.getElementsByName('rep2')[0];
    var txtRep2 = document.getElementsByName('txt-rep2')[0];

    var lien3 = document.getElementsByName('lien3')[0];
    var txtLien3 = document.getElementsByName('txt-lien3')[0];
    var rep3 = document.getElementsByName('rep3')[0];
    var txtRep3 = document.getElementsByName('txt-rep3')[0];
    
    if (lien1.value == false){
        lien1.style.visibility = "hidden";
        txtLien1.style.visibility = "hidden";
        rep1.style.visibility = "hidden";
        txtRep1.style.visibility = "hidden";

    } else {
        lien1.style.visibility = "visible";
        txtLien1.style.visibility = "visible";
        rep1.style.visibility = "visible";
        txtRep1.style.visibility = "visible";
    }

    if (lien2.value == false){
        lien2.style.visibility = "hidden";
        txtLien2.style.visibility = "hidden";
        rep2.style.visibility = "hidden";
        txtRep2.style.visibility = "hidden";

    } else {
        lien2.style.visibility = "visible";
        txtLien2.style.visibility = "visible";
        rep2.style.visibility = "visible";
        txtRep2.style.visibility = "visible";
    }

    if (lien3.value == false){
        lien3.style.visibility = "hidden";
        txtLien3.style.visibility = "hidden";
        rep3.style.visibility = "hidden";
        txtRep3.style.visibility = "hidden";

    } else {
        lien3.style.visibility = "visible";
        txtLien3.style.visibility = "visible";
        rep3.style.visibility = "visible";
        txtRep3.style.visibility = "visible";
    }
});
