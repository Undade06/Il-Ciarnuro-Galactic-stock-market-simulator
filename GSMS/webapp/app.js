
/*---SLIDES SYSTEM---*/
function toSlide(id) {
    document.querySelectorAll("div.slide").forEach(function (e) {
        e.classList.add("hidden")
        e.classList.remove("visible")
        e.querySelectorAll("*").forEach(function (e2) {
            e2.tabIndex = "-1"
        })
    })
    let d = document.getElementById(id)
    d.classList.add("visible")
    d.classList.remove("hidden")
    d.querySelectorAll("*").forEach(function (e2) {
        e2.tabIndex = "-1"
    })
}


function getCurrentSlide() {
    let s = document.getElementsByClassName("slide visible")
    if (s.length === 0) return null; else return s[0]
}

const MAXSTOCKVALUE = 1000000
const MINSTOCKVALUE = 0.001
const TIMESTEP = 0.001
const STARTDATE = new Date("2127-01-01").getTime(), REALSTARTDATE = new Date("2024-01-01").getTime()
const SPEEDUP = 60                //1 real second = 1 game minute
const MAXINFLUENCABILITY = 1 / 10000000
let masterCreated = 0              //Flag to determine if masterStock is already created. Used to not let the code use masterStock before is created in the constructor

//mulberry32 seeded random number generator
function mulberry32(a) {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}

function normalDistributedNumber(seed = null) {                    // Generate a random number with standard normal distribution
    let n = mulberry32(seed)
    while (n == 0) n = mulberry32(seed * Math.random() * 10000)            //To avoid zero
    return Math.sqrt(-2.0 * Math.log(n)) * Math.cos(2.0 * Math.PI * n)
}

function Stock(name, description, baseValue, stability, growth, volatility, seed, influencability, ...influencedBy) {
    
    this.name = name

    this.description = description

    this.type = "stock"

    this._baseValue = baseValue
    this._baseValue = this._baseValue < MINSTOCKVALUE ? MINSTOCKVALUE : this._baseValue
    this._baseValue = this._baseValue > MAXSTOCKVALUE ? MAXSTOCKVALUE : this._baseValue

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
        0 - 0.99 will actually decrease variation in values
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
       It seems to make the stock behave exponentially
   */
    this.influencability = influencability
    this.influencability = this.influencability < 0 ? 0 : this.influencability
    this.influencability = this.influencability > MAXINFLUENCABILITY ? MAXINFLUENCABILITY : this.influencability

    //Stocks that influences this stock
    this.influencedBy = removeDuplicatesFromArray(influencedBy)
    if (masterCreated == 1 && !this.influencedBy.includes(masterStock)) {
        this.influencedBy.push(masterStock);            //Add masterstocks in the influences if not present
    }
    masterCreated = 1

    this.rising = Math.sign(this.growth)                    //Positive or negative trend of this stock
}

Stock.prototype = {
    constructor: Stock,
    //Function called once on starting a new game. It calculate previous values to simulate stock history
    initializeStock: function (t) {
        if (t === 'undefined' || t < 0) t = gameTimer()
        let timeWindow = (t / TIMESTEP), w = [], v = this._baseValue,
            influences = [],                 //Temporary array to store values of stock that influence this one
            influencesPerTime = []           //Every average influence on this stock in every time instant

        w.push(this._baseValue)

        if (this != masterStock) {

            this.influencedBy.forEach((s) => { influences.push(s.initializeStock(t)) })            //Save stock value

            influencesPerTime.push(0)                                                   //First value of stock cannot be influenced(it's its base value)
            for (let i = 1; i < timeWindow; i++) {
                influencesPerTime.push(0)                                               //Push a zero to sum influence
                influences.forEach((s) => { influencesPerTime[i] += ((s[i] - s[i - 1]) / s[i - 1]) * this.influencability })           //Sum every influence
            }
        }

        for (let i = 1; i < timeWindow; i++) {                                                  //Wiener process with drift
            if (this.rising == 1) v += this.growth * TIMESTEP + this.volatility * Math.sqrt(TIMESTEP) * normalDistributedNumber(this.seed + i)
            else v -= this.growth * TIMESTEP + this.volatility * Math.sqrt(TIMESTEP) * normalDistributedNumber(this.seed + i)
            if (this != masterStock) v += v * influencesPerTime[i]                          //Calculate influence in this time instant
            //Check if value is legal
            v = v < MINSTOCKVALUE ? MINSTOCKVALUE : v
            v = v > MAXSTOCKVALUE ? MAXSTOCKVALUE : v
            if (mulberry32(this.seed + i) > this.stability) this.rising *= -1            //The stock invert its trend to simulate random real shock
            w.push(v)
        }
        this.value = w[w.length - 1]

        return w
    },
    //Function that calculate 1 step in time of stock value
    getNextValue: function () {
        let v = this.value, averageInfluence = 0

        if (this != masterStock) {
            this.influencedBy.forEach((s) => { averageInfluence += s.getTrend() * this.influencability })
            averageInfluence /= this.influencedBy.length
        }

        if (this.rising == 1) v += this.growth * TIMESTEP + this.volatility * Math.sqrt(TIMESTEP) * normalDistributedNumber(this.seed + gameTimer())
        else v -= this.growth * TIMESTEP + this.volatility * Math.sqrt(TIMESTEP) * normalDistributedNumber(this.seed + gameTimer())

        if (this != masterStock) v += v * averageInfluence

        v = v < MINSTOCKVALUE ? MINSTOCKVALUE : v
        v = v > MAXSTOCKVALUE ? MAXSTOCKVALUE : v
        if (mulberry32(this.seed + gameTimer()) > this.stability) this.rising *= -1
        this.value = v

        return v
    },
    //Function that calculate stock trend
    //To do: update this func to calculate trend on different time window(1 week, 1 month etc...) 
    getTrend: function () {
        let v1 = this.value
        let v2 = this.getNextValue()
        return (v2 - v1) / v1
    }
}

//General function that, given an array, remove duplicates in it
function removeDuplicatesFromArray(arr) {
    if (arr == 'undefined' || arr == null) return null
    let cleanedArr = []
    arr.forEach((e) => {
        if (!cleanedArr.includes(e)) cleanedArr.push(e)
    })
    return cleanedArr
}

//Hidden stock. Every other stock is influenced by it
const masterStock = new Stock('master stock', 'master stock', 100, 0.2, 0.5, 100, 123456, 0)

//Function that return game time as number
function gameTimer() {
    return new Date(STARTDATE + (Date.now() - REALSTARTDATE) * SPEEDUP) / (1000 * 60 * 60 * 24)
}

//Function that return game timer as a readable date
function gameTimerAsDate() {
    return new Date(gameTimer() * (1000 * 60 * 60 * 24))
}