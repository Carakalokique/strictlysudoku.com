export class Cell {
  static _instances = [];
  static _selected;
  static solution;
  static _mistakes = 0;
  static difficulty = "medium";
  static maxMistakes = 3;
  constructor(x, y, value = ~~(Math.random() * 9 + 1), isClue) {
    this._isClue =
      isClue !== undefined
        ? isClue
        : Math.random() > difficulties[Cell.difficulty];
    this._groups = [];
    this.value = this._isClue ? value : 0;
    this._node = this.createNode();
    this._notes = new Set();
    this.incorrect = false;
    this._noteNodes = [];
    this.x = x;
    this.y = y;

    this._node.onclick = () => {
      this.select();
    };

    Cell._instances.push(this);
  }
  static reset() {
    Cell._instances = [];
    Cell._selected = undefined;
    Cell._mistakes = 0;
    document.getElementById("mistakes").innerText = `0 / ${Cell.maxMistakes}`;
  }

  createNode() {
    const elem = document.createElement("div");
    elem.className = "cell";
    elem.innerHTML = this.value || "";

    if (this._isClue) elem.classList.add("clue");

    document.getElementById("sudoku-board").append(elem);

    return elem;
  }

  createNoteNode(n) {
    const elem = document.createElement("div");
    elem.className = "note note-" + n;
    elem.innerHTML = n;
    this._node.append(elem);
    return elem;
  }

  setIncorrect(value) {
    this.incorrect = value;

    if (value) this._node.classList.add("incorrect");
    else if (this._node.classList.contains("incorrect"))
      this._node.classList.remove("incorrect");
  }

  checkIfIncorrect() {
    let incorrect = false;

    if (this.value !== 0 && Cell.solution[this.x][this.y] !== this.value)
      return true;

    /*this._groups.forEach(group => {
            group._cells.forEach(cell => {
                if(cell !== this && cell.value === this.value && this.value !== 0)
                {
                    incorrect = true
                }
            })
        })*/

    return incorrect;
  }

  select(lastValue) {
    /*if(this._isClue)
            return*/

    Cell._selected = this;

    Cell._instances.forEach((cell) => {
      //cell._node.className = 'cell'

      const classes = cell._node.classList;
      if (classes.contains("same-value")) classes.remove("same-value");
      if (classes.contains("same-group")) classes.remove("same-group");
      if (classes.contains("selected")) classes.remove("selected");
      if (classes.contains("same-wrong")) classes.remove("same-wrong");
      if (classes.contains("wrong")) classes.remove("wrong");

      if (cell.value === this.value && cell.value !== 0)
        cell._node.classList.add("same-value");
    });

    this._node.classList.add("selected");

    this._groups.forEach((group) => {
      group._cells.forEach((cell) => {
        cell._node.classList.add("same-group");

        if (cell !== this && cell.value === this.value && this.value !== 0) {
          cell._node.classList.add("same-wrong");

          this._node.classList.add("wrong");
        }

        cell.setIncorrect(cell.checkIfIncorrect());

        if (!this.incorrect && cell._notes.has(lastValue))
          cell.addNote(lastValue);
      });
    });

    if (!lastValue) return;

    this._groups.forEach((group) => {
      let completed = 0;
      let offset = 0;
      group.forEachCell((cell, i) => {
        if (cell === this) offset = i;
        if (cell.value !== 0 && !cell.incorrect) ++completed;
      });

      if (completed === 9)
        group.forEachCell((cell, i) =>
          cell.playAnimation(Math.abs(i - offset) * 80 + 30)
        );
    });
  }

  playAnimation(delay) {
    setTimeout(() => {
      this._node.classList.add("animated");
      setTimeout(() => {
        this._node.classList.remove("animated");
      }, 700);
    }, delay);
  }

  addNote(n) {
    if (this._isClue) return;

    if (!"123456789".includes(n)) return;

    n = +n;

    this.value = 0;
    if (this._noteNodes.length === 0) this._node.innerHTML = "";

    if (this._notes.has(n)) {
      this._notes.delete(n);
      this._noteNodes[n].outerHTML = "";
    } else {
      this._notes.add(n);
      this._noteNodes[n] = this.createNoteNode(n);
    }
  }

  enterNumber(n) {
    if (this._isClue) return;

    if (n === this.value) this.value = 0;
    else this.value = n;

    this._node.innerHTML = this.value || "";
    this._notes = new Set();
    this._noteNodes = [];

    this.setIncorrect(false);

    const incorrect = this.checkIfIncorrect();
    this.incorrect = incorrect;
    if (incorrect) Cell.makeMistake();

    this.select(n);
  }

  addToGroup(group) {
    group.addCell(this);

    this._groups.push(group);
  }

  static makeMistake() {
    ++Cell._mistakes;
    document.getElementById(
      "mistakes"
    ).innerText = `${Cell._mistakes} / ${Cell.maxMistakes}`;
  }
}

export class Group {
  _cells = [];

  addCell(cell) {
    this._cells.push(cell);
  }

  forEachCell(funct = () => 0) {
    this._cells.forEach((cell, i) => funct(cell, i));
  }
}

const difficulties = {
  test: 0.1,
  easy: 0.4,
  medium: 0.5,
  hard: 0.6,
  evil: 0.7,
};
