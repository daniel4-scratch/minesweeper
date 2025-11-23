var gridX = 10;
var gridY = 10;
var mines = {};

var minePercent = 0.15;

const field = document.getElementById("field");

function startGame() {
    new Audio('sounds/start.wav').play();
    field.innerHTML = "";
    mines = {};
    for (var i = 0; i < gridY; i++) {
        for (var j = 0; j < gridX; j++) {
            var button = document.createElement("button");
            button.id = "mine_" + i + "_" + j;
            button.className = "mine";
            if (Math.random() < minePercent) {
                mines[button.id] = true;
            }
            field.appendChild(button);
        }
    }
    console.log(mines)
};


document.getElementById("startBtn").addEventListener("click", function () {
    startGame();
});

document.getElementById("scale").addEventListener("input", function (e) {
    var scale = parseFloat(e.target.value);
    document.getElementById("field").style.setProperty('--scale', scale);
});

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
            //reveal logic
            e.target.disabled = true;
            e.target.className += " empty";

            var coords = e.target.id.split("_");
            var x = parseInt(coords[1]);
            var y = parseInt(coords[2]);

            var mineCount = 0;
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    if (i == 0 && j == 0) continue;
                    var checkId = "mine_" + (x + i) + "_" + (y + j);
                    if (mines[checkId]) {
                        mineCount++;
                    }
                }
            }
            if (mineCount > 0) {
                e.target.className += " number" + mineCount;
            } else {
                //reveal surrounding buttons
                for (var i = -1; i <= 1; i++) {
                    for (var j = -1; j <= 1; j++) {
                        if (i == 0 && j == 0) continue;
                        var checkId = "mine_" + (x + i) + "_" + (y + j);
                        var checkButton = document.getElementById(checkId);
                        if (checkButton && !checkButton.disabled) {
                            checkButton.click();
                        }
                    }
                }
            }

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
