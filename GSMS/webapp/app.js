// PWA stuff
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
if (location.protocol == "http:") {
    location.href = "https" + location.href.substring(4);
}
if (window.matchMedia('(display-mode: standalone)').matches) { //PWAs in standalone mode don't have the are you sure you want to leave the page dialog, so we prevent accidental back button presses on android from killing the app
    history.pushState({}, null, document.URL);
    window.addEventListener('popstate', () => {
        history.pushState({}, null, document.URL);
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
    if (id === "marketHomePage" || id === "stockPage") {
        document.getElementById("accessibility").style.display = "block";
    } else {
        document.getElementById("accessibility").style.display = "none";
    }
    document.querySelectorAll("div.slide").forEach(function (e) {
        e.classList.add("hidden");
        e.classList.remove("visible");
        e.querySelectorAll("*").forEach(function (e1) {
            e1.tabIndex = "-1";
        });
    });

    let d = document.getElementById(id);
    d.classList.add("visible");
    d.classList.remove("hidden");
    d.querySelectorAll("*").forEach(function (e2) {
        e2.tabIndex = "0";
    });
    //} DA ELIMINARE ALLA FINE
}
function getCurrentSlide() {
    let s = document.getElementsByClassName("slide visible");
    if (s.length === 0) return null; else return s[0];
}
document.getElementById("landingPage").addEventListener('click', function (event) {
    toSlide("login_register");
    event.stopPropagation(); // Prevents click propagation
});
document.getElementById("saves").addEventListener('click', function (event) {
    event.stopPropagation();
});

// Reload saves
let saveSelection = [];// Gestione in memoria

function loadSaves() {
    showLoading()
    setTimeout(() => {

        const savesContainer = document.querySelector("#saves .content");
        savesContainer.innerHTML = "";

        // Crea una box per ogni save
        saveSelection.forEach((save) => {
            const saveBox = document.createElement("div");
            saveBox.classList.add("save-box");
            saveBox.style.position = "relative";

            const img = document.createElement("img")
            img.src = "pics/rimuoviSave.webp"
            img.style.position = "absolute"
            img.style.top = "0.2rem"
            img.style.right = "0.2rem"
            img.style.paddingTop = "0.45rem"
            img.style.paddingRight= "0.45rem"
            img.alt = "Rimuovi Salvataggio"
            img.addEventListener("click", (event) => {
                event.stopPropagation(); // Impedisce il click sull'immagine
                removeSave(save.save.saveId)
            })

            saveBox.textContent = save.name;
            let saveid = document.createElement("div")
            saveid.innerText = "Salvataggio " + (save.save.saveId + 1)

            let balanceDate = document.createElement("div")

            let saveDate = document.createElement("div")
            saveDate.innerText = save.lastAccess.getFullYear() + '-' + numberTo2Digits(save.lastAccess.getMonth() + 1) + '-' + numberTo2Digits(save.lastAccess.getDate())

            let saveBalance = document.createElement("div")
            saveBalance.innerText = "Bilancio: " + (save.budget).toFixed(2) + " Kr"

            saveid.classList.add("save-id")
            balanceDate.classList.add("balance-date")
            saveDate.classList.add("save-date")
            saveBalance.classList.add("save-balance")

            saveBox.appendChild(saveid)

            balanceDate.appendChild(saveBalance)
            balanceDate.appendChild(saveDate)

            saveBox.appendChild(balanceDate)
            saveBox.appendChild(img);

            saveBox.addEventListener("click", () => loadSave(save.save.saveId)); // Carica il salvataggio specifico
            savesContainer.appendChild(saveBox);
        });

        // Aggiungi una nuova save-box
        if (arrayCountNotUndefined(saveSelection) < GameManager.MAXSAVES) {
            const newSaveBox = document.createElement("div");
            newSaveBox.classList.add("save-box", "new-save");
            newSaveBox.textContent = "+";
            newSaveBox.addEventListener("click", createNewSave);
            savesContainer.appendChild(newSaveBox);
        }
        hideLoading()

    }, 200)

}

// Creazione di un nuovo save
function createNewSave() {
    if (arrayCountNotUndefined(saveSelection) < GameManager.MAXSAVES) {

        let saveNumber  /*=arrayFirstIndexAvailable(saveSelection)
        if (saveNumber === -1) saveNumber = 0*/
        for (let i = 0; i < GameManager.MAXSAVES; i++) {
            if(saveSelection[i] === undefined){
                saveNumber = i
                break
            }
        }

        showLoading()
        setTimeout(() => {

            Save.loadMarket().then(save => {
                // Crea un nuovo oggetto Save con gli stock caricati
                const newSave = {
                    save: new Save(save.stocks, saveNumber),
                    lastAccess: new Date(GameManager.gameTimer()),
                    realStartDate: new Date(),
                    ownedStocks: {},
                    budget: Player.startMoney
                };

                saveSelection.push(newSave);
                //console.log(gm.player);
                //console.log(saveNumber);
                gm.initializeSave(saveNumber);
                gm.saves[saveNumber] = newSave.save;

                console.log(gm.saves[saveNumber]);

                // Crea il salvataggio nel database
                gm.createSaveInDB(saveNumber, new Player());

                loadSaves();
            }).catch(error => {
                console.error('Error loading stocks: ', error);
            });

        }, 200)


    }
}
// Function to show the loading div
function showLoading() {
    const loadingDiv = document.getElementById("loading");
    if (loadingDiv) {
        loadingDiv.style.display = "block";
    }
}

// Function to hide the loading div
function hideLoading() {
    const loadingDiv = document.getElementById("loading");
    if (loadingDiv) {
        loadingDiv.style.display = "none";
    }
}

// Funzione per caricare uno specifico save
function loadSave(id, slide = 'marketHomePage') {
    showLoading(); // Show the loading div
    setTimeout(() => {
        let save = saveSelection[id]
        if (save === undefined) throw 'Undefined save'
        gm.saveSelected = id
        gm.lastAccess = save.lastAccess.getTime()
        gm.player.wallet = save.budget
        gm.player.stocks = save.ownedStocks
        GameManager.REALSTARTDATE = save.realStartDate.getTime()
        GameManager.STARTDATE = new Date(GameManager.REALSTARTDATE + 1000 * 24 * 60 * 60 * 365 * GameManager.YEARSHIFT).getTime()
        gm.startGame();
        toSlide(slide);
        hideLoading(); // Hide the loading div after starting the game
    }, 200);
}

// Funzione per rimuovere un save
function removeSave(id) {
    //console.log(id);
    const saveIndex = saveSelection.findIndex((s) => s.save.saveId === id); // Trova l'indice del save tramite ID
    gm.deleteSave(id)
    console.log("saveIndex " + saveIndex)
    saveSelection.splice(saveIndex, 1); // Rimuovi il save
    loadSaves();
    //alert(`Salvataggio eliminato!`);
}

document.addEventListener("DOMContentLoaded", () => {
    loadSaves(); // Carica tutti i salvataggi dalla memoria
});

//registerPage
function checkPassword() {
    let username = document.querySelectorAll('.register_input')[0].value;
    let password = document.querySelectorAll('.register_input')[1].value;
    let confirmPassword = document.querySelectorAll('.register_input')[2].value;
    let errorText = document.querySelector('#registerError');
    if (password === '' || confirmPassword === '' || username === '') {
        errorText.style.opacity = '1000000'; //mettere una classe error, quando c'è error mettere colore rosso
        errorText.textContent = "One of the fields is empty!";
        return false;
    } else {
        if (password === confirmPassword) {
            errorText.style.opacity = '0';
            return true;
        } else {
            errorText.style.opacity = '1000000';
            errorText.textContent = "The passwords don't correspond";
            return false;
        }
    }
}
//loginPage
function loginCheck() {
    let username = document.querySelectorAll('.log_reg_input')[0].value;
    let password = document.querySelectorAll('.log_reg_input')[1].value;
    let errorText = document.querySelector('#loginError');
    if (password === '' || username === '') {
        errorText.style.opacity = '1000000';
        errorText.textContent = "One of the fields is empty!";
        return false;
    }
    errorText.style.opacity = '0';
    return true;
}

//marketHomePage
document.getElementById("marketHomePage").addEventListener('click', function (event) {
    event.stopPropagation(); // Prevents click propagation
});
document.getElementById("profilePage").addEventListener('click', function (event) {
    event.stopPropagation(); // Prevents click propagation
});


function risesAndFalls() {
    //console.log("Rises and falls")
    const rising = document.getElementById("rising")
    const falling = document.getElementById("falling")

    rising.innerText = ""
    falling.innerText = ""

    let risingTable = document.createElement("table")
    let fallingTable = document.createElement("table")

    let risings = gm.getRisings()
    let fallings = gm.getFallings()
    //console.log(risings)
    //console.log(fallings)

    risings.forEach(stock => {
        //console.log("Rises and falls2")
        let row = document.createElement("tr")
        let name = document.createElement("td")
        let value = document.createElement("td")
        let trend = document.createElement("td")
        let typeETF = document.createElement("td")

        name.innerText = stock.acronym
        value.innerText = stock.value.toFixed(2) + ' Kr'
        trend.innerText = "+" + (stock.getDailyTrend() * 100).toFixed(2) + "%"

        trend.style.color = "green"
        row.appendChild(name)
        name.classList.add("bestStock_name")
        if (stock.type === "ETF") {
            typeETF.innerText = "ETF"
        } else {
            typeETF.innerText = "ETF"
            typeETF.style.opacity = 0
        }
        row.appendChild(typeETF)
        row.appendChild(value)
        row.appendChild(trend)

        risingTable.appendChild(row)

        row.addEventListener('click', () => {
            gm.stock = stock
            gm.prepareStockPage()
            toSlide('stockPage')
        })
    })

    fallings.forEach(stock => {
        let row = document.createElement("tr")
        let name = document.createElement("td")
        let value = document.createElement("td")
        let trend = document.createElement("td")
        let typeETF = document.createElement("td")

        name.innerText = stock.acronym
        value.innerText = stock.value.toFixed(2) + ' Kr'
        trend.innerText = (stock.getDailyTrend() * 100).toFixed(2) + "%"

        trend.style.color = "red"
        row.appendChild(name)
        name.classList.add("bestStock_name")
        if (stock.type === "ETF") {
            typeETF.innerText = "ETF"
        } else {
            typeETF.innerText = "ETF"
            typeETF.style.opacity = 0
        }
        row.appendChild(typeETF)
        row.appendChild(value)
        row.appendChild(trend)
        fallingTable.appendChild(row)

        row.addEventListener('click', () => {
            gm.stock = stock
            gm.prepareStockPage()
            toSlide('stockPage')
        })
    })

    rising.appendChild(risingTable)
    falling.appendChild(fallingTable)

    // Future updates
    setTimeout(() => {
        risesAndFalls()
    }, GameManager.VALUESPERREALSECONDS * 1000)
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
    setTimeout(() => {
        panel.style.width = "30rem";
        document.getElementById("overlay").classList.add('visible');
    }, 10);
}

function closeNav() {
    const panel = document.getElementById("infoPanel");
    panel.style.width = "0";
    document.getElementById("overlay").classList.remove('visible');
    setTimeout(() => {
        panel.style.display = "none";
    }, 500);
}

// Chiudi il pannello quando si clicca fuori
document.addEventListener('click', function (event) {
    const infoPanel = document.getElementById('infoPanel');
    const infoButton = document.querySelector('#infoButton');

    // Se il pannello è aperto e il click non è sul pannello stesso o sul pulsante info
    if (infoPanel.style.width === "30rem" &&
        !infoPanel.contains(event.target) &&
        !infoButton.contains(event.target)) {
        closeNav();
    }
});

// Aggiungi event listener all'overlay
document.getElementById('overlay').addEventListener('click', function () {
    closeNav();
});

function arrayCountNotUndefined(arr) {

    let c = 0
    for (let i = 0; i < arr.length; i++) if (arr[i] !== undefined) c++
    return c

}

function arrayFirstIndexAvailable(arr) {

    for (let i = 0; i < arr.length; i++) if (arr[i] === undefined) return i

    return -1

}

function selectButton(container, id, time) {

    if (container === 'bestButtons') {
        gm.bestTimeSpan = time
        gm.setGraph(gm.best.acronym, gm.bestTimeSpan, 'bestStock_graf')
    } else if (container === 'stockButtons') {
        gm.stockTimeSpan = time
        gm.setGraph(gm.stock.acronym, gm.stockTimeSpan, 'stock_graf')
    }

    document.getElementById(container).querySelectorAll('button').forEach(b => {
        b.classList.add('tbutton')
        b.classList.remove('tbuttonSelected')
    })

    document.getElementById(id).classList.remove('tbutton')
    document.getElementById(id).classList.add('tbuttonSelected')

}


function portfolioInfos() {
    const portfolioContent = document.getElementById("portfolioContent")

    portfolioContent.innerText = ""

    let portfolioTable = document.createElement("table")
    let infos = gm.player.stocks

    if (Object.keys(infos).length > 0) {

        let headerRow = document.createElement("tr")
        let headers = ["Azione", "Valore", "Trend", "Quantità", "Variazione %", "Variazione"]
        headers.forEach(headerText => {
            let header = document.createElement("th")
            header.innerText = headerText;
            headerRow.appendChild(header);
        })
        portfolioTable.appendChild(headerRow);

        for (let k in infos) {
            let row = document.createElement("tr")
            let name = document.createElement("td")
            let value = document.createElement("td")
            let trend = document.createElement("td")
            let amount = document.createElement("td")
            let income_loss_trend = document.createElement("td")
            let income_loss_value = document.createElement("td")

            let singleStock = gm.getStock(k)

            name.innerText = "" + k
            value.innerText = infos[k].purchaseValue.toFixed(3) + " Kr"

            let dailyTrend = (singleStock.getDailyTrend() * 100).toFixed(2)
            if (dailyTrend > 0) {
                trend.style.color = "green"
                trend.innerText = "+" + dailyTrend + "%"
            } else {
                if (dailyTrend == 0) {
                    trend.style.color = "white"
                    trend.innerText = dailyTrend + "%"
                } else {
                    trend.style.color = "red"
                    trend.innerText = dailyTrend + "%"
                }
            }

            amount.innerText = infos[k].amount

            let incomeLossTrend = (gm.player.getIncomeLossTrend(singleStock) * 100).toFixed(2)
            if (incomeLossTrend > 0) {
                income_loss_trend.style.color = "green"
                income_loss_trend.innerText = "+" + incomeLossTrend + "%"
            } else {
                if (incomeLossTrend == 0) {
                    income_loss_trend.style.color = "white"
                    income_loss_trend.innerText = incomeLossTrend + "%"
                } else {
                    income_loss_trend.style.color = "red"
                    income_loss_trend.innerText = incomeLossTrend + "%"
                }
            }

            let incomeLossValue = gm.player.getIncomeLossValue(singleStock).toFixed(2)
            if (incomeLossValue > 0) {
                income_loss_value.style.color = "green"
                income_loss_value.innerText = "+" + incomeLossValue + " Kr"
            } else {
                if (incomeLossValue == 0) {
                    income_loss_value.style.color = "white"
                    income_loss_value.innerText = incomeLossValue + " Kr"
                } else {
                    income_loss_value.style.color = "red"
                    income_loss_value.innerText = incomeLossValue + " Kr"
                }
            }


            row.appendChild(name)
            name.classList.add("bestStock_name")

            row.appendChild(value)
            row.appendChild(trend)
            row.appendChild(amount)
            row.appendChild(income_loss_trend)
            row.appendChild(income_loss_value)

            portfolioTable.appendChild(row)

            row.addEventListener('click', () => {
                gm.stock = singleStock
                gm.prepareStockPage()
                toSlide('stockPage')
            })

        }
    } else {
        let row = document.createElement("tr")
        let name = document.createElement("td")
        name.innerText = "Non possiedi alcuna azione"
        row.appendChild(name)
        portfolioTable.appendChild(row)
    }

    portfolioContent.appendChild(portfolioTable)
    // Future updates
    setTimeout(() => {
        portfolioInfos()
    }, GameManager.VALUESPERREALSECONDS * 1000)

}