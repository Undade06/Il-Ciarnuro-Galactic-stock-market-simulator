//-- Load/Save game

// Function to create a new game
function newGame(name, credit) {
    const player = new Player(); // Create a new player instance
    player.setInizialWallet(); // Set the initial wallet to 25000
    console.log(player.name);  // Display the player's name (from the HTML input)
    console.log(player.wallet);  // Display the player's wallet (should be 25000)
    console.log(player.getRank());  // Display the player's rank based on their wallet
}

// Function to load a saved game (to be implemented)
function loadGame() {
    // Loading game logic (not yet implemented)
}

// Function to save the game (to be implemented)
function saveGame() {
    // Saving game logic (not yet implemented)
}

// Player constructor and its methods
// Constructor for creating a new player
function Player() {
    this.name = document.querySelectorAll('.register_input')[0].value; // Get the player's name from the HTML input
    this.wallet = 0;  // Set initial wallet to 0 (will be updated later)
    this.honorGrade = "0";  // Set the initial honor grade to "0"
    this.stocks = [];  // Initialize an empty array for the player's stocks
}

// Method to set the player's initial wallet value
Player.prototype.setInizialWallet = function() {
    this.wallet = 25000; // Set the wallet to 25000
};

// Method to get the current value of the player's wallet
Player.prototype.getWallet = function() {
    return this.wallet; // Return the current wallet value
};

// Method to get the player's rank based on the wallet's value
Player.prototype.getRank = function() {
    let e = this.getWallet(); 
    if (e <= 0) return -1; 
    else if (e < 100) return 0; 
    else if (e < 300) return 1; 
    else if (e < 700) return 2; 
    else if (e < 1500) return 3; 
    else if (e < 5000) return 4;
    else if (e < 15000) return 5;
    else if (e < 50000) return 6;
    else if (e < 100000) return 7;
    else if (e < 1000000) return 8;
    else if (e < 10000000) return 9; 
    else return 10;
};
