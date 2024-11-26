
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

//mulberry32 seeded random number generator
function mulberry32(a) {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}

function normalDistributedNumber(seed = null) {                    // Generate a random number with standard normal distribution
    let n = mulberry32(seed)
    while (n === 0) n = mulberry32(seed * Math.random() * 10000)            //To avoid zero
    return Math.sqrt(-2.0 * Math.log(n)) * Math.cos(2.0 * Math.PI * n)
}

function Stock(name, description, baseValue, growth, volatility, seed, ...influencedBy) {
    this.name = name
    this.description = description
    this.type = "stock"
    this._baseValue = baseValue
    this._baseValue = this._baseValue < MINSTOCKVALUE ? MINSTOCKVALUE : this._baseValue
    this._baseValue = this._baseValue > MAXSTOCKVALUE ? MAXSTOCKVALUE : this._baseValue
    this.growth = growth
    //Empiric tests have shown that a growth value is fairly acceptable between -1(decrease) and 1
    this.growth = this.growth < -1 ? -1 : this.growth
    this.growth = this.growth > 1 ? 1 : this.growth
    this.volatility = volatility
    //Empiric tests have shown that a volatility value is fairly acceptable between 0 and 2
    this.volatility = this.volatility < 0 ? 0 : this.volatility
    this.volatility = this.volatility > 2 ? 2 : this.volatility
    this.seed = seed
    this.influencedBy = influencedBy                //Stocks that influences this stock
}

Stock.prototype = {
    constructor: Stock,
    getValues: function (t) {
        if (t === 'undefined' || t < 0) t = gameTimer()
        let n = (t / TIMESTEP), w = [], v = this._baseValue

        w[0] = this._baseValue

        for (let i = 1; i < n; i++) {
            v = v * Math.exp(
                (this.growth - (Math.pow(this.volatility, 2) / 2)) * TIMESTEP
                +
                this.volatility * Math.sqrt(TIMESTEP) * normalDistributedNumber(this.seed + i) //Add a variability to the seed to not let stock value grow exponentially
            )
            v = v < MINSTOCKVALUE ? MINSTOCKVALUE : v
            v = v > MAXSTOCKVALUE ? MAXSTOCKVALUE : v
            w.push(v)
        }
        return w
    }
}

function gameTimer() {
    return new Date(STARTDATE + (Date.now() - REALSTARTDATE) * SPEEDUP) / (1000 * 60 * 60 * 24)
}

function gameTimerAsDate(t) {
    if (typeof t === "undefined") t = gameTimer()
    return new Date(t * (1000 * 60 * 60 * 24))
}