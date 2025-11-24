var gridX = 10;
var gridY = 10;
var mines = {};
var gameOver = true;
var gameWon = false;

// number of mines to place (fixed count)
var mineCount = 10;

const field = document.getElementById("field");

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let value = params.theme;
console.log("Theme param:", value);
if (value === "classic" || value === "bruce") {
    document.getElementById("theme").value = value;
    document.getElementById("theme").dispatchEvent(new Event('change'));
    //apply theme
    if (value === "classic") {
        document.documentElement.style.setProperty('--sprite', "url('sprite.png')");
        document.title = "Minesweeper";
    } else if (value === "bruce") {
        document.documentElement.style.setProperty('--sprite', "url('brucesweeper.png')");
        document.title = "Brucesweeper";
    }
    
}


function startGame() {
    gameOver = false;
    gameWon = false;
    setSmiley('normal');
    new Audio('sounds/start.wav').play();
    field.innerHTML = "";
    field.style.gridTemplateRows = `repeat(${gridY}, calc(16px * var(--scale)))`;
    field.style.gridTemplateColumns = `repeat(${gridX}, calc(16px * var(--scale)))`;
    mines = {};
    // create grid buttons first
    for (var i = 0; i < gridY; i++) {
        for (var j = 0; j < gridX; j++) {
            var button = document.createElement("button");
            button.id = "mine_" + i + "_" + j;
            button.className = "mine";
            field.appendChild(button);
        }
    }

    // place an exact number of mines randomly
    var totalCells = gridX * gridY;
    // ensure at least one non-mine cell remains
    var placeCount = Math.max(0, Math.min(mineCount, totalCells - 1));
    var placed = 0;
    while (placed < placeCount) {
        var idx = Math.floor(Math.random() * totalCells);
        var rx = Math.floor(idx / gridX);
        var ry = idx % gridX;
        var id = "mine_" + rx + "_" + ry;
        if (!mines[id]) {
            mines[id] = true;
            placed++;
        }
    }
    updateFlagsDisplay();
    startTimer();
    console.log(mines)
};

function startTimer(){
    var timerDisplay = document.getElementById("timerDisplay");
    if (!timerDisplay) return;
    var seconds = 0;
    var digits = seconds.toString().padStart(3, '0');
    timerDisplay.innerHTML = "";
    for (var i = 0; i < digits.length; i++) {
        var digit = digits.charAt(i);
        var digitDiv = document.createElement("div");
        digitDiv.className = "number" + digit;
        timerDisplay.appendChild(digitDiv);
    }
    if (window.timerInterval) clearInterval(window.timerInterval);
    window.timerInterval = setInterval(function(){
        seconds++;
        var digits = seconds.toString().padStart(3, '0');
        timerDisplay.innerHTML = "";
        for (var i = 0; i < digits.length; i++) {
            var digit = digits.charAt(i);
            var digitDiv = document.createElement("div");
            digitDiv.className = "number" + digit;
            timerDisplay.appendChild(digitDiv);
        }
    }, 1000);
}
function stopTimer(){
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
        window.timerInterval = null;
    }
}

// reveal all connected empty areas and their bordering numbers
function revealArea(startX, startY) {
    var startId = "mine_" + startX + "_" + startY;
    var startBtn = document.getElementById(startId);
    if (!startBtn || startBtn.disabled || startBtn.className.includes("flagged")) return;

    var visited = {};
    var queue = [{ x: startX, y: startY }];
    visited[startId] = true;

    while (queue.length) {
        var cur = queue.shift();
        var bx = cur.x;
        var by = cur.y;
        var id = "mine_" + bx + "_" + by;
        var btn = document.getElementById(id);
        if (!btn || btn.disabled) continue;

        // count neighboring mines
        var mineCount = 0;
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                var checkId = "mine_" + (bx + i) + "_" + (by + j);
                if (mines[checkId]) mineCount++;
            }
        }

        // reveal this button
        if (mineCount > 0) {
            btn.className += " number" + mineCount;
            btn.disabled = true;
            // do not expand from numbered cells
        } else {
            btn.className += " empty";
            btn.disabled = true;
            // expand neighbors
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    var nx = bx + i;
                    var ny = by + j;
                    var nid = "mine_" + nx + "_" + ny;
                    if (visited[nid]) continue;
                    var nbtn = document.getElementById(nid);
                    if (nbtn && !nbtn.disabled && !nbtn.className.includes("flagged")) {
                        visited[nid] = true;
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }
    }
}


document.getElementById("startBtn").addEventListener("click", function () {
    startGame();
});

document.getElementById("scale").addEventListener("input", function (e) {
    var scale = parseFloat(e.target.value);
    //edit --scale in :root
    document.documentElement.style.setProperty('--scale', scale);
});
document.getElementById("imageRendering").addEventListener("change", function (e) {
    var smooth = e.target.checked;
    if (smooth) {
        document.documentElement.style.setProperty('--image-rendering', 'smooth');
    } else {
        document.documentElement.style.setProperty('--image-rendering', 'pixelated');
    }
});
document.getElementById("cursorEvents").addEventListener("change", function (e) {
    var pointer = e.target.checked;
    if (pointer) {
        document.documentElement.style.setProperty('--cursor', 'pointer');
    } else {
        document.documentElement.style.setProperty('--cursor', 'default');
    }
});

// mine count input
var mineCountInput = document.getElementById("mineCount");
if (mineCountInput) {
    mineCountInput.addEventListener("input", function (e) {
        var v = parseInt(e.target.value);
        if (!isNaN(v)) mineCount = v;
    });
}
document.getElementById("width").addEventListener("input", function (e) {
    gridX = parseInt(e.target.value);
});
document.getElementById("height").addEventListener("input", function (e) {
    gridY = parseInt(e.target.value);
});
//select element
document.getElementById("theme").addEventListener("change", function () {
    if (this.value === "classic") {
        document.documentElement.style.setProperty('--sprite', "url('sprite.png')");
        document.title = "Minesweeper";
    } else if (this.value === "bruce") {
        document.documentElement.style.setProperty('--sprite', "url('brucesweeper.png')");
        document.title = "Brucesweeper";
    }

});

// Smiley control helper
function setSmiley(state) {
    var smiley = document.getElementById('smiley');
    if (!smiley) return;
    smiley.classList.remove('shocked', 'sunglasses', 'dead');
    if (state === 'shocked') {
        smiley.classList.add('shocked');
    } else if (state === 'sunglasses') {
        smiley.classList.add('sunglasses');
    } else if (state === 'dead') {
        smiley.classList.add('dead');
    } else {
        // normal: no extra class
    }
}

// clicking the smiley restarts the game
var smileyEl = document.getElementById('smiley');
if (smileyEl) {
    // pointer interactions: show pressed state while held
    smileyEl.addEventListener('pointerdown', function (e) {
        // only handle primary button
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        smileyEl.classList.add('pressed');
    });
    smileyEl.addEventListener('pointerup', function (e) {
        smileyEl.classList.remove('pressed');
    });
    smileyEl.addEventListener('pointercancel', function () {
        smileyEl.classList.remove('pressed');
    });
    // click activates restart
    smileyEl.addEventListener('click', function () {
        startGame();
    });
    // allow keyboard activation with visual pressed state
    smileyEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            smileyEl.classList.add('pressed');
        }
    });
    smileyEl.addEventListener('keyup', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            smileyEl.classList.remove('pressed');
            startGame();
        }
    });
}

// show shocked while pressing a cell; restore on release
document.addEventListener('pointerdown', function (e) {
    if (e.target && e.target.className && typeof e.target.className === 'string' && e.target.className.startsWith('mine')) {
        if (!gameOver && !e.target.className.includes('flagged')) {
            setSmiley('shocked');
        }
    }
});
document.addEventListener('pointerup', function () {
    if (gameOver) {
        if (gameWon) setSmiley('sunglasses');
        else setSmiley('dead');
    } else {
        setSmiley('normal');
    }
});
//when button pressed
field.addEventListener("click", function (e) {
    if (e.target && e.target.className.startsWith("mine") && !e.target.className.includes("flagged")) {
        if (e.isTrusted && !mines[e.target.id]) {
            var audio = new Audio('sounds/click.wav');
            audio.play();
        }
        if (mines[e.target.id]) {
            stopTimer();
            gameOver = true;
            gameWon = false;
            setSmiley('dead');
            var audio = new Audio('sounds/lose_minesweeper.wav');
            audio.play();
            e.target.className += " hit";
            //disable all buttons
            var allButtons = document.getElementsByClassName("mine");
            for (var i = 0; i < allButtons.length; i++) {
                allButtons[i].disabled = true;
            }
            for (var key in mines) {
                var mineButton = document.getElementById(key);
                if (mineButton && !mineButton.className.includes("flagged") && key !== e.target.id) {
                    mineButton.className += " revealed";
                }
            }
            //every false flagged button
            var allButtons = document.getElementsByClassName("mine");
            for (var i = 0; i < allButtons.length; i++) {
                var btn = allButtons[i];
                if (!mines[btn.id] && btn.className.includes("flagged")) {
                    btn.className += " falseflag";
                }
            }

        } else {
            // reveal using BFS flood-fill to make sure all contiguous empty
            // areas and their border numbers get revealed.
            var coords = e.target.id.split("_");
            var x = parseInt(coords[1]);
            var y = parseInt(coords[2]);
            revealArea(x, y);
        }
    }
    // win condition; check if every empty slot is revealed
    var allButtons = document.getElementsByClassName("mine");
    var allRevealed = true;
    for (var i = 0; i < allButtons.length; i++) {
        var btn = allButtons[i];
        if (!mines[btn.id]) {
            if (!btn.className.includes("empty") && !/number\d/.test(btn.className)) {
                allRevealed = false;
                break;
            }
        }
    }
    if (allRevealed) {
        var allButtons = document.getElementsByClassName("mine");
        for (var i = 0; i < allButtons.length; i++) {
            allButtons[i].disabled = true;
        }
        //flag all unflagged mines
        for (var key in mines) {
            var mineButton = document.getElementById(key);
            if (mineButton && !mineButton.className.includes("flagged")) {
                mineButton.className += " flagged";
            }
        }
        updateFlagsDisplay();
        stopTimer();
        gameOver = true;
        gameWon = true;
        setSmiley('sunglasses');
        setTimeout(function () {
            audio = new Audio('sounds/win.wav');
            audio.play();
        }, 0);
    }

});
// right click to flag
field.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    if (e.target && e.target.className.includes("mine")) {
        if (e.target.className.includes("flagged")) {
            e.target.className = e.target.className.replace(" flagged", "");
        } else {
            e.target.className += " flagged";
        }
        if(!gameOver){
            updateFlagsDisplay();
        }
    }
});

function updateFlagsDisplay() {
    var flagsDisplay = document.getElementById("flagsDisplay");
    if (!flagsDisplay) return;
    //count flags
    var allButtons = document.getElementsByClassName("mine");
    var flagCount = 0;
    for (var i = 0; i < allButtons.length; i++) {
        var btn = allButtons[i];
        if (btn.className.includes("flagged")) {
            flagCount++;
        }
    }
    var parseCount = toString(mineCount - flagCount);
    //for each digit, create a div with class numberX
    flagsDisplay.innerHTML = "";
    var digits = (mineCount - flagCount).toString().padStart(3, '0');
    for (var i = 0; i < digits.length; i++) {
        if (digits.charAt(i) === '-') {
            var minusDiv = document.createElement("div");
            minusDiv.className = "numberNegative";
            flagsDisplay.appendChild(minusDiv);
            continue;
        }
        var digit = digits.charAt(i);
        var digitDiv = document.createElement("div");
        digitDiv.className = "number" + digit;
        flagsDisplay.appendChild(digitDiv);
    }

}

startGame();