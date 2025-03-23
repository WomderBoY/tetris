const grid = document.getElementById('tetris');
const previewArea = document.getElementById('preview-area');
const scoreDisplay = document.getElementById('score');
const nextPieceDisplay = document.getElementById('next-piece');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const width = 10;
const height = 20;
const previewHeight = 4;
let cells = [];
let previewCells = [];
let nextPieceCells = [];
let score = 0;
let timerId = null;
let isGameOver = false;
let isPaused = false;
let nextRandom = 0;

// 初始化游戏格子
for (let i = 0; i < width * height; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  grid.appendChild(cell);
  cells.push(cell);
}

// 初始化预览区域
for (let i = 0; i < width * previewHeight; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  previewArea.appendChild(cell);
  previewCells.push(cell);
}

// 初始化下一个方块预览区域
for (let i = 0; i < 25; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  nextPieceDisplay.appendChild(cell);
  nextPieceCells.push(cell);
}

// 定义基本的俄罗斯方块形状
const lTetromino = [
  [1, width+1, width*2+1, 2],        // 第一种旋转状态
  [width, width+1, width+2, width*2+2],
  [1, width+1, width*2+1, width*2],
  [width, width*2, width*2+1, width*2+2]
];
const jTetromino = [
  [0, width, width*2, width*2+1],    // J形方块（L的镜像）
  [width, width+1, width+2, width*2],
  [0, 1, width+1, width*2+1],
  [width+2, width*2, width*2+1, width*2+2]
];
const zTetromino = [
  [0, width, width+1, width*2+1],
  [width+1, width+2, width*2, width*2+1],
  [0, width, width+1, width*2+1],
  [width+1, width+2, width*2, width*2+1]
];
const sTetromino = [
  [1, width, width+1, width*2],      // S形方块（Z的镜像）
  [width, width+1, width*2+1, width*2+2],
  [1, width, width+1, width*2],
  [width, width+1, width*2+1, width*2+2]
];
const tTetromino = [
  [1, width, width+1, width+2],
  [1, width+1, width+2, width*2+1],
  [width, width+1, width+2, width*2+1],
  [1, width, width+1, width*2+1]
];
const oTetromino = [
  [0, 1, width, width+1],
  [0, 1, width, width+1],
  [0, 1, width, width+1],
  [0, 1, width, width+1]
];
const iTetromino = [
  [width, width+1, width+2, width+3],       // 水平
  [2, width+2, width*2+2, width*3+2],      // 垂直
  [width*2, width*2+1, width*2+2, width*2+3], // 水平(偏移)
  [1, width+1, width*2+1, width*3+1]       // 垂直(偏移)
];

const tetrominoes = [lTetromino, jTetromino, zTetromino, sTetromino, tTetromino, oTetromino, iTetromino];
const tetrominoColors = ['l-piece', 'j-piece', 'z-piece', 's-piece', 't-piece', 'o-piece', 'i-piece'];

let currentRotation = 0;
let random = Math.floor(Math.random() * tetrominoes.length);
let currentTetromino = tetrominoes[random][currentRotation];
let currentColor = tetrominoColors[random];
// 将初始位置设置在预览区域中
let currentPosition = 4 - width * 2;

// 绘制俄罗斯方块
function draw() {
  currentTetromino.forEach(index => {
    const position = currentPosition + index;
    
    // 处理在网格内的部分
    if (position >= 0 && position < width * height) {
      cells[position].classList.add('filled');
      cells[position].classList.add(currentColor);
    } 
    // 处理在预览区域的部分
    else if (position < 0) {
      // 将负数转换为预览区域的索引
      const previewIndex = position + (width * previewHeight);
      if (previewIndex >= 0 && previewIndex < width * previewHeight) {
        previewCells[previewIndex].classList.add('filled');
        previewCells[previewIndex].classList.add(currentColor);
      }
    }
  });
  drawGhost();
}

// 擦除当前方块
function undraw() {
  currentTetromino.forEach(index => {
    const position = currentPosition + index;
    
    // 擦除在网格内的部分
    if (position >= 0 && position < width * height) {
      cells[position].classList.remove('filled');
      cells[position].classList.remove(currentColor);
    } 
    // 擦除在预览区域的部分
    else if (position < 0) {
      const previewIndex = position + (width * previewHeight);
      if (previewIndex >= 0 && previewIndex < width * previewHeight) {
        previewCells[previewIndex].classList.remove('filled');
        previewCells[previewIndex].classList.remove(currentColor);
      }
    }
  });
  undrawGhost();
}

// 获取幽灵方块的位置
function getGhostPosition() {
  let ghostPosition = currentPosition;
  
  while (!currentTetromino.some(index => {
    const position = ghostPosition + index;
    const nextPosition = position + width;
    return (position >= 0 && nextPosition >= width * height) ||
           (nextPosition >= 0 && cells[nextPosition].classList.contains('frozen'));
  })) {
    ghostPosition += width;
  }
  
  return ghostPosition;
}

// 绘制幽灵方块
function drawGhost() {
  const ghostPosition = getGhostPosition();
  
  // 只绘制可见的幽灵方块(在网格内的部分)
  if (ghostPosition !== currentPosition) {
    currentTetromino.forEach(index => {
      const position = ghostPosition + index;
      if (position >= 0 && position < width * height && 
          !cells[position].classList.contains('filled')) {
        cells[position].classList.add('ghost');
        cells[position].classList.add(currentColor);
      }
    });
  }
}

// 擦除幽灵方块
function undrawGhost() {
  cells.forEach(cell => {
    cell.classList.remove('ghost');
    if (!cell.classList.contains('filled') && !cell.classList.contains('frozen')) {
      tetrominoColors.forEach(color => cell.classList.remove(color));
    }
  });
}

// 下落函数
function moveDown() {
  undraw();
  currentPosition += width;
  draw();
  freeze();
}

// 冻结函数：当方块触底或碰到已有方块时冻结
function freeze() {
  if (currentTetromino.some(index => {
    const position = currentPosition + index;
    const nextPosition = position + width;
    return (nextPosition >= width * height) ||
           (nextPosition >= 0 && cells[nextPosition].classList.contains('frozen'));
  })) {
    currentTetromino.forEach(index => {
      const position = currentPosition + index;
      if (position >= 0) {
        cells[position].classList.add('frozen');
        cells[position].classList.add(currentColor);
      }
    });
    checkRow();
    random = nextRandom;
    nextRandom = Math.floor(Math.random() * tetrominoes.length);
    currentRotation = 0;
    currentTetromino = tetrominoes[random][currentRotation];
    currentColor = tetrominoColors[random];
    // 修改初始位置，使方块从更高处开始落入
    currentPosition = 4 - width * 2;
    displayNextPiece();
    draw();
    
    if (currentTetromino.some(index => {
      const position = currentPosition + index;
      return position >= 0 && cells[position].classList.contains('frozen');
    })) {
      gameOver();
    }
  }
}

// 检查并清除满行
function checkRow() {
  for (let i = 0; i < height; i++) {
    const rowStart = i * width;
    const row = cells.slice(rowStart, rowStart + width);
    if (row.every(cell => cell.classList.contains('frozen'))) {
      score += 10;
      scoreDisplay.innerHTML = "分数: " + score;
      row.forEach(cell => {
        cell.classList.remove('frozen');
        cell.classList.remove('filled');
        tetrominoColors.forEach(color => cell.classList.remove(color));
      });
      // 删除这一行，并在顶部补充空白格
      const removed = cells.splice(rowStart, width);
      cells = removed.concat(cells);
      // 重新设置 grid 中的单元格顺序
      cells.forEach(cell => grid.appendChild(cell));
    }
  }
}

// 向左移动
function moveLeft() {
  undraw();
  const isAtLeftEdge = currentTetromino.some(index => {
    const position = currentPosition + index;
    return position >= 0 && (position % width === 0);
  });
  if (!isAtLeftEdge) currentPosition -= 1;
  if (currentTetromino.some(index => {
    const position = currentPosition + index;
    return position >= 0 && position < width * height && 
           cells[position].classList.contains('frozen');
  })) {
    currentPosition += 1;
  }
  draw();
}

// 向右移动
function moveRight() {
  undraw();
  const isAtRightEdge = currentTetromino.some(index => {
    const position = currentPosition + index;
    return position >= 0 && (position % width === width - 1);
  });
  if (!isAtRightEdge) currentPosition += 1;
  if (currentTetromino.some(index => {
    const position = currentPosition + index;
    return position >= 0 && position < width * height && 
           cells[position].classList.contains('frozen');
  })) {
    currentPosition -= 1;
  }
  draw();
}

// 旋转
function rotate() {
  undraw();
  const previousRotation = currentRotation;
  const prevPosition = currentPosition;
  
  // 尝试旋转
  currentRotation = (currentRotation + 1) % 4;
  currentTetromino = tetrominoes[random][currentRotation];

  // 处理I形方块特殊情况（需要更多的调整空间）
  const isIPiece = random === 6; // I形方块的索引是6
  
  // 确定墙踢（wall kick）的测试位置
  const testOffsets = isIPiece ? 
    [
      // I形方块需要更多测试位置
      0,           // 原位置
      -1, 1,       // 左右偏移1格
      -2, 2,       // 左右偏移2格
      -width,      // 向上偏移
      width,       // 向下偏移
      -1-width,    // 左上偏移
      1-width,     // 右上偏移
      -1+width,    // 左下偏移
      1+width      // 右下偏移
    ] : 
    // 其他方块的测试位置
    [0, -1, 1, -1+width, 1+width];
    
  // 检查旋转后是否有碰撞或超出边界
  if (checkCollision()) {
    // 尝试不同的位置调整
    let validPositionFound = false;
    
    for (let offset of testOffsets) {
      currentPosition += offset;
      if (!checkCollision()) {
        validPositionFound = true;
        break;
      }
      currentPosition = prevPosition; // 恢复原始位置以尝试下一个偏移
    }
    
    // 如果所有调整都失败，恢复原来的旋转状态和位置
    if (!validPositionFound) {
      currentPosition = prevPosition;
      currentRotation = previousRotation;
      currentTetromino = tetrominoes[random][currentRotation];
    }
  }
  
  draw();
}

// 检查碰撞和边界
function checkCollision() {
  // 特殊处理I形方块的边界检查
  const isIPiece = random === 6;
  
  if (isIPiece && currentRotation % 2 === 0) {
    // I形方块水平时的特殊检查
    return getITetrominoCollision();
  }
  
  // 其他方块的常规检查
  return currentTetromino.some(index => {
    const newPosition = currentPosition + index;
    
    // 计算网格坐标
    const newX = newPosition % width;
    const newY = Math.floor(newPosition / width);
    
    // 计算当前位置的原始X坐标
    const currentX = currentPosition % width;
    
    // 如果在网格上方，只检查水平边界
    if (newPosition < 0) {
      return newX < 0 || newX >= width || Math.abs(newX - currentX) > 2;
    }
    
    return (
      // 检查是否超出游戏区域边界
      newX < 0 || 
      newX >= width || 
      newY >= height ||
      
      // 检查是否穿越左右边界
      Math.abs(newX - currentX) > 2 ||
      
      // 检查是否与已固定的方块重叠
      cells[newPosition].classList.contains('frozen')
    );
  });
}

// I形方块特殊碰撞检测
function getITetrominoCollision() {
  for (let index of currentTetromino) {
    const newPosition = currentPosition + index;
    const newX = newPosition % width;
    
    // 对于网格上方的方块只检查水平边界
    if (newPosition < 0) {
      if (newX < 0 || newX >= width) return true;
      continue;
    }
    
    // 超出游戏区域
    if (newPosition >= width * height) return true;
    
    // 检查是否所有可见方块在同一行
    const rowOfFirstPiece = Math.floor((currentPosition + currentTetromino.find(i => currentPosition + i >= 0)) / width);
    if (Math.floor(newPosition / width) !== rowOfFirstPiece && newPosition >= 0) return true;
    
    // 与已固定方块碰撞
    if (cells[newPosition].classList.contains('frozen')) return true;
  }
  
  // 检查是否有方块穿过边界
  const visiblePieces = currentTetromino.filter(index => currentPosition + index >= 0);
  if (visiblePieces.length > 0) {
    const minX = Math.min(...visiblePieces.map(index => (currentPosition + index) % width));
    const maxX = Math.max(...visiblePieces.map(index => (currentPosition + index) % width));
    
    // 检查水平跨度是否合理
    if (maxX - minX > 3) return true;
  }
  
  return false;
}

// 显示下一个方块
function displayNextPiece() {
  nextPieceCells.forEach(cell => {
    cell.classList.remove('filled');
    tetrominoColors.forEach(color => cell.classList.remove(color));
  });

  const nextPiece = tetrominoes[nextRandom][0];
  const nextColor = tetrominoColors[nextRandom];
  
  // 为不同形状定义不同的显示位置
  const displayIndexes = [
    [7, 12, 17, 8],     // L形方块
    [6, 11, 16, 17],    // J形方块
    [6, 11, 12, 17],    // Z形方块
    [7, 12, 11, 16],    // S形方块（修正显示位置）
    [7, 11, 12, 13],    // T形方块
    [6, 7, 11, 12],     // O形方块
    [7, 12, 17, 22]     // I形方块
  ];
  
  const currentDisplayIndex = displayIndexes[nextRandom];
  nextPiece.forEach((index, i) => {
    nextPieceCells[currentDisplayIndex[i]].classList.add('filled');
    nextPieceCells[currentDisplayIndex[i]].classList.add(nextColor);
  });
}

// 清除预览区域
function clearPreviewArea() {
  previewCells.forEach(cell => {
    cell.classList.remove('filled');
    tetrominoColors.forEach(color => cell.classList.remove(color));
  });
}

function gameOver() {
  clearInterval(timerId);
  timerId = null;
  isGameOver = true;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  // 清除预览区域
  clearPreviewArea();
  alert("游戏结束！最终得分：" + score);
}

// 修改键盘控制
function control(e) {
  if (timerId && !isPaused) {
    if(e.keyCode === 37) {
      moveLeft();
    } else if(e.keyCode === 38) {
      rotate();
    } else if(e.keyCode === 39) {
      moveRight();
    } else if(e.keyCode === 40) {
      moveDown();
    } else if(e.keyCode === 32) {
      hardDrop();
    }
  }
}

// 添加快速下落功能
function hardDrop() {
  undraw();
  currentPosition = getGhostPosition();
  draw();
  freeze();
}

// 事件监听
document.addEventListener('keydown', control);
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', resetGame);

// 更新游戏控制函数
function startGame() {
  if (isGameOver) {
    resetGame();
  }
  if (!timerId) {
    draw();
    timerId = setInterval(moveDown, 500);
    nextRandom = Math.floor(Math.random() * tetrominoes.length);
    displayNextPiece();
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    restartBtn.disabled = false;
  }
}

function pauseGame() {
  if (!isGameOver) {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      isPaused = true;
      grid.classList.add('paused');
      pauseBtn.textContent = '继续';
      startBtn.disabled = true;
    } else {
      timerId = setInterval(moveDown, 500);
      isPaused = false;
      grid.classList.remove('paused');
      pauseBtn.textContent = '暂停';
    }
  }
}

function resetGame() {
  clearInterval(timerId);
  timerId = null;
  score = 0;
  isGameOver = false;
  isPaused = false;
  scoreDisplay.innerHTML = "分数: 0";
  grid.classList.remove('paused');
  
  // 清空所有格子
  cells.forEach(cell => {
    cell.classList.remove('filled');
    cell.classList.remove('frozen');
    tetrominoColors.forEach(color => cell.classList.remove(color));
  });
  
  // 清空预览区域
  previewCells.forEach(cell => {
    cell.classList.remove('filled');
    tetrominoColors.forEach(color => cell.classList.remove(color));
  });
  
  // 重置当前方块
  currentPosition = 4 - width * 2; // 从更高的位置开始，使整个方块可见
  random = Math.floor(Math.random() * tetrominoes.length);
  currentRotation = 0;
  currentTetromino = tetrominoes[random][currentRotation];
  currentColor = tetrominoColors[random];
  
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  restartBtn.disabled = true;
  pauseBtn.textContent = '暂停';
}

// 初次绘制
draw(); 