
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

function normalDistributedNumber(seed) {                    // Generate a random number with standard normal distribution
    let u = 0, v = 0
    if (seed === 'undefined' || seed < 1) {
        while (u === 0) u = mulberry32(Math.random() * 10000)               // To avoid zero
        while (v === 0) v = mulberry32(Math.random() * 10000)
    } else {
        u = mulberry32(seed)
        while (u === 0) u = mulberry32(Math.random() * 10000)
        v = mulberry32(seed)
        while (v === 0) v = mulberry32(Math.random() * 10000)
    }
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function Stock(name, description, baseValue, growth, volatility, seed) {
    this.name = name
    this.description = description
    this.type = "stock"
    this._baseValue = baseValue
    this.growth = growth
    this.volatility = volatility
    this.seed = seed
}

Stock.prototype = {
    constructor: Stock,
    getValues: function (t) {
        if (t === 'undefined' || t < 0) t = gameTimer()
        let n = (t / TIMESTEP),
            w = []

        w[0] = this._baseValue
        for (let i = 1; i < n; i++) w.push(Math.min(MAXSTOCKVALUE, Math.max(                            // Apply geometric Brownian motion
            MINSTOCKVALUE,
            w[i - 1] * Math.exp(
                (this.growth - (Math.pow(this.volatility, 2) / 2)) * TIMESTEP
                +
                this.volatility * Math.sqrt(TIMESTEP) * normalDistributedNumber(this.seed + i)
            )
        )))
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