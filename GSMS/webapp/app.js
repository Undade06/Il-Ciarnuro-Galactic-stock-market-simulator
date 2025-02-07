// PWA stuff
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
if(location.protocol=="http:"){
    location.href="https"+location.href.substring(4);
}
if (window.matchMedia('(display-mode: standalone)').matches) { //PWAs in standalone mode don't have the are you sure you want to leave the page dialog, so we prevent accidental back button presses on android from killing the app
    history.pushState({},null,document.URL);
    window.addEventListener('popstate', () => {
        history.pushState({},null,document.URL);
    })
}

//Basic functions
function toSlide(id) {
    /*
    if(id!=="landingPage" && id!=="login_register" && id!=="registerPage"){
        gm.checkLoggedIn().then(r => {
            if(!r){
                alert("Devi effettuare il login per accedere a questa pagina!");
                return;
            }
        })
    }else{*/
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
    //} DA ELIMINARE ALLA FINE
}
function getCurrentSlide(){
    let s=document.getElementsByClassName("slide visible");
    if(s.length===0) return null; else return s[0];
}
document.getElementById("landingPage").addEventListener('click', function(event) {
    toSlide("login_register");
    event.stopPropagation(); // Prevents click propagation
});
document.getElementById("saves").addEventListener('click', function(event) {
    event.stopPropagation();
});

// Reload saves
let saves = []; // Gestione in memoria
let saveCounter = 1; // Contatore per i salvataggi

function loadSaves() {
    const savesContainer = document.querySelector("#saves .content");
    savesContainer.innerHTML = "";

    // Crea una box per ogni save
    saves.forEach((save) => {
        const saveBox = document.createElement("div");
        saveBox.classList.add("save-box");
        saveBox.style.position = "relative";

        const img = document.createElement("img");
        img.src = "pics/rimuoviSave.webp";
        img.style.position = "absolute";
        img.style.top = "0.2rem";
        img.style.right = "0.2rem";
        img.alt = "Rimuovi Salvataggio";
        img.addEventListener("click", (event) => {
            event.stopPropagation(); // Impedisce il click sull'immagine
            removeSave(save.id);
        });

        saveBox.textContent = save.name;
        saveBox.appendChild(img);

        saveBox.addEventListener("click", () => loadSave(save.id)); // Carica il salvataggio specifico
        savesContainer.appendChild(saveBox);
    });

    // Aggiungi una nuova save-box
    if (saves.length < 3) {
        const newSaveBox = document.createElement("div");
        newSaveBox.classList.add("save-box", "new-save");
        newSaveBox.textContent = "+";
        newSaveBox.addEventListener("click", createNewSave);
        savesContainer.appendChild(newSaveBox);
    }
}

// Creazione di un nuovo save
function createNewSave() {
    if (saves.length < 3) {
        // Crea un nuovo save con un ID univoco e un nome
        const saveNumber = saves.length + 1; // Numero del salvataggio (1,2,3)
        const newSave = {
            id: Date.now(), // ID univoco per il save
            name: `Save ${saveCounter}`, 
            data: `` // Dati del salvataggio
        };
        saves.push(newSave);
        saveCounter++;
        loadSaves();
        gm.createSave(saveNumber); // Passa il numero del salvataggio (1,2,3)
    }
}

// Funzione per caricare uno specifico save
function loadSave(id) {
    const save = saves.find((s) => s.id === id);
    if (save) {
        gm.startGame();
        gm.setGraph("master stock",1,"bestStock_graf");
        toSlide("marketHomePage");
    } else {
        alert("Salvataggio non trovato!");
    }
}

// Funzione per rimuovere un save
function removeSave(id) {
    const saveIndex = saves.findIndex((s) => s.id === id); // Trova l'indice del save tramite ID
    gm.deleteSave(saveIndex+1);
    if (saveIndex !== -1) {
        saves.splice(saveIndex, 1); // Rimuovi il save
        loadSaves();
        alert(`Salvataggio eliminato!`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadSaves(); // Carica tutti i salvataggi dalla memoria
});

//registerPage
function checkPassword(){
    let username = document.querySelectorAll('.register_input')[0].value;
    let password = document.querySelectorAll('.register_input')[1].value;
    let confirmPassword = document.querySelectorAll('.register_input')[2].value;
    let errorText = document.querySelector('#registerError');
    if (password === '' || confirmPassword === '' || username==='') {
        errorText.style.opacity = '1000000'; //mettere una classe error, quando c'è error mettere colore rosso
        errorText.textContent="One of the fields is empty!"; 
        return false;
    }else{
        if(password === confirmPassword){
            errorText.style.opacity = '0';
            return true;
        }else{
           errorText.style.opacity = '1000000';
           errorText.textContent="The passwords don't correspond";
            return false;
        }
    }
}
//loginPage
function loginCheck(){
    let username = document.querySelectorAll('.log_reg_input')[0].value;
    let password = document.querySelectorAll('.log_reg_input')[1].value;
    let errorText = document.querySelector('#loginError');
    if (password === '' || username==='') {
        errorText.style.opacity = '1000000';
        errorText.textContent="One of the fields is empty!"; 
        return false;
    }
    errorText.style.opacity = '0';
    return true;
}

//marketHomePage
document.getElementById("marketHomePage").addEventListener('click', function(event) {
    event.stopPropagation(); // Prevents click propagation
});
document.getElementById("profilePage").addEventListener('click', function(event) {
    event.stopPropagation(); // Prevents click propagation
});


function risesAndFalls(){
    document.getElementById("rising").innerText=""
    document.getElementById("falling").innerText=""
    let t= document.createElement("table")

    for( let k in arr){
        let r=document.createElement("tr")
        let c=document.createElement("td")
        c.innerText=k
        r.appendChild(c)
    }
}

//profilePage
document.addEventListener("DOMContentLoaded", () => {
    let username = document.querySelectorAll('.log_reg_input')[0].value;// Sostituisci con la tua variabile dinamica
    const profileNameElement = document.getElementById("profileName");
    profileNameElement.innerText = `Name: ${username}`;
});

//Sidepanel
function openNav() {
    const panel = document.getElementById("infoPanel");
    panel.style.display = "block";
    // Piccolo delay per permettere al display:block di attivarsi prima dell'animazione
    setTimeout(() => {
        panel.style.width = "20rem";
    }, 10);
}
  
function closeNav() {
    const panel = document.getElementById("infoPanel");
    panel.style.width = "0";
}

function toggleNav() {
    const panel = document.getElementById("infoPanel");
    if (panel.style.width === "20rem") {
        closeNav();
    } else {
        openNav();
    }
}