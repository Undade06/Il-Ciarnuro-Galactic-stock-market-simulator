function Stock(name, acronym, description, baseValue, stability, growth, volatility, seed, influencability, ...influencedBy) {

    this.name = name

    this.acronym = acronym

    this.description = description

    this.type = "stock"

    this._baseValue = baseValue
    this._baseValue = this._baseValue < Stock.MINVALUE ? Stock.MINVALUE : this._baseValue
    this._baseValue = this._baseValue > Stock.MAXVALUE ? Stock.MAXVALUE : this._baseValue

    this.value = this.baseValue

    /*
        Stability is a variable that introduces random shock as a real world random event.
        Due to the implementation of this simulation, its values are set between 0 and 1:
        0 make the stock extremely sensible, changing its trend continuosly
        1 make the stock not too realistically stable, so it's recommended to not set it above 0.9
    */
    this.stability = 1 - stability
    this.stability = this.stability < 0 ? 0 : this.stability
    this.stability = this.stability > 1 ? 1 : this.stability

    /*
        Growth is an index of how much the stock changes over time, both in rising and falling time.
        But even if it's equal to 0 there's enaugh variables to not let stock value be constant
    */
    this.growth = growth
    this.growth = this.growth < 0 ? 0 : this.growth
    this.growth = this.growth > 10 ? 10 : this.growth

    /*  
        Tests have shown that a volatility value is fairly acceptable between 0 and 100
        0 - 0.99 will actually decrease variation between values
        100 is super volatile, it's not recommended to set it above 20, especially on long term simulation
    */
    this.volatility = volatility
    this.volatility = this.volatility < 0 ? 0 : this.volatility
    this.volatility = this.volatility > 100 ? 100 : this.volatility

    /*
        Seed doesn't have particular restriction, apart from being an integer
    */
    this.seed = seed
    this.seed = typeof this.seed !== 'number' ? Math.random() * 10000 : this.seed
    this.seed = this.seed < 1 ? this.seed * 10000 : this.seed

    /*  
       Influencability it's an extremely delicate variable
       It makes the stock behave exponentially
   */
    this.influencability = influencability
    this.influencability = this.influencability < 0 ? 0 : this.influencability
    this.influencability = this.influencability > Stock.MAXINFLUENCABILITY ? Stock.MAXINFLUENCABILITY : this.influencability

    //Stocks that influences this stock
    this.influencedBy = removeDuplicatesFromArray(influencedBy)
    if (Stock.masterCreated == 1 && !this.influencedBy.includes(masterStock)) {
        this.influencedBy.push(masterStock)            //Add masterstocks in the influences if not present
    }
    Stock.masterCreated = 1

}

Stock.prototype = {
    constructor: Stock,
    //Function that calculate previous values to simulate stock history in GameManager.MAXYEARGAP time in the past returning values ​​from (today - t time) to today
    //expecting t in days
    //CalculatingTrend is a flag used to not let the function reduce the array size in order to make trend calculation more accurate and not update stock value
    simulateHistory: function (t = 1, calculatingTrend = false) {

        if (t === undefined || t < 0 || t % 1 != 0) throw 'Passed time is not valid'

        let timeWindow = (GameManager.MAXYEARGAP * 365 / Stock.TIMESTEP), w = [], v = this._baseValue, rising = Math.sign(this.growth),
        influences = [],                 //Temporary array to store values of stock that influence this one
        influencesPerTime = []           //Every average influence on this stock in every time instant

        w.push(this._baseValue)

        if (this != masterStock) {

            this.influencedBy.forEach((s) => { influences.push(s.simulateHistory(t, true)) })            //Save stock value

            influencesPerTime.push(0)                                                   //First value of stock cannot be influenced(it's its base value)
            for (let i = 1; i < timeWindow; i++) {

                influencesPerTime.push(0)                                               //Push a zero to sum influence

                influences.forEach((s) => { influencesPerTime[i] += ((s[i] - s[i - 1]) / s[i - 1]) * this.influencability })           //Sum every influence

            }
        }

        for (let i = 1; i < timeWindow; i++) {                                                  //Wiener process with drift

            if (rising == 1) v += this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + i)
            else v -= this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + i)

            if (this != masterStock) v += v * influencesPerTime[i]                          //Calculate influence in this time instant

            //Check if value is legal
            v = v < Stock.MINVALUE ? Stock.MINVALUE : v
            v = v > Stock.MAXVALUE ? Stock.MAXVALUE : v

            if (mulberry32(this.seed + i) > this.stability) rising *= -1            //The stock invert its trend to simulate random real shock

            w.push(v)

        }

        //Reduce the array to just today - t time window
        if(!calculatingTrend) w = w.splice(w.length - (t / Stock.TIMESTEP), t / Stock.TIMESTEP)

        // Reduce the array if it's larger than GameManager.MAXVISUALIZABLEVALUES
        // It helps game's realism limiting Wiener's process self-similarity
        while (!calculatingTrend && w.length > GameManager.MAXVISUALIZABLEVALUES) {

            let interval = ~~(w.length / GameManager.MAXVISUALIZABLEVALUES)
            let sampledValues = [], tempW = w
            let window

            // Calculate average value in each interval, which is calculated to reach GameManager.MAXVISUALIZABLEVALUES
            for(i = 0; i < tempW.length; i += interval){
                window = tempW.slice(i, i + interval)
                sampledValues.push(window.reduce((a, b) => a + b, 0) / window.length)
            }

            w = sampledValues

        }
        if(!calculatingTrend) this.value = w[w.length - 1]

        return w
    },
    //Function that calculate 1 step in time of stock value
    nextValue: function () {

        let v = this.value, averageInfluence = 0

        if (this != masterStock) {

            this.influencedBy.forEach((s) => { averageInfluence += s.trend() * this.influencability })
            averageInfluence /= this.influencedBy.length

        }

        if (this.rising == 1) v += this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + GameManager.gameTimer())
        else v -= this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + GameManager.gameTimer())

        if (this != masterStock) v += v * averageInfluence

        v = v < Stock.MINVALUE ? Stock.MINVALUE : v
        v = v > Stock.MAXVALUE ? Stock.MAXVALUE : v

        if (mulberry32(this.seed + GameManager.gameTimer()) > this.stability) this.rising *= -1
        this.value = v

        return v

    },
    // Function that calculate stock trend in given time expecting days
    trend: function (timeSpan = 1) {

        if(isNaN(timeSpan)) throw 'Time span must be a number'
        if(timeSpan % 1 != 0) throw 'Time span cannot be lower than 1 day'
        if(GameManager.MAXYEARGAP * 365  - timeSpan < 0) throw 'Time span cannot be older than ' + GameManager.MAXYEARGAP + ' years'

        let v = this.simulateHistory(timeSpan, true)

        return (this.value - v[v.length - (timeSpan / Stock.TIMESTEP)]) / v[v.length - (timeSpan / Stock.TIMESTEP)]

    }
}

Stock.MAXVALUE = 1000000
Stock.MINVALUE = 0.001
Stock.TIMESTEP = 0.001
Stock.MAXINFLUENCABILITY = 1 / 10000000
Stock.masterCreated = 0              //Flag to determine if masterStock is already created. Used to not let the code use masterStock before is created in the constructor
//Hidden stock. Every other stock is influenced by it
const masterStock = new Stock('master stock', 'master stock', 'master stock', 100, 0.2, 0.5, 100, 123456, 0)

//ETF doesn't have it's own attribute such as growth, stability ecc.
//It's value is simply calculated on stock's value that compose it
function ETF(name, acronym, description, influencedBy) {

    this.name = name

    this.acronym = acronym

    this.description = description

    this.type = "ETF"
    
    this.value = undefined

    //Stocks that compose this ETF, it's supposed to be an array such as {stock, percentual composition}
    this.influencedBy = removeDuplicatesFromArray(influencedBy)

    let composition = 0
    influencedBy.forEach((e) => { composition += e.perc })
    if (composition != 1) throw 'ETF composition doesn\'t reach 100%'

}

ETF.prototype = {
    constructor: ETF,
    //Function called once on starting a new game. It calculate previous values to simulate etf history
    simulateHistory: function (t = 0) {

        let timeWindow = (t / Stock.TIMESTEP), stocksValues = [], values, tempValue, value = []

        this.influencedBy.forEach((e) => {          //Register all stock value
            stocksValues.push(e.stock.simulateHistory(t, true))
        })

        for (let i = 0; i < timeWindow; i++) {          //Calculate value for each stock with relative influence
            values = []             //Temporary array to store each stock value in 'i' time
            tempValue = 0
            stocksValues.forEach((e) => {
                values.push(e[i])
            })
            values.forEach((e) => {
                tempValue += e * this.influencedBy[values.indexOf(e)].perc
            })

            value.push(tempValue)
        }
        this.value = value[value.length - 1]

        return value
    },
    // Function that calculate ETF trend in given time expecting days
    trend: function (timeSpan = 1) {

        if(isNaN(timeSpan)) throw 'Time span must be a number'
        if(timeSpan % 1 != 0) throw 'Time span cannot be lower than 1 day'
        if(GameManager.MAXYEARGAP * 365  - timeSpan < 0) throw 'Time span cannot be older than ' + GameManager.MAXYEARGAP + ' years'

        let v = this.simulateHistory(timeSpan, true)

        return (this.value - v[v.length - (timeSpan / Stock.TIMESTEP)]) / v[v.length - (timeSpan / Stock.TIMESTEP)]

    }
}

function GameManager(pName = undefined) {

    // Player object to manipulate player action
    this.player = new Player(pName)

    // Index of selected save
    this.saveSelected = undefined

    // Saves array that contains each player saves with their own different market
    this.saves = []

}

GameManager.prototype = {
    constructor: GameManager,
    initializeSave: function (index) {

        if (isNaN(index) || index < 0 || index > GameManager.MAXSAVES) throw 'Passed saves index doesn\'t isn\'t valid'

        this.saveSelected = index
        Save.loadMarket().then(save => { this.saves[index] = save; this.saves[index].saveId = index })

    },
    startGame: function(saveIndex){

        if(this.player === undefined) throw 'Player not created'
        if(this.saves[saveIndex] === undefined) throw 'Save not initialized'

        for(s in this.saves[saveIndex].stocks) this.saves[saveIndex].stocks[s].simulateHistory(GameManager.MAXYEARGAP * 365)

    },
    // Function called to get values to generate stock chart expecting days
    getHistory: function (sAcronym, timeSpan = 1) {

        if (this.saveSelected === undefined) throw 'Save not initialized'
        if (timeSpan < 1) throw 'Time span cannot be lower than 1 day'

        return this.saves[this.saveSelected].stocks[sAcronym].simulateHistory(timeSpan)

    },
    PlayerPurchase: function(sAcronym, amount){

        if(this.player === undefined) throw 'Player not created'
        if(this.saveSelected === undefined) throw 'Save not initialized'

        try {
            this.player.buy(this.saves[this.saveSelected].stocks[sAcronym], amount)
        } catch (error) {
            console.error(error)
        }

    },
    PlayerSell: function(sAcronym, amount){

        if(this.player === undefined) throw 'Player not created'
        if(this.saveSelected === undefined) throw 'Save not initialized'

        try {
            this.player.sell(sAcronym, amount)
        } catch (error) {
            console.error(error)
        }

    }
    // TO DO: when db will be available, create the function to query it and load or save the save with the correct seed
}

GameManager.YEARSHIFT = 150                      // ~2174
GameManager.MAXYEARGAP = 5              // Maximum year gap that can be simulted by stock generation
GameManager.SPEEDUP = 60                //1 real second = 1 game minute
GameManager.REALSTARTDATE = new Date().getTime()
GameManager.STARTDATE = new Date(GameManager.REALSTARTDATE + 365 * 24 * 60 * 60 * 1000 * GameManager.YEARSHIFT).getTime()
GameManager.MAXSAVES = 3
GameManager.MAXVISUALIZABLEVALUES = 1 / Stock.TIMESTEP

//Function that return game time as number representing the days passed since the game started
GameManager.gameTimer = function () {
    return new Date(GameManager.STARTDATE + (new Date().getTime() - GameManager.REALSTARTDATE) * GameManager.SPEEDUP) / (1000 * 60 * 60 * 24)
}

//Function that return game timer as a readable date
GameManager.gameTimerAsDate = function () {
    return new Date(GameManager.gameTimer() * (1000 * 60 * 60 * 24))
}

function Player(name) {

    this.name = name
    this.wallet = Player.startMoney
    this.honorGrade = '0'
    this.stocks = {}            // Both standard stocks and etfs, supposed to be s: amount 

}

Player.prototype = {
    constructor: Player,
    buy: function (stock, amountP) {

        if ((stock instanceof Stock && stock instanceof ETF) || isNaN(Number(amountP))) throw 'Parameters not supported'

        let price = stock.value * amountP

        if (price > this.wallet) throw 'Player doesn\'t have enaugh money'

        this.wallet -= price

        this.stocks[stock.acronym] = { s: stock, amount: amountP }

    },
    allIn: function (stock) {

        if ((stock instanceof Stock && stock instanceof ETF) || isNaN(Number(amountP))) throw 'Parameters not supported'

        for (let i = 0; true; i++) {

            if (stock.value * i > this.wallet) break

        }
        i--

        this.wallet -= stock.value * i

        this.stocks[stock.acronym] = { s: stock, amount: i }

    },
    sell: function (stockAcronym, amountP) {

        if (stockAcronym === undefined || isNaN(Number(amountP))) throw 'Parameters not supported'
        if (this.stocks[stockAcronym] === undefined) throw 'Player doesn\'t own passed stock'
        if (this.stocks[stockAcronym].amount < amountP) throw 'Player doesn\'t have such amount of passed stock'

        this.wallet += this.stocks[stockAcronym].s.value * amountP

        this.stocks[stockAcronym].amount -= amountP
        if (this.stocks[stockAcronym].amount == 0) this.stocks[stockAcronym] = undefined

    },
    sellAll: function (stockAcronym) {

        if (stockAcronym === undefined || isNaN(Number(amountP))) throw 'Parameters not supported'
        if (this.stocks[stockAcronym] === undefined) throw 'Player doesn\'t own passed stock'

        this.wallet += this.stocks[stockAcronym].s.value * this.stocks[stockAcronym].amount

        this.stocks[stockAcronym] = undefined

    },
    calculateHonorGrade: function () {

        let e = this.wallet
        if (e <= 0) return -1
        else if (e < 100) return 0
        else if (e < 300) return 1
        else if (e < 700) return 2
        else if (e < 1500) return 3
        else if (e < 5000) return 4
        else if (e < 15000) return 5
        else if (e < 50000) return 6
        else if (e < 100000) return 7
        else if (e < 1000000) return 8
        else if (e < 10000000) return 9
        else return 10

    }
}

Player.startMoney = 25000

/*
    Save is a class that represent the market for each save
*/
function Save(stocks = undefined, saveId = undefined) {

    // Stocks dictionary that contains all save's stocks and ETFs
    this.stocks = stocks

    this.saveId = saveId

}

Save.prototype = {
    constructor: Save
}

/*
    Send an XMLHTTPREQUEST to fetch from market.json all market stocks and etfs with their parameters, 
    except for seed, which is randomized to make each market different if seeds dict is not passed

    seeds is a dictionary with index as stock acronym and the actual seed:  seeds['CFA'] = 219866
    
    It supposes that in market.json stocks that influence other stocks and/or compose an etf/s are written before those influenced stocks or etfs
*/
Save.loadMarket = function (seeds = undefined) {

    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()
        xhr.onload = function () {
            try {
                
                let data = JSON.parse(xhr.responseText)

                let stocks = {}

                stocks[masterStock.acronym] = masterStock

                for (id in data) {

                    let s = data[id], tempInfl, tempSeed

                    if (s.type === 'stock') {

                        tempInfl = []

                        s.influencedBy.forEach((stockId) => tempInfl.push(stocks[stockId]))

                        if(seeds !== undefined && seeds[id] !== undefined) tempSeed = seeds[id]
                        else tempSeed = /* Temporarily fixed seed */ 648157

                        stocks[id] = new Stock(s.name, id, s.description, s.params[0], s.params[1], s.params[2], s.params[3], tempSeed, s.params[4])

                        tempInfl.forEach(e => {
                            stocks[id].influencedBy.push(e)
                        })

                    } else if (s.type === 'ETF') {

                        tempInfl = []

                        for (id2 in s.composition) tempInfl.push({ stock: stocks[id2], perc: s.composition[id2] })

                        stocks[id] = new ETF(s.name, id, s.description, tempInfl)

                    } else throw 'Uknown type: ' + s.type

                }

                resolve(new Save(stocks))

            } catch (e) {
                reject(e)
            }
        }

        xhr.onerror = function () { reject('Failed to load market.json') }
        xhr.open('GET', 'market.json')
        xhr.send()

    })

}


//      Functions outside any classes

// mulberry32 seeded random number generator
function mulberry32(a) {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}

// Generate a random number with standard normal distribution
function normalDistributedNumber(seed = null) {
    let n = mulberry32(seed)
    while (n == 0) n = mulberry32(seed * Math.random() * 10000)
    return Math.sqrt(-2.0 * Math.log(n)) * Math.cos(2.0 * Math.PI * n)
}

// General function that, given an array, remove duplicates in it
function removeDuplicatesFromArray(arr) {
    if (arr === undefined || arr === null) return null
    let cleanedArr = []
    arr.forEach((e) => {
        if (!cleanedArr.includes(e)) cleanedArr.push(e)
    })
    return cleanedArr
}