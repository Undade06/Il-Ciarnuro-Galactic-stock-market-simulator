
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

// All these are supposed
const MAXSTOCKVALUE = 100000
const TIMESTEP = 0.01       // Second

//mulberry32 seeded random number generator
function mulberry32(a) {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}

function Stock(name, description, baseValue, growth, volatility) {
    this.name = name
    this.description = description
    this.type = "stock"
    this._baseValue = baseValue
    this.growth = growth
    this.volatility = volatility
}

Stock.prototype = {
    constructor: Stock,
    getValue: function (t) {
        return this._baseValue * Math.exp(((this.growth - (Math.pow(this.volatility, 2) / 2)) * t) + this.volatility * this.wiener(t))
    },
    wiener: function (t) {
        let n = Math.floor(t / TIMESTEP),         // Step number
            z,                                      // Standard normal random variable
            dw,                                     // Process increment
            sum = 0

        for (let i = 0; i < n; i++) {
            z = this.ndn()
            dw = Math.sqrt(TIMESTEP) * z
            sum += dw
        }
        return Math.max(-3, Math.min(3, sum))           //Limit Wiener to the range -3, 3
    },
    ndn: function () {                    // Generate a random number with standard normal distribution 
        let u = 0, v = 0;
        while (u === 0) u = mulberry32(Math.random())               // To avoid zero
        while (v === 0) v = mulberry32(Math.random())
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    }
}