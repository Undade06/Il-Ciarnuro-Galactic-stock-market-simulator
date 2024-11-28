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
    // Create a box for each of the save-box
    saves.forEach((save, index) => {
        const saveBox = document.createElement("div");
        saveBox.classList.add("save-box");
        saveBox.style.position = "relative"
        const img = document.createElement("img");
        img.src = "pics/rimuoviSave.webp";
        img.style.position = "absolute"
        img.style.top = '0.2rem';
        img.style.right = '0.2rem';
        img.alt = "Rimuovi Salvataggio";
        img.addEventListener("click", (event) => {
            event.stopPropagation(); // If you click on the image, you don't click also the "save-box"
            removeSave(index);
        });

        saveBox.textContent = `Save ${index + 1}`;
        saveBox.appendChild(img);
        saveBox.addEventListener("click", () => loadSave(index)); // Load the specific save
        savesContainer.appendChild(saveBox);
    });

    // New save-box
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
    if(saves==null) saves=[];
    if(saves.length<3){
        //Add new save
        saves.push({ data: `New save ${saves.length + 1}` });
        // Memorize the saves in localStorage
        localStorage.setItem("saves", JSON.stringify(saves));
        // Reload saves
        loadSaves();
    }
}
// Function to load a specific load
function loadSave(index) {
    let saves = JSON.parse(localStorage.getItem("saves"));
    if(saves==null) saves=[];
    let save = saves[index];
    if (save) {
        //If you click the box of an existing save you go to the "marketHomePage" screen
        document.getElementById("saves").addEventListener('click', function(event) { 
            toSlide("marketHomePage");
        });
    } else {
        alert("Salvataggio non trovato!");
    }
}
document.addEventListener("DOMContentLoaded", () => {
    loadSaves(); //Load all the saves in the localStorage
});
function removeSave(index){
    let saves = JSON.parse(localStorage.getItem("saves"));
    if(saves==null) saves=[];
    let save = saves[index];
    if(save){
        if(saves.length>0){
            saves.splice(index, 1);
            localStorage.setItem("saves", JSON.stringify(saves));
            loadSaves();
            alert("eliminato salvataggio"+(index+1));
        }  
    }
}
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