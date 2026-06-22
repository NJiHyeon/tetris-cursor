// ── 보드·게임 설정 ──
const COLS = 10;
const ROWS = 20;
const DROP_INTERVAL = 800;
const CELL_EMPTY = 0;
const CELL_BLOCK = 1;
const FALLBACK_LINE_SCORE = 100;

// 줄 삭제 수에 따른 점수 (1~4줄)
const LINE_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

// 테트로미노 블록 정의 (1 = 블록이 차지하는 칸)
const PIECES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: "piece-i",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "piece-o",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "piece-t",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "piece-s",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "piece-z",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "piece-j",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "piece-l",
  },
};

const PIECE_TYPES = Object.keys(PIECES);

// ── DOM 요소 ──
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-btn");
const gameOverElement = document.getElementById("game-over");

// ── 게임 상태 ──
let board = [];
let currentPiece = null;
let dropTimerId = null;
let isGameOver = false;
let score = 0;

// ── 보드 유틸 ──

/**
 * 빈 한 줄을 만든다.
 */
function createEmptyRow() {
  return Array(COLS).fill(CELL_EMPTY);
}

/**
 * 2차원 배열로 빈 보드를 만든다.
 */
function createEmptyBoard() {
  const newBoard = [];
  for (let row = 0; row < ROWS; row++) {
    newBoard.push(createEmptyRow());
  }
  return newBoard;
}

/**
 * 좌표가 보드 안에 있는지 확인한다.
 */
function isWithinBoard(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

/**
 * shape 배열의 복사본을 만든다.
 */
function copyShape(shape) {
  return shape.map((row) => [...row]);
}

/**
 * 한 줄이 모두 채워졌는지 확인한다.
 */
function isRowFull(row) {
  return board[row].every((cell) => cell !== CELL_EMPTY);
}

/**
 * 가득 찬 줄을 삭제하고 위 블록을 내린다.
 * @returns {number} 삭제된 줄 수
 */
function clearLines() {
  let linesCleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (!isRowFull(row)) {
      continue;
    }

    board.splice(row, 1);
    board.unshift(createEmptyRow());
    linesCleared += 1;
    row += 1;
  }

  return linesCleared;
}

// ── 조각 생성·판정 ──

/**
 * 블록 타입을 받아 현재 조각 객체를 만든다.
 * 보드 상단 중앙에 배치한다.
 */
function createPiece(type) {
  const pieceDef = PIECES[type];
  const shape = pieceDef.shape;

  return {
    type,
    shape: copyShape(shape),
    row: 0,
    col: Math.floor((COLS - shape[0].length) / 2),
    color: pieceDef.color,
  };
}

/**
 * 랜덤 블록 타입을 고른다.
 */
function getRandomPieceType() {
  const index = Math.floor(Math.random() * PIECE_TYPES.length);
  return PIECE_TYPES[index];
}

/**
 * shape 배열을 시계 방향 90도 회전한다.
 */
function rotateShape(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = [];

  for (let col = 0; col < cols; col++) {
    rotated[col] = [];
    for (let row = rows - 1; row >= 0; row--) {
      rotated[col].push(shape[row][col]);
    }
  }

  return rotated;
}

/**
 * 조각의 채워진 칸마다 콜백을 실행한다.
 */
function forEachFilledCell(piece, shape, callback) {
  const cells = shape || piece.shape;

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      if (cells[row][col] !== CELL_BLOCK) {
        continue;
      }
      callback(piece.row + row, piece.col + col);
    }
  }
}

/**
 * 이동(dx, dy)이 가능한지 판정한다.
 * matrix: 고정 블록이 담긴 보드 배열
 * shape: 검사할 블록 모양 (생략 시 piece.shape 사용)
 */
function canMove(piece, dx, dy, matrix, shape) {
  if (!piece) {
    return false;
  }

  let movable = true;

  forEachFilledCell(piece, shape, (boardRow, boardCol) => {
    const newRow = boardRow + dy;
    const newCol = boardCol + dx;

    if (newCol < 0 || newCol >= COLS || newRow >= ROWS) {
      movable = false;
      return;
    }

    if (newRow >= 0 && matrix[newRow][newCol]) {
      movable = false;
    }
  });

  return movable;
}

/**
 * 현재 블록을 보드에 고정한다.
 */
function lockPiece(piece) {
  if (!piece) {
    return;
  }

  forEachFilledCell(piece, null, (boardRow, boardCol) => {
    if (!isWithinBoard(boardRow, boardCol)) {
      return;
    }
    board[boardRow][boardCol] = piece.color;
  });
}

// ── 점수·게임 상태 ──

/**
 * 점수 표시를 갱신한다.
 */
function updateScoreDisplay() {
  scoreElement.textContent = String(score);
}

/**
 * 삭제된 줄 수에 따라 점수를 올린다.
 */
function addScore(linesCleared) {
  if (linesCleared <= 0) {
    return;
  }

  const points = LINE_SCORES[linesCleared] || linesCleared * FALLBACK_LINE_SCORE;
  score += points;
  updateScoreDisplay();
}

/**
 * 점수를 0으로 초기화한다.
 */
function resetScore() {
  score = 0;
  updateScoreDisplay();
}

/**
 * 게임 오버 UI를 갱신한다.
 */
function updateGameOverUI() {
  if (!gameOverElement) {
    return;
  }

  gameOverElement.hidden = !isGameOver;
}

/**
 * 게임 오버 상태로 전환한다.
 */
function triggerGameOver() {
  isGameOver = true;
  currentPiece = null;
  stopDropTimer();
  updateGameOverUI();
}

/**
 * 진행 중인 게임인지 확인한다.
 */
function isActiveGame() {
  return !isGameOver && currentPiece !== null;
}

/**
 * 새 블록을 스폰한다. 스폰 위치가 막혀 있으면 게임오버.
 */
function spawnPiece() {
  currentPiece = createPiece(getRandomPieceType());

  if (!canMove(currentPiece, 0, 0, board)) {
    triggerGameOver();
  }
}

/**
 * 블록을 고정하고 라인 삭제·점수 반영 후 다음 블록을 스폰한다.
 */
function lockAndContinue() {
  if (!currentPiece) {
    return;
  }

  lockPiece(currentPiece);
  addScore(clearLines());
  spawnPiece();
  updateGameOverUI();
  render();
}

// ── 조작·낙하 ──

/**
 * 조각을 이동한다. 충돌 판정을 통과할 때만 적용한다.
 */
function tryMove(dx, dy) {
  if (!isActiveGame()) {
    return false;
  }

  if (!canMove(currentPiece, dx, dy, board)) {
    return false;
  }

  currentPiece.col += dx;
  currentPiece.row += dy;
  render();
  return true;
}

/**
 * 블록을 시계 방향으로 회전한다. 충돌 시 회전을 취소한다.
 */
function tryRotate() {
  if (!isActiveGame()) {
    return false;
  }

  const rotatedShape = rotateShape(currentPiece.shape);

  if (!canMove(currentPiece, 0, 0, board, rotatedShape)) {
    return false;
  }

  currentPiece.shape = rotatedShape;
  render();
  return true;
}

/**
 * 한 칸 아래로 떨어뜨린다. 막히면 고정 후 새 블록을 만든다.
 */
function moveDownOneStep() {
  if (!currentPiece) {
    return;
  }

  if (canMove(currentPiece, 0, 1, board)) {
    currentPiece.row += 1;
    render();
  } else {
    lockAndContinue();
  }
}

/**
 * 자동·수동 낙하 공통 처리
 */
function fallOneStep() {
  if (!isActiveGame()) {
    return;
  }

  moveDownOneStep();
}

/**
 * 타이머에 의한 자동 낙하
 */
function dropPiece() {
  fallOneStep();
}

/**
 * 소프트 드롭: 한 칸 빠르게 내리기
 */
function softDrop() {
  fallOneStep();
}

/**
 * 하드 드롭: 바닥까지 즉시 내린 뒤 고정한다.
 */
function hardDrop() {
  if (!isActiveGame()) {
    return;
  }

  while (canMove(currentPiece, 0, 1, board)) {
    currentPiece.row += 1;
  }

  lockAndContinue();
}

// ── 렌더링 ──

/**
 * 보드와 현재 블록을 함께 그린다.
 */
function render() {
  renderBoard();
  drawPiece(currentPiece);
}

/**
 * 보드에 고정된 칸만 화면에 그린다.
 */
function renderBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      const value = board[row][col];
      if (value) {
        cell.classList.add(value);
      }

      boardElement.appendChild(cell);
    }
  }
}

/**
 * 현재 떨어지는 블록을 보드 위에 그린다.
 */
function drawPiece(piece) {
  if (!piece) {
    return;
  }

  forEachFilledCell(piece, null, (boardRow, boardCol) => {
    if (!isWithinBoard(boardRow, boardCol)) {
      return;
    }

    const cell = boardElement.querySelector(
      `[data-row="${boardRow}"][data-col="${boardCol}"]`
    );

    if (cell) {
      cell.classList.add(piece.color);
    }
  });
}

// ── 타이머·초기화 ──

/**
 * 자동 낙하 타이머를 시작한다.
 */
function startDropTimer() {
  stopDropTimer();
  dropTimerId = setInterval(dropPiece, DROP_INTERVAL);
}

/**
 * 자동 낙하 타이머를 멈춘다.
 */
function stopDropTimer() {
  if (dropTimerId !== null) {
    clearInterval(dropTimerId);
    dropTimerId = null;
  }
}

/**
 * 게임을 초기 상태로 되돌린다.
 */
function initGame() {
  stopDropTimer();
  isGameOver = false;
  board = createEmptyBoard();
  currentPiece = null;
  resetScore();
  spawnPiece();
  render();
  updateGameOverUI();

  if (!isGameOver) {
    startDropTimer();
  }
}

// ── 입력 ──

/**
 * 키보드 입력을 처리한다. (한 번만 등록)
 */
function handleKeyDown(event) {
  if (isGameOver) {
    return;
  }

  switch (event.code) {
    case "ArrowLeft":
      event.preventDefault();
      tryMove(-1, 0);
      break;
    case "ArrowRight":
      event.preventDefault();
      tryMove(1, 0);
      break;
    case "ArrowDown":
      event.preventDefault();
      softDrop();
      break;
    case "ArrowUp":
      event.preventDefault();
      tryRotate();
      break;
    case "Space":
      event.preventDefault();
      hardDrop();
      break;
    default:
      break;
  }
}

startButton.addEventListener("click", initGame);
document.addEventListener("keydown", handleKeyDown);
initGame();
