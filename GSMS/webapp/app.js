function toSlide(id) {
    document.querySelectorAll("div.slide").forEach(function(e) {
        e.classList.add("hidden");
        e.classList.remove("visible");
        e.querySelectorAll("*").forEach(function(e1) {
            e1.tabIndex = "-1"; 
        });
    });
    let d = document.getElementById(id);
    d.classList.add("visible");
    d.classList.remove("hidden");
    d.querySelectorAll("*").forEach(function(e2) {
        e2.tabIndex = "0";  
    });
}
function getCurrentSlide(){
    let s=document.getElementsByClassName("slide visible");
    if(s.length===0) return null; else return s[0];
}
/*document.getElementById("landingPage").addEventListener('click', function(event) {
    event.stopPropagation(); // Impedisce la propagazione del click
    toSlide("login_register");
});*/
/*document.getElementById("saves").addEventListener('click', function(event) {
    event.stopPropagation();
});*/

// Funzione per aggiornare la lista dei salvataggi
function loadSaves() {
    const savesContainer = document.querySelector("#saves .content");
    savesContainer.innerHTML = "";

    // Recupera i salvataggi da localStorage
    let saves = JSON.parse(localStorage.getItem("saves"));
    if(saves==null){
        saves=[];
    }
    // Crea un riquadro per ogni salvataggio
    saves.forEach((save, index) => {
    const saveBox = document.createElement("div");
    saveBox.classList.add("save-box");
    saveBox.textContent = `Save ${index + 1}`;
    saveBox.addEventListener("click", () => loadSave(index)); // Carica il salvataggio corrispondente
    savesContainer.appendChild(saveBox);
    });
    
    // Aggiungi il riquadro per creare un nuovo salvataggio
    if(saves.length<3){
        const newSaveBox = document.createElement("div");
    newSaveBox.classList.add("save-box", "new-save");
    newSaveBox.textContent = "+";
    newSaveBox.addEventListener("click", createNewSave);
    savesContainer.appendChild(newSaveBox);
    }
    
}
// Funzione per creare un nuovo salvataggio
function createNewSave() {
    // Recupera i salvataggi esistenti
    let saves = JSON.parse(localStorage.getItem("saves"));
    if(saves==null) saves=[];
    if(saves.length<3){
        // Aggiungi un nuovo salvataggio
        saves.push({ data: `New save ${saves.length + 1}` });
        // Salva i salvataggi in localStorage
        localStorage.setItem("saves", JSON.stringify(saves));
        // Ricarica la lista dei salvataggi
        loadSaves();
    }
}
// Funzione per caricare un salvataggio specifico
function loadSave(index) {
    let saves = JSON.parse(localStorage.getItem("saves"));
    if(saves==null) saves=[];
    let save = saves[index];
    if (save) {
        //se si clicca il riquadro di un salvataggio esistente si passa alla schermata "market1"
        document.getElementById("saves").addEventListener('click', function(event) { 
            toSlide("market1");
        });
    } else {
        alert("Salvataggio non trovato!"); //messaggio d'errore
    }
}
document.addEventListener("DOMContentLoaded", () => {
    loadSaves(); //all'esecuzione carica tutti i salvataggi memorizzati nel localStorage
});