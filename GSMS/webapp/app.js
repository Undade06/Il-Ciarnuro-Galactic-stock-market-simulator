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
document.getElementById("landingPage").addEventListener('click', function(event) {
    event.stopPropagation(); // Prevents click propagation
    toSlide("login_register");
});
document.getElementById("saves").addEventListener('click', function(event) {
    event.stopPropagation();
});

// Reload saves
function loadSaves() {
    const savesContainer = document.querySelector("#saves .content");
    savesContainer.innerHTML = "";

    let saves = JSON.parse(localStorage.getItem("saves"));
    if (saves == null) {
        saves = [];
    }

    // Create a box for each save
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
            event.stopPropagation(); // Prevent click on image 
            removeSave(save.id);
        });

        saveBox.textContent = save.name;
        saveBox.appendChild(img);

        saveBox.addEventListener("click", () => loadSave(save.id)); // Load the specific save
        savesContainer.appendChild(saveBox);
    });

    // Add a new save-box
    if (saves.length < 3) {
        const newSaveBox = document.createElement("div");
        newSaveBox.classList.add("save-box", "new-save");
        newSaveBox.textContent = "+";
        newSaveBox.addEventListener("click", createNewSave);
        savesContainer.appendChild(newSaveBox);
    }
}

// Creation of a new save
function createNewSave() {
    let saves = JSON.parse(localStorage.getItem("saves"));
    if (saves == null) saves = [];

    let saveCounter = parseInt(localStorage.getItem("saveCounter"));
    if (isNaN(saveCounter)) saveCounter = 1;

    if (saves.length < 3) {
        // Create a new save with a unique ID and name
        const newSave = {
            id: Date.now(), // Unique ID for the save
            name: `Save ${saveCounter}`, 
            data: `` //data on the save
        };
        saves.push(newSave);

        localStorage.setItem("saveCounter", saveCounter + 1);

        localStorage.setItem("saves", JSON.stringify(saves));
        loadSaves();
    }
}

// Function to load a specific save
function loadSave(id) {
    let saves = JSON.parse(localStorage.getItem("saves"));
    if (saves == null) saves = [];

    const save = saves.find((s) => s.id === id);
    if (save) {
        toSlide("marketHomePage");
    } else {
        alert("Salvataggio non trovato!");
    }
}

// Function to remove a save
function removeSave(id) {
    let saves = JSON.parse(localStorage.getItem("saves"));
    if (saves == null) saves = [];

    const saveIndex = saves.findIndex((s) => s.id === id); // Find the index of the save by ID
    if (saveIndex !== -1) {
        saves.splice(saveIndex, 1); // Remove the save
        localStorage.setItem("saves", JSON.stringify(saves));
        loadSaves();
        alert(`Salvataggio eliminato!`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadSaves(); // Load all the saves from localStorage
});


//registerPage
function checkPassword(){
    let username = document.querySelectorAll('.register_input')[0].value;
    let password = document.querySelectorAll('.register_input')[1].value;
    let confirmPassword = document.querySelectorAll('.register_input')[2].value;
    let errorText = document.querySelector('#registerError');

    if (password === '' || confirmPassword === '' || username==='') {
        errorText.style.opacity = '1000000';
        errorText.textContent="Uno dei campi è vuoto!"; 
        return false;
    }else{
        if(password === confirmPassword){
            return true;
        }else{
           errorText.style.opacity = '1000000';
           errorText.textContent="Le password non coincidono!";
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
        errorText.textContent="Uno dei campi è vuoto!"; 
        return false;
    }
    return true;
}

//marketHomePage
document.getElementById("marketHomePage").addEventListener('click', function(event) {
    event.stopPropagation(); // Prevents click propagation
});