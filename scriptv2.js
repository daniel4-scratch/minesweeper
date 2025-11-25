const field = document.getElementById("field");

// field properties
const update = document.getElementById("startBtn");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const mineCount = document.getElementById("mineCount");
const smiley = document.getElementById("smiley");

// display properties
const scaleInput = document.getElementById("scale");
const smoothRendering = document.getElementById("imageRendering");
const pointerCursor = document.getElementById("cursorEvents");
const themeSelect = document.getElementById("theme");

var gridX = 0;
var gridY = 0;

var mines = {};
var gameStarted = false;
var gameOver = false;

var audios = {
    click: new Audio('sounds/click.wav'),
    explode: new Audio('sounds/lose_minesweeper.wav'),
    win: new Audio('sounds/win.wav'),
    start: new Audio('sounds/start.wav')
}

var timer = null;


//generate tiles
function generateField() {
    if (timer) {
        stopTimer(timer);
    }
    timer = null;
    gameStarted = false;
    gameOver = false;
    smiley.className = "smiley";
    mines = {};
    gridX = parseInt(widthInput.value);
    gridY = parseInt(heightInput.value);
    field.innerHTML = "";
    field.style.gridTemplateColumns = `repeat(${gridX}, calc(16px * var(--scale)))`;
    field.style.gridTemplateRows = `repeat(${gridY}, calc(16px * var(--scale)))`;
    for (let i = 0; i < gridX * gridY; i++) {
        const button = document.createElement("button");
        button.className = "mine";
        button.id = `tile-${i}`;
        button.addEventListener("click", function () {
            if (!gameStarted) {
                const x = i % gridX;
                const y = Math.floor(i / gridX);
                startGame(x, y);
            }
        });
        field.appendChild(button);
    }
    updateDisplay("flagsDisplay", parseInt(mineCount.value));
    updateDisplay("timerDisplay", 0);
}

update.addEventListener("click", generateField);
smiley.addEventListener("click", generateField);

//startgame x,y inintal position to prevent first click mine
function startGame(x, y) {
    //genenerate mines blank space at x,y
    gameStarted = true;
    var mineCountValue = parseInt(mineCount.value);
    mines = {};
    while (Object.keys(mines).length < mineCountValue) {
        let mx = Math.floor(Math.random() * gridX);
        let my = Math.floor(Math.random() * gridY);
        // prevent mines in the initial 3x3 area (including the clicked tile)
        if (Math.abs(mx - x) <= 1 && Math.abs(my - y) <= 1) {
            continue;
        }
        // avoid duplicate mine positions
        if (mines[`${mx},${my}`]) {
            continue;
        }
        mines[`${mx},${my}`] = true;
    }
    console.log(mines);
    audios.start.play();
    timer = startTimer();

}


field.addEventListener("click", function (e) {
    if (gameOver) return;
    if (e.target.className === "mine") {
        const id = e.target.id;
        const index = parseInt(id.split("-")[1]);
        const x = index % gridX;
        const y = Math.floor(index / gridX);
        clickTile(x, y);
    }
});
field.addEventListener("mousedown", function (e) {
    if (gameOver) return;
    if (gameStarted){
        smiley.className = "smiley shocked";
    }
}
);
field.addEventListener("mouseup", function (e) {
    if (gameOver) return;
    if (gameStarted){
        smiley.className = "smiley";
    }
});

field.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    if (gameOver || !gameStarted) return;
    if (e.target.className === "mine") {
        if (e.target.classList.contains("flagged")) {
            e.target.classList.remove("flagged");
        } else {
            e.target.classList.add("flagged");
        }
    }else if(e.target.classList.contains("flagged")){
        e.target.classList.remove("flagged");
    }
    updateDisplay("flagsDisplay", Object.keys(mines).length - document.querySelectorAll(".flagged").length);
});

function clickTile(x,y) {
    if (gameOver) return;
    //when tile clicked
    //if blank reveal adjacent tiles
    //if mine game over
    //reval number
    //if hit
    if (mines[`${x},${y}`]) {
        gameOver = true;
        smiley.className = "smiley dead";
        stopTimer(timer);
        audios.explode.play();
        for (const key in mines) {
            const [mx, my] = key.split(",").map(Number);
            const index = my * parseInt(widthInput.value) + mx;
            const mineTile = document.getElementById(`tile-${index}`);
            //if the mine that was clicked
            if (mx === x && my === y) {
                mineTile.className = "mine hit";
            } else {
                mineTile.className = "mine revealed";
            }
        }
        return;
    }else{
        revealArea(x, y);
    }
    //check win condition: make sure all non-mine tiles are revealed
    let revealedCount = 0;
    for (let i = 0; i < gridX * gridY; i++) {
        const tile = document.getElementById(`tile-${i}`);
        if (!tile) continue;
        const cls = tile.className;
        // Only count tiles that have been revealed: "empty" or "numberN".
        // Don't count flagged or unrevealed "mine" tiles.
        if (cls.includes('empty') || cls.includes('number')) {
            revealedCount++;
        }
    }
    if(revealedCount === gridX * gridY - Object.keys(mines).length){
        gameOver = true;
        smiley.className = "smiley win";
        audios.win.play();
        stopTimer(timer);
        //flag all mines
        for (const key in mines) {
            const [mx, my] = key.split(",").map(Number);
            const index = my * parseInt(widthInput.value) + mx;
            const mineTile = document.getElementById(`tile-${index}`);
            mineTile.className = "mine flagged";
        }
    }
    audios.click.play();
}

function revealArea(x, y){
    const index = y * gridX + x;
    const tile = document.getElementById(`tile-${index}`);
    if(tile.className !== "mine"){
        return; //already revealed
    }
    //count adjacent mines
    let mineCount = 0;
    for(let dx = -1; dx <= 1; dx++){
        for(let dy = -1; dy <= 1; dy++){
            if(dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if(nx >= 0 && nx < gridX && ny >= 0 && ny < gridY){
                if(mines[`${nx},${ny}`]){
                    mineCount++;
                }
            }
        }
    }
    tile.className = "mine empty";
    if(mineCount > 0){
        tile.className = `mine number${mineCount}`;
    }else{
        //reveal adjacent tiles
        for(let dx = -1; dx <= 1; dx++){
            for(let dy = -1; dy <= 1; dy++){
                if(dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if(nx >= 0 && nx < gridX && ny >= 0 && ny < gridY){
                    revealArea(nx, ny);
                }
            }
        }
    }
}

function updateDisplay(id, int){
    const display = document.getElementById(id);
    var digits = int.toString().padStart(3, '0');
    display.innerHTML = "";
    for (var i = 0; i < digits.length; i++) {
        var digit = digits.charAt(i);
        var digitDiv = document.createElement("div");
        digitDiv.className = "number" + digit;
        display.appendChild(digitDiv);
    }
}

function startTimer(){
    let seconds = 0;
    return setInterval(function(){
        if(gameOver || !gameStarted){
            clearInterval(this);
            return;
        }
        seconds++;
        updateDisplay("timerDisplay", seconds);
    }, 1000);
}

function stopTimer(interval){
    clearInterval(interval);
}

generateField();

//display listeners
scaleInput.addEventListener("input", function (e) {
    const scale = parseFloat(e.target.value);
    document.documentElement.style.setProperty('--scale', scale);
});

smoothRendering.addEventListener("change", function () {
    if (this.checked) {
        document.documentElement.style.setProperty('--image-rendering', 'smooth');
    } else {
        document.documentElement.style.setProperty('--image-rendering', 'pixelated');
    }
});
pointerCursor.addEventListener("change", function () {
    if (this.checked) {
        document.documentElement.style.setProperty('--cursor', 'pointer');
    } else {
        document.documentElement.style.setProperty('--cursor', 'default');
    }
});
themeSelect.addEventListener("change", function () {
    console.log(this.value);
    if (this.value === "classic") {
        document.documentElement.style.setProperty('--sprite', "url('sprite.png')");
    } else if (this.value === "bruce") {
        document.documentElement.style.setProperty('--sprite', "url('brucesweeper.png')");
    }
});

// page query ?theme=bruce
const urlParams = new URLSearchParams(window.location.search);
const themeParam = urlParams.get('theme');
if (themeParam) {
    themeSelect.value = themeParam;
    if (themeParam === "classic") {
        document.documentElement.style.setProperty('--sprite', "url('sprite.png')");
    } else if (themeParam === "bruce") {
        document.documentElement.style.setProperty('--sprite', "url('brucesweeper.png')");
    }
}