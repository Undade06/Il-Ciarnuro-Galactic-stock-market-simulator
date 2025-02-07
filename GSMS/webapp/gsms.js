//let stet = 'Li'
/**
 * Stock constructor
 * 
 * Stock is a class that simulate real stock market securities using Wiener process with drift.
 * In this simulation the stock behavior, given same parameters, is deterministic. Same parameters will result in the same behavior.
 * To keep stock behavior real it's recommended to not set all of the stock parameters(stability, growth and volatility) at their maximum nor minimum, 
 * especially not all together
 * 
 * @param {String} name Complete name of the stock
 * @param {String} acronym Abbreviation acronym of the stock
 * @param {String} description Description of the stock
 * @param {Number} baseValue Value of the stock at the start of the game simulation (GameManager.STARTDATE).
        NOTE: stock base value will NOT be the one passed, but another one randomized value based on it
 * @param {Number} stability Stability is a variable that introduces random shock as a real world random event.
        Due to the implementation of this simulation, its values are set between 0 and 1:
        0 make the stock extremely sensible, changing its trend continuosly
        1 make the stock not too realistically stable, so it's recommended to not set it above 0.9
 * @param {Number} growth Growth is an index of how much the stock changes over time, both in rising and falling time.
        Actually, even if it's equal to 0 there's enaugh variables to not let stock value be constant, but its behavior won't be directed
 * @param {Number} volatility Volatility is the 'drift' in Wiener process, it makes the stock value change in a random way. 
        The higher the value, the higher the variation.
        tests have shown that a volatility value is fairly acceptable between 0 and 5.
        0 - 0.99 will actually decrease variation between values
        it's not recommended to set it above 3 if this stock is influencying other stock(it make those influenced stock behave not realistically)
 * @param {Number} seed Seed of the stock, used to differentiate stock with same parameters.
        Due to implementation assumptions it has to be a Stock.SEEDDIGITS(6 digit) integer
 * @param {Number} influenceability Influenceability is a variable that makes the stock value change according to other stocks.
        If the parameters of the stock/s that influences this stock aren't set properly, this stock will not behave realistically
 * @param {Number} dividendsPercentage Percentage of dividends of this stock
 * @param {Number} daysDividendsFrequency Frequency of dividends payment in days of this stock
 * @param {Number} commPerOperation Commission per operation of this stock
 * @param {Number} earningTax Earnign tax which weighs on this stock sales
 * @param  {...Stock} influencedBy Stocks that influences this stock according to this stock's influenceability
 */
function Stock(name, acronym, description, baseValue, stability, growth, volatility, seed, influenceability, dividendsPercentage, daysDividendsFrequency, commPerOperation, earningTax, ...influencedBy) {

    this.name = name

    this.acronym = acronym

    this.description = description

    this.type = "stock"

    this._baseValue = baseValue
    this._baseValue = this._baseValue < Stock.MINVALUE ? Stock.MINVALUE : this._baseValue
    this._baseValue = this._baseValue > Stock.MAXVALUE ? Stock.MAXVALUE : this._baseValue

    // Variable to store this stock trend from last Stock.TIMESTEP in order to lighten the calculation
    this._trend = undefined

    // Array to store last day values in order to simplify the calculation of last day variation
    this._lastDayValues = []

    this.stability = 1 - stability
    this.stability = this.stability < Stock.MINSTABILITY ? Stock.MINSTABILITY : this.stability
    this.stability = this.stability > Stock.MAXSTABILITY ? Stock.MAXSTABILITY : this.stability

    this.growth = growth
    this.growth = this.growth < Stock.MINGROWTH ? Stock.MINGROWTH : this.growth
    this.growth = this.growth > Stock.MAXGROWTH ? Stock.MAXGROWTH : this.growth

    this.rising = Math.sign(this.growth)

    this.volatility = volatility
    this.volatility = this.volatility < Stock.MINVOLATILITY ? Stock.MINVOLATILITY : this.volatility
    this.volatility = this.volatility > Stock.MAXVOLATILITY ? Stock.MAXVOLATILITY : this.volatility

    this.seed = ~~seed
    this.seed = typeof this.seed !== 'number' || isNaN(this.seed) || ('' + this.seed).length !== Stock.SEEDDIGITS ? ~~(Math.random() * Math.pow(10, Stock.SEEDDIGITS)) : this.seed

    this.influenceability = influenceability
    this.influenceability = this.influenceability < Stock.MININFLUENCEABILITY ? Stock.MININFLUENCEABILITY : this.influenceability
    this.influenceability = this.influenceability > Stock.MAXINFLUENCEABILITY ? Stock.MAXINFLUENCEABILITY : this.influenceability

    if (dividendsPercentage === undefined || isNaN(dividendsPercentage) || dividendsPercentage < 0 || dividendsPercentage > 1) throw this.acronym + ': undefined or illegal dividends percentage(' + dividendsPercentage + ')'
    this.dividendsPercentage = dividendsPercentage

    if (daysDividendsFrequency === undefined || isNaN(daysDividendsFrequency) || daysDividendsFrequency < 0) throw this.acronym + ': undefined or illegal dividends frequency in days(' + daysDividendsFrequency + ')'
    this.daysDividendsFrequency = daysDividendsFrequency

    if (commPerOperation === undefined || isNaN(commPerOperation) || commPerOperation < 0) throw this.acronym + ': undefined or illegal commissions per operation(' + commPerOperation + ')'
    this.commPerOperation = commPerOperation

    if (earningTax === undefined || isNaN(earningTax) || earningTax < 0 || earningTax > 1) throw this.acronym + ': undefined or illegal tax over earnings(' + daysDividendsFrequency + ')'
    this.earningTax = earningTax

    this.influencedBy = removeDuplicatesFromArray(influencedBy)
    if (Stock.masterCreated && !this.influencedBy.includes(masterStock)) {
        this.influencedBy.push(masterStock)            //Add masterstocks in the influences if not present
    }

    //this.krolikRating = this._calculateLongTermInvestmentRating()

    //if (Stock.masterCreated) this.FQRating = this._calculateSpeculativeInvestmentRating()          // Nobody cares if masterstock doesn't have a FQRating

    Stock.masterCreated = true

    this._baseValue += Math.sqrt(Stock.TIMESTEP * 100000) * normalDistributedNumber(this.seed)         // Simulate passed time of stock history
    this._baseValue = this._baseValue < Stock.MINVALUE ? Stock.MINVALUE : this._baseValue
    this._baseValue = this._baseValue > Stock.MAXVALUE ? Stock.MAXVALUE : this._baseValue

    this.value = this._baseValue

}

Stock.prototype = {
    constructor: Stock,
    /**
     * Function that calculate previous values to simulate stock history in GameManager.MAXYEARGAP time in the past returning values ​​from (today - t time) to today
     * 
     * @param {Number} t Time window in the past in which values are returned
     * @param {Boolean} calculatingTrend Flag used to not let the function reduce the array size in order to make trend calculation more accurate and not update stock value
     * @returns Arrays of values(Number)
     */
    simulateHistory: function (t = 1, calculatingTrend = false) {

        if (t === undefined || t < 0 || t % 1 !== 0) throw 'Passed time is not valid'

        let timeWindow = GameManager.currentNumberValue(),
            w = [], v = this._baseValue, rising = Math.sign(this.growth),
            influences = [],                 //Temporary array to store values of stock that influence this one
            influencesPerTime = []           //Every average influence on this stock in every time instant

        w.push(this._baseValue)

        if (this != masterStock) {

            this.influencedBy.forEach((s) => { influences.push(s.simulateHistory(t, true)) })            //Save stock value

            influencesPerTime.push(0)                                                   //First value of stock cannot be influenced(it's its base value)
            for (let i = 1; i < timeWindow; i++) {

                influencesPerTime.push(0)                                               //Push a zero to sum influence

                influences.forEach((s) => { influencesPerTime[i] += ((s[i] - s[i - 1]) / s[i - 1]) * this.influenceability })           //Sum every influence

            }

        }

        //let T_T = []
        for (let i = 1; i < timeWindow; i++) {           //Wiener process with drift

            //if (this.acronym === stet) T_T.push({ i: i, info: { lastV: v, rising: rising, formule: this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + i), infl: influencesPerTime[i], nextV: 0 } })
            if (rising === 1) {
                v += this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + i)
            }
            else {
                v -= this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + i)
            }

            if (this != masterStock) v += v * influencesPerTime[i]                          //Calculate influence in this time instant

            //if (this.acronym === stet) T_T[i - 1].info.nextV = v

            //Check if value is legal
            v = v < Stock.MINVALUE ? Stock.MINVALUE : v
            v = v > Stock.MAXVALUE ? Stock.MAXVALUE : v

            if (mulberry32(this.seed + i) > this.stability) rising *= -1            //The stock invert its trend to simulate random real shock

            w.push(v)

        }

        this._lastDayValues = w.slice(w.length - (1 / Stock.TIMESTEP))

        //if (this.acronym === stet) console.log(T_T.splice(T_T.length - 50, 50))

        if (!calculatingTrend) {

            this.value = w[w.length - 1]
            this._trend = (w[w.length - 1] - w[w.length - 2]) / w[w.length - 2]
            this.rising = rising

            /*if (this.acronym === stet) {

                console.log('Last history       ' + (timeWindow - 1))
                console.log('Value: ' + v)
                console.log('Rising: ' + rising)
                console.log('Formule: ' + (this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + timeWindow - 1)))

            }*/

            // Reduce the array to just today - t time window
            w = w.splice(w.length - (t / Stock.TIMESTEP), t / Stock.TIMESTEP)

            // Reduce the array if it's larger than GameManager.MAXVISUALIZABLEVALUES
            // It helps game's realism limiting Wiener's process self-similarity
            if (w.length > GameManager.MAXVISUALIZABLEVALUES) w = Stock.reduceHistory(w)

        }

        return w
    },
    /**
     * Generate new stock value and update stock value
     * 
     * @param {Number} offSet Number representing what n value is calculated
     * @returns new value generated
     */
    nextValue: function (offSet = GameManager.currentNumberValue()) {

        let v = this.value, averageInfluence = 0

        if (this != masterStock) {

            // Average influence is calculated on last trend of each unfluencing stock
            this.influencedBy.forEach((s) => { averageInfluence += s._trend * this.influenceability })
            averageInfluence /= this.influencedBy.length

        }

        /*if (this.acronym === stet) {

            console.log(this.acronym + ' last params nextV()                 ' + offSet)
            console.log('LastV: ' + v)
            console.log('Rising: ' + this.rising)
            console.log('Formule: ' + (this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + offSet)))
            console.log('avgInfl: ' + averageInfluence)

        }*/

        if (this.rising === 1) {
            v += this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + offSet)
        }
        else {
            v -= this.growth * Stock.TIMESTEP + this.volatility * Math.sqrt(Stock.TIMESTEP) * normalDistributedNumber(this.seed + offSet)
        }
        if (this != masterStock) v += v * averageInfluence

        v = v < Stock.MINVALUE ? Stock.MINVALUE : v
        v = v > Stock.MAXVALUE ? Stock.MAXVALUE : v

        if (mulberry32(this.seed + offSet) > this.stability) this.rising *= -1

        /*if (this.acronym === stet) {

            console.log('Result: ' + v)

        }*/

        this._trend = (v - this.value) / this.value
        this._lastDayValues.push(v)
        this._lastDayValues.shift()
        this.value = v

        return v

    },
    /**
     * Calculate stock trend in given time
     * 
     * @param {Number} timeSpan Days in the past from which to calculate the trend
     * @returns trend value(Number, not a percentage)
     */
    trend: function (timeSpan = 1) {

        if (isNaN(timeSpan)) throw 'Time span must be a number'
        if (timeSpan % 1 != 0) throw 'Time span cannot be lower than 1 day'
        if (GameManager.MAXYEARGAP * 365 - timeSpan < 0) throw 'Time span cannot be older than ' + GameManager.MAXYEARGAP + ' years'

        let v = this.simulateHistory(timeSpan, true)

        return (this.value - v[v.length - (timeSpan / Stock.TIMESTEP)]) / v[v.length - (timeSpan / Stock.TIMESTEP)]

    },
    /**
     * Calculate long term investment rating of this stock
     * 
     * @returns a number representing the score
     */
    _calculateLongTermInvestmentRating: function () {

        let score = 0
        let n = Math.log(this._baseValue * 0.05 + 1)
        score += n > 3 ? 3 : n

        n = Math.log(this.stability * 1.5 + 1)
        score += n > 3 ? 3 : n

        n = 0.2 / this.volatility
        score += n > 2 ? 2 : n

        n = Math.log(Math.abs(this.influenceability) + 1)
        score += n > 2 ? 2 : n

        score = Math.pow(Math.abs(score), 0.9)
        score *= 1 - this.earningTax

        return score

    },
    /**
     * Calculate speculative investment rating of this stock basing on its last year behavior
     * 
     * @returns 
     */
    _calculateSpeculativeInvestmentRating: function () {

        let score = 0
        let n = Math.log(this.stability + 1)
        score += n > 2 ? 2 : n

        n = Math.log(this.volatility + 1)
        score += n > 2 ? 2 : n

        n = Math.log(Math.abs(normalDistributedNumber(this.seed)) + 1)
        score += n > 2 ? 2 : n

        let min = 9999999, max = 0
        let values = this.simulateHistory(365 * 4, true)
        values = values.splice(values.length - 365 / Stock.TIMESTEP, 365 / Stock.TIMESTEP)

        for (let i = 0; i < 365 / Stock.TIMESTEP; i++) {
            if (values[i] < min) min = values[i]
            if (values[i] > max) max = values[i]
        }

        score += (max - min) / min

        score = Math.pow(Math.abs(score), 1.1)
        score *= 1 - this.earningTax

        return score

    },
    /**
     * Calculate taxes cost of this Stock considering passed amount
     * 
     * @param {Number} sAmount Amount of this stock to sell
     * @returns Number representing the taxes cost
     */
    getTaxesCost: function (sAmount) {

        if (isNaN(sAmount) || sAmount < 0) throw 'Invalid stock\'s amount number'

        return sAmount * this.value * this.earningTax

    },
    /**
     * Get stock's daily variation
     * 
     * @returns Number representing the daily variation(NOT percentage)
     */
    getDailyTrend: function () {

        return (this.value - this._lastDayValues[0]) / this._lastDayValues[0]

    }
}

// Stock's parameters limits
Stock.MAXVALUE = 100000000
Stock.MINVALUE = 0.001
Stock.MINSTABILITY = 0
Stock.MAXSTABILITY = 1
Stock.MINGROWTH = 0
Stock.MAXGROWTH = 10
Stock.MINVOLATILITY = 0
Stock.MAXVOLATILITY = 5
Stock.MININFLUENCEABILITY = 0
Stock.MAXINFLUENCEABILITY = 1
Stock.SEEDDIGITS = 6

// General Stock constants/variables
Stock.TIMESTEP = 1 / 250             // 250 step per day
Stock.masterCreated = false              //Flag to determine if masterStock is already created. Used to not let the code use masterStock before is created in the constructor

/**
 * Function to reduce an array of number(stock history) in order to fit GameManager.MAXVISUALIZABLEVALUES
 * 
 * @param {Number[]} w Array to reduce
 * @returns Array reduced
 */
Stock.reduceHistory = function (w) {

    let interval = ~~(w.length / GameManager.MAXVISUALIZABLEVALUES)
    let sampledValues = [], tempW = w
    let window

    // Calculate average value in each interval, which is calculated to reach GameManager.MAXVISUALIZABLEVALUES
    for (i = 0; i < tempW.length; i += interval) {
        window = tempW.slice(i, i + interval)
        sampledValues.push(window.reduce((a, b) => a + b, 0) / window.length)
    }

    return sampledValues

}

/**
 * ETF constructor
 * 
 * ETF is a class that simulate Exchange Traded Funds, a type of security that involves a collection of securities.
 * Since is value is then calculated on the stock's value that compose it, it doesn't have its own parameters such as growth, stability etc.
 * 
 * @param {String} name Complete name of the ETF
 * @param {String} acronym Abbreviation acronym of the ETF
 * @param {String} description Description of the ETF
 * @param {Stock[]} influencedBy Arrays of stocks that compose this ETF
 * @param {Number} commPerOperation Commission per operation of this ETF
 * @param {Number} earningTax Earnign tax which weighs on this ETF sales
 */
function ETF(name, acronym, description, influencedBy, commPerOperation, earningTax) {

    this.name = name

    this.acronym = acronym

    this.description = description

    this.type = "ETF"

    this.value = undefined

    // Variable to store this stock trend from last Stock.TIMESTEP in order to lighten the calculation
    this._trend = undefined

    //Stocks that compose this ETF, it's supposed to be an array such as {stock, percentual composition}
    this.influencedBy = removeDuplicatesFromArray(influencedBy)

    let composition = 0
    influencedBy.forEach((e) => { composition += e.perc })
    if (1 - composition > 0.000001) throw this.acronym + ' composition doesn\'t reach 100%(' + composition + ')'            // JS has some issues with floating point numbers

    this.commPerOperation = commPerOperation

    this.earningTax = earningTax

    this.krolikRating = this._calculateLongTermInvestmentRating()

    this.FQRating = this._calculateSpeculativeInvestmentRating()
}

ETF.prototype = {
    constructor: ETF,
    /**
     * Function that calculate previous values to simulate ETF history in GameManager.MAXYEARGAP time in the past returning values ​​from (today - t time) to today
     * 
     * @param {Number} t Time window in the past in which values are returned
     * @param {Boolean} calculatingTrend Flag used to not let the function reduce the array size in order to make trend calculation more accurate and not update stock value
     * @returns arrays of values(Number)
     */
    simulateHistory: function (t = 1, calculatingTrend = false) {

        if (t === undefined || t < 0 || t % 1 != 0) throw 'Passed time is not valid'

        let stocksValues = [], values, tempValue, value = []

        this.influencedBy.forEach((e) => {          //Register all stock value
            stocksValues.push(e.stock.simulateHistory(t, true))
        })

        let timeWindow = GameManager.currentNumberValue()

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

        if (!calculatingTrend) {

            this.value = value[value.length - 1]
            this._trend = (value[value.length - 1] - value[value.length - 2]) / value[value.length - 1]

            value = value.splice(value.length - (t / Stock.TIMESTEP), t / Stock.TIMESTEP)
            value = Stock.reduceHistory(value)

        }

        return value
    },
    /**
     * Update ETF value basing it on each current stock value that compose it
     * 
     * @returns New calculated value
     */
    nextValue: function () {

        let v = 0

        this.influencedBy.forEach((e) => { v += e.stock.value * e.perc })

        this._trend = (v - this.value) / this.value
        this.value = v

        return v

    },
    /**
     * Calculate stock trend in given time
     * 
     * @param {Number} timeSpan Days in the past from which to calculate the trend
     * @returns trend value(Number, not a percentage)
     */
    trend: function (timeSpan = 1) {

        if (isNaN(timeSpan)) throw 'Time span must be a number'
        if (timeSpan % 1 != 0) throw 'Time span cannot be lower than 1 day'
        if (GameManager.MAXYEARGAP * 365 - timeSpan < 0) throw 'Time span cannot be older than ' + GameManager.MAXYEARGAP + ' years'

        let v = this.simulateHistory(timeSpan, true)

        return (this.value - v[v.length - (timeSpan / Stock.TIMESTEP)]) / v[v.length - (timeSpan / Stock.TIMESTEP)]

    },
    /**
     * Calculate long term investment rating of this ETF basing on its components long term rating
     * 
     * @returns an number representing the score 
     */
    _calculateLongTermInvestmentRating: function () {

        let score = 0

        this.influencedBy.forEach((e) => {
            score += e.stock.krolikRating * e.perc
        })

        return score

    },
    /**
     * Calculate speculative investment rating of this ETF basing on its components speculative rating
     * 
     * @returns 
     */
    _calculateSpeculativeInvestmentRating: function () {

        let score = 0

        this.influencedBy.forEach((e) => {
            score += e.stock.FQRating * e.perc
        })

        return score

    },
    /**
     * Calculate taxes cost of this ETF considering passed amount
     * 
     * @param {Number} sAmount Amount of this ETF to sell
     * @returns Number representing the taxes cost
     */
    getTaxesCost: function (sAmount) {

        if (isNaN(sAmount) || sAmount < 0) throw 'Invalid ETF\'s amount number'

        return sAmount * this.value * this.earningTax

    },
    /**
     * Get the daily variation of this ETF based on the daily variation of the stocks that compose it
     * 
     * @returns Number representing the daily variation(NOT percentage)
     */
    getDailyTrend: function () {

        let avgVariation = 0

        this.influencedBy.forEach((e) => {
            avgVariation += e.stock.getDailyTrend() * e.perc
        })

        return avgVariation

    }
}

/**
 * GameManager constructor
 * 
 * GammeManager is a class that manage the game. It's supposed to be connected to the GUI in order to properly manage player actions.
 * It's also in charge of managing all backend functions, such as DB query, new save loading, stock generation, etc.
 * 
 * @param {String} pName player name
 */
function GameManager(pName = undefined) {

    // Player object to manipulate player action
    this.player = new Player(pName)

    // Index of selected save
    this.saveSelected = undefined

    // Saves array that contains each player saves with their own different market
    this.saves = []

    // Last time player accessed the game in game time
    this.lastAccess = GameManager.gameTimer()

}

GameManager.prototype = {
    constructor: GameManager,
    /**
     * Function that initialize a new save with a new market
     * 
     * @param {Number} index index of the save to initialize
     */
    initializeSave: function (index) {

        if (isNaN(index) || index < 0 || index > GameManager.MAXSAVES) throw 'Passed saves index isn\'t valid'

        this.saveSelected = index
        Save.loadMarket().then(save => { this.saves[index] = save; this.saves[index].saveId = index })

    },
    /**
     * Function that delete a save
     * 
     * @param {Number} index index of the save to delete
     */
    deleteSave: function (index) {

        if (this.saveSelected === index) throw 'Cannot delete selected save'

        this.saves[index] = undefined

    },
    /**
     * Function that initialize all stocks in the market and make them proceed in time
     */
    startGame: function () {

        if (this.player === undefined) throw 'Player not created'
        if (this.saves[this.saveSelected] === undefined) throw 'Save not initialized'


        let lastTimeUpdated = GameManager.currentNumberValue()
        for (let acr in this.saves[this.saveSelected].stocks) {

            this.getStock(acr).simulateHistory(GameManager.MAXYEARGAP * 365)
            if (lastTimeUpdated !== GameManager.currentNumberValue()) {
                this._syncStocks(lastTimeUpdated)
            }
            lastTimeUpdated = GameManager.currentNumberValue()

        }

        setInterval(() => {

            try {
                this._syncStocks(lastTimeUpdated)
            } catch (error) {
                console.log('Everything up to date(' + lastTimeUpdated + ')')
            }
            lastTimeUpdated = GameManager.currentNumberValue()

        }, GameManager.VALUESPERREALSECONDS * 1000 + 1)

    },
    /**
     * Synchronize all stocks from passed timestep value making them proceed all together till GameManager.currentNumberValue()
     * 
     * @param {Number} lastTimeUpdated Last time where stocks were updated
     */
    _syncStocks: function (lastTimeUpdated) {

        if (isNaN(lastTimeUpdated) || lastTimeUpdated === undefined) throw 'NaN or undefined param'

        let now = GameManager.currentNumberValue(), diff = now - lastTimeUpdated
        if (diff < 0) throw 'Passed param > GameManager.currentNumberValue()'

        //console.log('_syncStocks - lastTimeUpdated: ' + lastTimeUpdated + ' now: ' + now)

        // Workaround to avoid skipping some values due to the execution of the function being overshadowed by other processes
        // generation with nextValue() must be strictly dependant from game's timer
        for (let i = 0; i < diff; i++) {

            for (let acr in this.saves[this.saveSelected].stocks) {

                this.getStock(acr).nextValue(lastTimeUpdated + i)

            }

        }

    },
    /**
     * Simple function to avoid typing a long string to access a stock
     * 
     * @param {String} sAcronym 
     * @returns Stock selected
     */
    getStock: function (sAcronym) {

        if (this.saves[this.saveSelected].stocks[sAcronym] === undefined) throw 'Stock doesn\'t exists'

        return this.saves[this.saveSelected].stocks[sAcronym]

    },
    /**
     * Function that return every rising stock/ETF basing on its _trend
     * 
     * @returns Array with every rising stock/ETF
     */
    getRisings: function () {

        let risings = []

        for (acr in this.saves[this.saveSelected].stocks) {
            if (this.getStock(acr)._trend > 0) {
                risings.push(this.getStock(acr))
            }
        }

        return risings

    },
    /**
     * 
     * 
     * @returns 
     */
    getBestStock: function () {

        let best = this.getStock('Li')          // Random stock

        for (acr in this.saves[this.saveSelected].stocks) {

            if (this.getStock(acr)._trend > best._trend) {
                if (this.getStock(acr) !== masterStock) {
                    best = this.getStock(acr)
                }
            }

        }

        return best

    },
    /**
     * Function that return every falling stock/ETF basing on its _trend
     * 
     * @returns Array with every falling stock/ETF
     */
    getFallings: function () {

        let fallings = []

        for (acr in this.saves[this.saveSelected].stocks) {
            if (this.getStock(acr)._trend < 0) {
                fallings.push(this.getStock(acr))
            }
        }

        return fallings

    },
    /**
     * Function to manage player purchase action. It makes the player buy passed stock and set interval to pay dividends
     * 
     * @param {String} sAcronym acronym of the stock(index of stock dictionary)
     * @param {Number} amount amount of stock to buy
     */
    playerPurchase: function (sAcronym, amount) {

        if (this.player === undefined) throw 'Player not created'
        if (this.saveSelected === undefined) throw 'Save not initialized'

        try {

            this.player.buy(this.saves[this.saveSelected].stocks[sAcronym], amount)
            this.setDividendsPayment(sAcronym)

        } catch (error) {
            console.error(error)
        }

    },
    /**
     * Function to manage player sell action
     * 
     * @param {String} sAcronym acronym of the stock(index of stock dictionary)
     * @param {Number} amount amount of stock to sell
     */
    playerSell: function (sAcronym, amount) {

        if (this.player === undefined) throw 'Player not created'
        if (this.saveSelected === undefined) throw 'Save not initialized'

        try {
            this.player.sell(sAcronym, amount)
        } catch (error) {
            console.error(error)
        }

    },
    /**
     * Set when the dividends of passed stock will be paid to player
     * 
     * @param {String} sAcr Acronym of stock to set dividends payment
     */
    setDividendsPayment: function (sAcr) {

        let s = this.getStock(sAcr)
        if (s === undefined) throw 'Stock doesn\'t exists'
        if (s.dividendsPercentage === 0) throw 'Stock doesn\'t pay dividends'
        if (this.player.stocks[sAcr] === undefined) throw 'Player doesn\'t own passed stock'

        // Next payment day couldn't be exaclty in stock daysDividendsFrequency from now
        setTimeout(() => {

            if (this.player.stocks[sAcr] === undefined) return

            this.player.wallet += this.getStock(sAcr).dividendsPercentage * this.getStock(sAcr).value * this.player.stocks[sAcr].amount
            alert(sAcr + ' dividends payment: ' + this.getStock(sAcr).dividendsPercentage * 100 + ' * ' + this.getStock(sAcr).value + ' * ' + this.player.stocks[sAcr].amount + ' = ' + s.dividendsPercentage * this.getStock(sAcr).value * this.player.stocks[sAcr].amount + 'Kr')

            // But now it will
            let id = setInterval(() => {

                if (this.player.stocks[sAcr] === undefined) {
                    clearInterval(id)
                    return
                }

                this.player.wallet += s.dividendsPercentage * this.getStock(sAcr).value * this.player.stocks[sAcr].amount
                alert(sAcr + ' dividends payment: ' + s.dividendsPercentage * 100 + ' * ' + this.getStock(sAcr).value + ' * ' + this.player.stocks[sAcr].amount + ' = ' + s.dividendsPercentage * this.getStock(sAcr).value * this.player.stocks[sAcr].amount + 'Kr')

            }, s.daysDividendsFrequency * (((24 * 60 * 60) / GameManager.SECSPEEDUP) * 1000))

        }, ((GameManager.gameTimer() - GameManager.STARTDATE) % (this.getStock(sAcr).daysDividendsFrequency * 24 * 60 * 60 / GameManager.SECSPEEDUP)) * 1000)

    },
    /**
     * Function to determine from what stock and how much the player must be paid from dividends from its last access to the game.
     * Since it consider current player owned stock, it's supposed to be called before player can buy or sell any stocks when accessing the game
     * 
     * @returns Array(dictionary) with every stock and amount paid to player, nothing if player didn't own any stock or no dividends has to be paid
     */
    checkDividendsPayment: function () {

        if (Object.keys(this.player.stocks).length === 0) return
        let now = GameManager.gameTimer(), payments = {}, interval

        for (acr in this.player.stocks) {

            interval = this.getStock(acr).daysDividendsFrequency * 24 * 60 * 60 / GameManager.SECSPEEDUP

            if (this.getStock(acr).dividendsPercentage !== 0 && this.lastAccess + interval < now) {

                payments[acr] = 0

                // Values to find what was the stock value when the dividends has been paid
                let values = this.getStock(acr).simulateHistory(365 * 5, true)

                // Determine when the dividends has been paid and store that stock value
                for (let i = now; i > this.lastAccess; i -= interval) {

                    payments[acr] += values[~~(values.length - (now - i) - 1)] * this.getStock(acr).dividendsPercentage * this.player.stocks[acr].amount

                }

                this.player.wallet += payments[acr]

            }

        }

        return payments

    },
    /**
    * Function called to create and update in time a stock graph
    * 
    * @param {String} sAcronym acronym of the stock(index of stock dictionary)
    * @param {Number} timeSpan time window in the past in which values are displayed
    * @param {String} id DOM id to manage updates in time
    */
    setGraph: function (sAcronym, timeSpan = 1, id) {

        if (this.saveSelected === undefined) throw 'Save not initialized'
        if (timeSpan < 1) throw 'Time span cannot be lower than 1 day'
        if (document.getElementById(id) === undefined) throw 'Undefined graph'

        let g = document.getElementById(id)
        if (!(g instanceof HTMLCanvasElement)) g = g.querySelector('canvas.chart')
        if (!(g instanceof HTMLCanvasElement)) throw 'Couldn\'t find a graph'

        let s = this.getStock(sAcronym)
        let history = s.simulateHistory(timeSpan, true), values = []
        let date = GameManager.gameTimer() / (1000 * 60 * 60 * 24) - timeSpan
        let step = timeSpan / GameManager.MAXVISUALIZABLEVALUES

        history = history.splice(history.length - (timeSpan / Stock.TIMESTEP), timeSpan / Stock.TIMESTEP)
        if (history.length > GameManager.MAXVISUALIZABLEVALUES) history = Stock.reduceHistory(history)

        for (let i = 0; i < GameManager.MAXVISUALIZABLEVALUES; i++) {
            values.push({ x: (date * (1000 * 60 * 60 * 24)), y: history[i] })
            date += step
        }

        if (g.chartjs === undefined) {

            g.chartjs = new Chart(g, {
                type: "line",
                data: {
                    datasets: [{
                        label: s.name,
                        indexAxis: 'x',
                        borderWidth: 1,
                        radius: 0,
                        data: values
                    }]
                },
                options: {
                    animation: false,
                    parsing: false,
                    //responsive:false,
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    plugins: {
                        decimation: {
                            enabled: true,
                            samples: 10
                        },
                        legend: {
                            display: false,
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'yyyy-MM-dd'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Data',
                            },
                        },
                        y: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Kr',
                            },
                            /*min:0*/
                        }
                    },
                }
            })

        } else {

            g.chartjs.data.datasets[0].data = values
            g.chartjs.update()

        }

        // Variable to track stock value in order to calculate avg value before add another point to graph
        let lastUpdate = GameManager.currentNumberValue(), firstValueNotDisplayed = s.value, lastValueNotDisplayed = firstValueNotDisplayed, counter = 0

        if (g.idUpdatingFunction !== undefined) {

            clearInterval(g.idUpdatingFunction)

        }

        g.idUpdatingFunction = setInterval(() => {

            if (counter % timeSpan === 0) {

                if (lastUpdate !== GameManager.currentNumberValue() - 1) {

                    this.setGraph(sAcronym, timeSpan, id)

                } else {

                    values.push({ x: (date * (1000 * 60 * 60 * 24)), y: (firstValueNotDisplayed + lastValueNotDisplayed) / 2 })
                    values.shift()
                    date += step
                    firstValueNotDisplayed = s.value
                    g.chartjs.data.datasets[0].data = values
                    g.chartjs.update()
                    lastUpdate = GameManager.currentNumberValue()

                }

            }

            lastValueNotDisplayed = s.value
            counter++

        }, GameManager.VALUESPERREALSECONDS * 1000)

    },
    login: function () {

        let usrn = document.getElementById('usernameAccedi').value, pasw = document.getElementById('passwordAccedi').value

        let x = new XMLHttpRequest()

        x.onload = function () {
            try {
                let j = JSON.parse(x.responseText)
                if (j.error !== 0) throw alert("Server error: " + j.msg)
                else alert('Login successful')
                toSlide('saves')
            } catch (e) {
                console.log(e)
            }
        }
        x.onerror = function () {
            alert('Server error')
        }

        let data = 'username=' + usrn + '&password=' + pasw

        x.open('POST', 'api.php?op=login')
        x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        x.send(data)

    },
    register: function () {


        let usrn = document.getElementById('usernameRegister').value, email = document.getElementById('emailRegister').value, pasw = document.getElementById('passwordRegister').value

        if (pasw !== document.getElementById('confirmPassword').value) throw 'Passwords doesn\'t match'

        let x = new XMLHttpRequest()

        x.onload = function () {
            try {
                let j = JSON.parse(x.responseText)
                if (j.error === 1) throw alert("Server error: " + j.msg)
                else alert('Registered successfully')
                toSlide('saves')
            } catch (e) {
                console.log(e)
            }
        }
        x.onerror = function () {
            alert('Server error')
        }

        let data = 'username=' + usrn + '&email=' + email + '&password=' + pasw

        x.open('POST', 'api.php?op=register')
        x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        x.send(data)

    }
}

GameManager.YEARSHIFT = 150             // ~2175
GameManager.MAXYEARGAP = 5              // Maximum year gap that can be simulated by stock generation
GameManager.SECSPEEDUP = 60             // 1 real second = 1 game minute
GameManager.REALSTARTDATE = new Date('2025-01-20').getTime()            // Temporarily fixed start date
GameManager.STARTDATE = new Date(GameManager.REALSTARTDATE + 1000 * 24 * 60 * 60 * 365 * GameManager.YEARSHIFT).getTime()
GameManager.MAXSAVES = 3
GameManager.MAXVISUALIZABLEVALUES = 1 / Stock.TIMESTEP
GameManager.TIMESTEPPERREALDAY = (1 / Stock.TIMESTEP) * GameManager.SECSPEEDUP
GameManager.VALUESPERREALSECONDS = (((24 * 60 * 60) / GameManager.SECSPEEDUP) / GameManager.MAXVISUALIZABLEVALUES)

/**
 * Function that return game time as number representing the milliseconds passed since the game started
 * 
 * @returns Number representing the game's milliseconds passed since the game started
 */
GameManager.gameTimer = function () {
    return GameManager.STARTDATE + (new Date().getTime() - GameManager.REALSTARTDATE) * GameManager.SECSPEEDUP
}

/**
 * Function that return the number of value generated since game's started + 1
 * 
 * @returns Number representing the number of current value
 */
GameManager.currentNumberValue = function () {
    return GameManager.MAXYEARGAP * 365 / Stock.TIMESTEP + ~~(((GameManager.gameTimer() - GameManager.STARTDATE) / (24 * 60 * 60 * 1000)) / Stock.TIMESTEP)
}

/**
 * Player constructor
 * 
 * Player is a class that represent the player. It contains all player's data, such as wallet, honor grade, stocks owned, etc.
 * 
 * @param {String} name name of the player
 */
function Player(name) {

    this.name = name

    this.wallet = Player.startMoney

    this.honorGrade = '0'

    this.stocks = {}            // Both standard stocks and etfs, supposed to be stocks[stock acronym] = purchaseValue, amount

}

Player.prototype = {
    constructor: Player,
    /**
     * Make the player buy passed amount of the passed stock
     * 
     * @param {Stock} stock stock to buy
     * @param {Number} amountP amount of stock to buy
     */
    buy: function (stock, amountP) {

        if (!(stock instanceof Stock) && !(stock instanceof ETF)) throw 'Stock not defined'
        if (isNaN(Number(amountP) || amountP % 1 !== 0)) throw 'Amount not supported'

        let price = stock.value * amountP + stock.commPerOperation

        if (price > this.wallet) throw 'Player doesn\'t have enough money'

        this.wallet -= price

        let pv = stock.value, newAmount = amountP
        if (this.stocks[stock.acronym] !== undefined) {

            newAmount = this.stocks[stock.acronym].amount + amountP
            pv = ((this.stocks[stock.acronym].purchaseValue * this.stocks[stock.acronym].amount) + price) / newAmount

        }

        this.stocks[stock.acronym] = { purchaseValue: pv, amount: newAmount }

    },
    /**
     * Make the player go all in(buy as much as he can) with the passed stock
     * 
     * @param {Stock} stock stock to go all in
     */
    allIn: function (stock) {

        if (!(stock instanceof Stock) && !(stock instanceof ETF)) throw 'Stock not defined'

        let n = Math.floor(this.wallet / stock.value)
        if (stock.value * n + stock.commPerOperation > this.wallet) n--
        this.wallet -= stock.value * n + stock.commPerOperation

        let pv = stock.value, newAmount = n
        if (this.stocks[stock.acronym] !== undefined) {

            newAmount = this.stocks[stock.acronym].amount + n
            pv = ((this.stocks[stock.acronym].purchaseValue * this.stocks[stock.acronym].amount) + stock.value * n) / newAmount

        }

        this.stocks[stock.acronym] = { purchaseValue: pv, amount: newAmount }

    },
    /**
     * Make the player sell passed amount of the passed stock
     * 
     * @param {String} stockAcronym acronym of the stock(index of stock dictionary)
     * @param {Number} amountP amount to sell
     */
    sell: function (stockAcronym, amountP) {

        if (stockAcronym === undefined || isNaN(Number(amountP))) throw 'Parameters not supported'
        if (this.stocks[stockAcronym] === undefined) throw 'Player doesn\'t own passed stock'
        if (this.stocks[stockAcronym].amount < amountP) throw 'Player doesn\'t have such amount of passed stock'

        this.wallet += this.stocks[stockAcronym].purchaseValue * amountP - gm.getStock(stockAcronym).commPerOperation - gm.getStock(stockAcronym).getTaxesCost(amountP)

        this.stocks[stockAcronym].amount -= amountP
        if (this.stocks[stockAcronym].amount === 0) delete (this.stocks[stockAcronym])

    },
    /**
     * Make the player sell all of the passed stock
     * 
     * @param {String} stockAcronym acronym of the stock(index of stock dictionary)
     */
    sellAll: function (stockAcronym) {

        if (stockAcronym === undefined) throw 'Parameters not supported'
        if (this.stocks[stockAcronym] === undefined) throw 'Player doesn\'t own passed stock'

        this.wallet += this.stocks[stockAcronym].purchaseValue * this.stocks[stockAcronym].amount - gm.getStock(stockAcronym).commPerOperation - gm.getStock(stockAcronym).getTaxesCost(this.stocks[stockAcronym].amount)

        delete (this.stocks[stockAcronym])

    },
    /**
     * Function that calculate player's equity(wallet + value of each sum invested)
     * 
     * @returns 
     */
    getEquity: function () {

        let eq = this.wallet

        for (acr in this.stocks) {

            eq += gm.getStock(acr).value * this.stocks[acr].amount

        }

        return eq

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

Player.startMoney = 25

/**
 * Save contructor
 * 
 * Save is a class that represent the market for each save. It contains all stocks and ETFs that compose the market.
 * 
 * @param {Array} stocks dictionary that contains all save's stocks and ETFs
 * @param {Number} saveId id of the save
 */
function Save(stocks = undefined, saveId = undefined) {

    this.stocks = stocks

    this.saveId = saveId

}

Save.prototype = {
    constructor: Save,
    /**
     * Function that generates save seed, a string composed by all stocks's seeds(not ETFs's one) divided by '-'
     * 
     * @returns A string representing save seed
     */
    generateSaveSeed: function () {

        let s = ''

        for (k in this.stocks) {

            if (this.stocks[k].type === 'stock') s += this.stocks[k].seed + '-'

        }

        s = s.substring(0, s.length - 1)      // Remove last '-'

        return s

    }
}

/**
 * Function that send an XMLHTTPREQUEST to fetch from market.json all market stocks and etfs with their parameters,
 * except for seed, which is randomized to make each market different if seeds dictionary is not passed
 * It supposes that in market.json stocks that influence other stocks and/or compose an etf/s are written before those influenced stocks or etfs
 * 
 * @param {Array} seeds dictionary with index as stock acronym and the actual seed:  seeds['CFA'] = 219866
 * @returns a promise that resolve with a Save object
 */
Save.loadMarket = function (seeds = undefined) {

    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()
        xhr.onload = function () {
            try {

                let data = JSON.parse(xhr.responseText)

                let stocks = {}

                stocks[masterStock.acronym] = masterStock           // To be removed

                for (id in data) {

                    let s = data[id], tempInfl, tempSeed

                    if (s.type === 'stock') {

                        tempInfl = []

                        s.influencedBy.forEach((stockId) => tempInfl.push(stocks[stockId]))

                        if (seeds !== undefined && seeds[id] !== undefined) tempSeed = seeds[id]
                        else tempSeed = /* Temporarily fixed seed */ 648157

                        // Stock{name, acronym, description, base value, stability, growth, volatility, seed, influenceability, dividends percentage, days dividends frequency, commission per operation, earning tax}
                        // params[base value, stability, growth, volatility, influenceability]
                        stocks[id] = new Stock(s.name, id, s.description, s.params[0], s.params[1], s.params[2], s.params[3], tempSeed, s.params[4], s.dividendsPercentage, s.daysDividendsFrequency, s.commissionPerOperation, s.earningTax)

                        tempInfl.forEach(e => {
                            stocks[id].influencedBy.push(e)
                        })

                    } else if (s.type === 'ETF') {

                        tempInfl = []

                        for (id2 in s.composition) tempInfl.push({ stock: stocks[id2], perc: s.composition[id2] })

                        stocks[id] = new ETF(s.name, id, s.description, tempInfl, s.commissionPerOperation, s.earningTax)

                    } else throw 'Unkown type: ' + s.type

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

/**
 * mulberry32 seeded random number generator
 * 
 * @param {Number} a seed
 * @returns random seed based number
 */
function mulberry32(a) {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}

/**
 * Generate a random number with standard normal distribution
 * 
 * @param {Number} seed seed
 * @returns random number
 */
function normalDistributedNumber(seed = null) {
    let n = mulberry32(seed)
    while (n == 0) n = mulberry32(seed * Math.random() * 10000)
    return Math.sqrt(-2.0 * Math.log(n)) * Math.cos(2.0 * Math.PI * n)
}

/**
 * Function that, given an array, remove duplicates in it
 * 
 * @param {Array} arr 
 * @returns array withour duplicates
 */
function removeDuplicatesFromArray(arr) {
    if (arr === undefined || arr === null) return null
    let cleanedArr = []
    arr.forEach((e) => {
        if (!cleanedArr.includes(e)) cleanedArr.push(e)
    })
    return cleanedArr
}


//      Fundamental entities of the game

// Hidden stock. Every other stock is influenced by it
const masterStock = new Stock('master stock', 'master stock', 'master stock', 100, 0.2, 0.5, 1, 123456, 0, 0.5, 0, 0.5, 0)

let gm = new GameManager('test')
gm.initializeSave(0)