
/*---SLIDES SYSTEM---*/
function toSlide(id){
    document.querySelectorAll("div.slide").forEach(function(e){
        e.classList.add("hidden")
        e.classList.remove("visible")
        e.querySelectorAll("*").forEach(function(e2){
            e2.tabIndex="-1"
        })
    })
    let d=document.getElementById(id)
    d.classList.add("visible")
    d.classList.remove("hidden")
    d.querySelectorAll("*").forEach(function(e2){
        e2.tabIndex="-1"
    })
}


function getCurrentSlide(){
    let s=document.getElementsByClassName("slide visible");
    if(s.length===0) return null; else return s[0];
}

function Stock(name,description,baseValue,variability,volatility,noisiness,influenceability){
    this.name=name
    this.description=description
    this.type="stock"
    this._baseValue=baseValue
    this._variability=variability
    this._volatility=volatility
    this._noisiness=noisiness
    this._influenceability=influenceability
    this._baseF=volatility/100
    this._influenceability=influenceability
}

Stock.prototype={
    constructor:Stock,
    getValue:function(t){
        
    }
}