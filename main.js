import { Cell, Group } from "./Cell.js";

let difficulty =
  document.querySelector('meta[name="sudoku-difficulty"]')?.content || "easy";
let maxMistakes = 3;

let noteMode = false;
let startTime;
let timeInterval;
let solution;

Cell.difficulty = difficulty;

function createSudoku() {
  const rows = Array(9)
    .fill(1)
    .map((n) => []);
  let offset = 0;
  for (let y = 0; y < 9; ++y) {
    offset += 3;
    if (y % 3 === 0) offset += 1;
    for (let x = 0; x < 9; ++x) {
      let value = (x + offset) % 9;
      rows[y][x] = value + 1;
    }
  }

  function shuffleRows(rows) {
    const groupID = ~~(Math.random() * 3);
    let shuffle1ID = ~~(Math.random() * 3);
    let shuffle2ID = ~~(Math.random() * 3);
    while (shuffle1ID === shuffle2ID) {
      shuffle2ID = ~~(Math.random() * 3);
    }

    shuffle1ID += groupID * 3;
    shuffle2ID += groupID * 3;
    [rows[shuffle1ID], rows[shuffle2ID]] = [rows[shuffle2ID], rows[shuffle1ID]];
  }

  function shuffleColumns(rows) {
    const groupID = ~~(Math.random() * 3);
    let shuffle1ID = ~~(Math.random() * 3);
    let shuffle2ID = ~~(Math.random() * 3);
    while (shuffle1ID === shuffle2ID) {
      shuffle2ID = ~~(Math.random() * 3);
    }

    shuffle1ID += groupID * 3;
    shuffle2ID += groupID * 3;

    for (let i = 0; i < 9; ++i) {
      const temp = rows[i][shuffle1ID];
      rows[i][shuffle1ID] = rows[i][shuffle2ID];
      rows[i][shuffle2ID] = temp;
    }
  }

  for (let i = 0; i < 300; ++i) {
    shuffleColumns(rows);
    shuffleRows(rows);
  }

  return rows;
}
function createCells() {
  const cells = [];
  const groups = { rows: [], columns: [], local: [] };
  const values = createSudoku();
  solution = values;
  Cell.solution = values;
  for (let x = 0; x < 9; ++x) {
    if (!groups.columns[x]) groups.columns[x] = new Group();

    for (let y = 0; y < 9; ++y) {
      if (!groups.rows[y]) groups.rows[y] = new Group();

      const localID = ~~(x / 3) + "-" + ~~(y / 3);

      if (!groups.local[localID]) groups.local[localID] = new Group();

      if (!groups.columns[x]) groups.columns[x] = new Group();

      const cell = new Cell(x, y, values[x][y]);
      cell.addToGroup(groups.rows[y]);
      cell.addToGroup(groups.columns[x]);
      cell.addToGroup(groups.local[localID]);
      cells.push(cell);

      if (x % 3 === 2 && x !== 8) cell._node.classList.add("vertical-line");

      if (y % 3 === 2 && y !== 8) cell._node.classList.add("horizontal-line");
    }
  }

  console.log(cells);
  return { groups: groups, values: values };
}
let currentGroups;
function init() {
  let i = 0;
  document.querySelectorAll("#keyboard-keys .button").forEach((elem) => {
    i = (i + 1) % 10;

    let id = i;
    console.log(id);
    elem.addEventListener("click", () => {
      if (!Cell._selected || gameWon) return;

      if (noteMode && id !== 0) Cell._selected.addNote(id);
      else Cell._selected.enterNumber(id);

      numberEntered();
      checkForWin();
      checkForLose();
    });
  });

  window.addEventListener("keydown", (e) => {
    if (gameWon) return;

    if (Cell._selected && "123456789".includes(e.key)) {
      if (!noteMode) Cell._selected.enterNumber(+e.key);
      else Cell._selected.addNote(+e.key);
    }

    if (Cell._selected && (e.key === "Backspace" || e.key === "Delete"))
      Cell._selected.enterNumber(0);

    numberEntered();
    checkForWin();
    checkForLose();
  });

  document
    .getElementById("difficulty-select")
    .addEventListener("change", (e) => {
      const dif = e.target.value;
      if (dif === difficulty) return;

      location = document.getElementById("url-" + dif).href;
    });

  document
    .getElementById("mode-button-normal")
    .addEventListener("click", () => toggleNotes(false));
  document
    .getElementById("mode-button-note")
    .addEventListener("click", () => toggleNotes(true));
  document
    .getElementById("play-again-button")
    .addEventListener("click", () => resetGame());
  resetGame();
  console.log(currentGroups);
  document
    .querySelector(`#difficulty-select option[value="${difficulty}"]`)
    .setAttribute("selected", "selected");
  document.getElementById("url-" + difficulty).classList.add("selected");
}

function numberEntered() {
  const correctCells = Array(10).fill(0);
  console.log(correctCells);

  Cell._instances.forEach((cell) => {
    if (cell.value !== 0 && !cell.incorrect) correctCells[cell.value]++;
  });

  console.log(correctCells);

  const buttons = document.querySelectorAll("#keyboard-keys .button");
  for (let i = 1; i <= 9; ++i) {
    if (correctCells[i] === 9) buttons[i - 1].className = "button disabled";
    else buttons[i - 1].className = "button";
  }
}

function resetGame() {
  Cell.reset();
  Cell.maxMistakes = maxMistakes;
  document.getElementById("popup").style.display = "none";
  document.getElementById("sudoku-board").innerHTML = "";
  startTime = Date.now();
  timeInterval = setInterval(() => timeTick(), 1000);
  currentGroups = createCells().groups;
  numberEntered();
  document.getElementById("time-elapsed").innerText = secondsToTimeString(0);
  gameWon = false;
}
function timeTick() {
  const elapsed = ~~((Date.now() - startTime) / 1000);
  document.getElementById("time-elapsed").innerText =
    secondsToTimeString(elapsed);
}
let gameWon = false;
function checkForWin() {
  let win = true;

  [
    ...currentGroups.rows,
    ...currentGroups.columns,
    ...currentGroups.local,
  ].forEach((group) => {
    let numbers = [];
    group.forEachCell((cell) => {
      if (cell.value === 0 || numbers.includes(cell.value)) win = false;

      numbers.push(cell.value);
    });
  });

  console.log("Win: " + win);
  if (win) winGame();
  return win;
}

function checkForLose() {
  console.log(Cell._mistakes);
  if (Cell._mistakes >= maxMistakes) winGame(false);
}

function winGame(win = true) {
  if (gameWon) return;

  gameWon = true;
  if (timeInterval) clearInterval(timeInterval);

  const timeElapsed2 = ~~((Date.now() - startTime) / 1000);

  setTimeout(() => {
    if (win) {
      document.getElementById("popup").style.display = "flex";
      document.getElementById("popup-title").innerText = "Congrats";
      document.getElementById(
        "popup-message"
      ).innerText = `Congrats! You solved this ${difficulty} puzzle in ${secondsToTimeString(
        timeElapsed2
      )}.`;
    } else {
      document.getElementById("popup").style.display = "flex";
      document.getElementById("popup-title").innerText = "Game Over";
      document.getElementById(
        "popup-message"
      ).innerText = `You have made ${maxMistakes} mistakes and lost this game.`;
    }
  });
}

function secondsToTimeString(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const paddedSeconds =
    remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
  return `${minutes}:${paddedSeconds}`;
}
function toggleNotes(state) {
  noteMode = state;

  if (noteMode) {
    document.getElementById("mode-button-normal").className =
      "button button-left";
    document.getElementById("mode-button-note").className =
      "button button-right selected";
    document.getElementById("keyboard-keys").className = "keys note-mode";
  } else {
    document.getElementById("mode-button-normal").className =
      "button button-left selected";
    document.getElementById("mode-button-note").className =
      "button button-right";
    document.getElementById("keyboard-keys").className = "keys";
  }
}

function deferCSSImport(url) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

deferCSSImport(
  "https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&family=Roboto&family=IBM+Plex+Mono:wght@200;400;500&display=swap"
);

init();

console.log("hallo");
