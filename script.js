var gridX = 10;
var gridY = 10;
var mines = {};

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
    console.log(mines)
};

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

// Export current game state to a JSON file
function exportGame() {
    var data = {
        gridX: gridX,
        gridY: gridY,
        mineCount: mineCount,
        mines: Object.keys(mines),
        cells: []
    };
    var allButtons = document.getElementsByClassName("mine");
    for (var i = 0; i < allButtons.length; i++) {
        var btn = allButtons[i];
        // Save only the extra classes besides the base 'mine'
        var extras = btn.className.replace(/^mine/, '').trim();
        data.cells.push({ id: btn.id, classes: extras, disabled: !!btn.disabled });
    }
    var json = JSON.stringify(data);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'minesweeper_save.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import a game object (or JSON string) and apply it to the board
function importGameFromObject(data) {
    try {
        if (typeof data === 'string') data = JSON.parse(data);
    } catch (err) {
        alert('Failed to parse save data');
        return;
    }
    // Apply grid settings if present
    gridX = (typeof data.gridX === 'number') ? data.gridX : gridX;
    gridY = (typeof data.gridY === 'number') ? data.gridY : gridY;
    mineCount = (typeof data.mineCount === 'number') ? data.mineCount : mineCount;

    // Recreate board to match dimensions
    startGame();

    // Overwrite mines mapping with saved mines
    mines = {};
    if (Array.isArray(data.mines)) {
        data.mines.forEach(function (id) { mines[id] = true; });
    }

    // Apply saved cell states
    if (Array.isArray(data.cells)) {
        data.cells.forEach(function (c) {
            var btn = document.getElementById(c.id);
            if (!btn) return;
            var extras = c.classes || '';
            btn.className = 'mine' + (extras ? ' ' + extras : '');
            btn.disabled = !!c.disabled;
        });
    }
}

// Wire export/import UI elements
var exportBtn = document.getElementById('exportBtn');
var importBtn = document.getElementById('importBtn');
var importFile = document.getElementById('importFile');
if (exportBtn) exportBtn.addEventListener('click', function () { exportGame(); });
if (importBtn) importBtn.addEventListener('click', function () { if (importFile) importFile.click(); });
if (importFile) {
    importFile.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            try {
                importGameFromObject(JSON.parse(reader.result));
            } catch (err) {
                alert('Invalid save file');
            }
            // Clear the input so same file can be reselected later
            importFile.value = '';
        };
        reader.readAsText(file);
    });
}
//when button pressed
field.addEventListener("click", function (e) {
    if (e.target && e.target.className.startsWith("mine") && !e.target.className.includes("flagged")) {
        if (e.isTrusted && !mines[e.target.id]) {
            var audio = new Audio('sounds/click.wav');
            audio.play();
        }
        if (mines[e.target.id]) {
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

        setTimeout(function () {
            audio = new Audio('sounds/win.wav');
            audio.play();
        }, 0);
    }

});
// right click to flag
field.addEventListener("contextmenu", function (e) {
    if (e.target && e.target.className.startsWith("mine")) {
        e.preventDefault();
        if (e.target.className.includes("flagged")) {
            e.target.className = e.target.className.replace(" flagged", "");
        } else {
            e.target.className += " flagged";
        }
    }
});
