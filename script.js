const grid = document.getElementById('tetris');
const previewArea = document.getElementById('preview-area');
const scoreDisplay = document.getElementById('score');
const nextPieceDisplay = document.getElementById('next-piece');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
// 移动端控制按钮
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');
const rotateBtn = document.getElementById('rotate-btn');
const dropBtn = document.getElementById('drop-btn');

const width = 10;
const height = 20;
const previewHeight = 4;
let cells = [];
let previewCells = [];
let nextPieceCells = [];
let score = 0;
let lineCount = 0;
let level = 1;
let highScore = 0; // 历史最高分记录
let timerId = null;
let isGameOver = false;
let isPaused = false;
let nextRandom = 0;
let isMobileDevice = false;

// 添加防抖标志
let isDropping = false;

// 添加难度设置
let difficultyLevel = 'normal'; // 默认难度为普通
const normalSpeed = 500;
const hardSpeed = 300;
const speedReductionPerLevel = 25; // 每升一级减少的毫秒数
const minSpeed = 200; // 最小下落时间（毫秒）

// 获取难度按钮
const normalBtn = document.getElementById('normal-btn');
const hardBtn = document.getElementById('hard-btn');

// 检测是否为移动设备
function checkMobileDevice() {
  return (window.innerWidth <= 768) || 
         ('ontouchstart' in window) || 
         (navigator.maxTouchPoints > 0) || 
         (navigator.msMaxTouchPoints > 0);
}

// 强制显示移动端控制按钮，不依赖于设备检测结果
function forceMobileControls() {
  const mobileControls = document.querySelector('.mobile-controls');
  if (mobileControls) {
    mobileControls.style.display = 'flex';
    console.log("强制显示移动端控制按钮");
  }
}

// 初始化所有控制
function initializeControls() {
  console.log("初始化所有控制按钮...");
  
  // 确保游戏控制按钮已绑定事件
  if (startBtn) startBtn.addEventListener('click', startGame);
  if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
  if (restartBtn) restartBtn.addEventListener('click', resetGame);
  
  // 确保难度按钮已绑定事件
  if (normalBtn) normalBtn.addEventListener('click', function() {
    setDifficulty('normal');
    updateDifficultyButtons();
  });
  
  if (hardBtn) hardBtn.addEventListener('click', function() {
    setDifficulty('hard');
    updateDifficultyButtons();
  });
  
  // 重置最高分按钮
  const resetHighScoreBtn = document.getElementById('reset-highscore-btn');
  if (resetHighScoreBtn) {
    resetHighScoreBtn.addEventListener('click', function() {
      if (confirm("确定要重置历史最高分记录吗？")) {
        resetHighScore();
      }
    });
  }
  
  // 更新难度按钮初始状态
  updateDifficultyButtons();
  
  // 设置移动端控制
  setupMobileControls();
  
  // 强制显示移动控制
  forceMobileControls();
  
  // 防止文档滚动 - 使用更直接的方法禁用触摸区域内的滚动
  const mobileControls = document.querySelector('.mobile-controls');
  if (mobileControls) {
    mobileControls.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    // 确保移动区域内的按钮不触发页面滚动
    const buttons = mobileControls.querySelectorAll('.control-btn');
    buttons.forEach(btn => {
      btn.addEventListener('touchmove', function(e) {
        e.preventDefault();
      }, { passive: false });
    });
  }
  
  console.log("所有控制按钮初始化完成");
}

// 在页面加载完成后手动显示移动控制
window.addEventListener('DOMContentLoaded', function() {
  console.log("DOM加载完成，初始化游戏控制...");
  
  // 初始化移动设备检测
  isMobileDevice = checkMobileDevice();
  
  // 设置DOM元素样式，确保移动控制按钮显示
  const mobileControls = document.querySelector('.mobile-controls');
  if (mobileControls) {
    mobileControls.style.display = 'flex';
    console.log("移动控制按钮容器已显示");
  }
  
  // 初始化移动控制
  initializeControls();
});

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
  if (timerId && !isPaused) {
    undraw();
    currentPosition += width;
    draw();
    freeze();
  }
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
  let rowsCleared = 0;
  const initialLines = lineCount; // 记录清除前的行数
  
  for (let i = 0; i < height; i++) {
    const rowStart = i * width;
    const row = cells.slice(rowStart, rowStart + width);
    if (row.every(cell => cell.classList.contains('frozen'))) {
      rowsCleared++;
      score += 10;
      lineCount++;
      
      // 更新分数显示
      updateScore();
      
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
  
  // 只有在清除了行后才需要检查等级
  if (rowsCleared > 0) {
    // 检查是否跨越了多个升级点
    checkMultipleLevelUps(initialLines, lineCount);
    console.log(`清除了${rowsCleared}行，总行数:${lineCount}，当前等级:${level}`);
  }
}

// 检查是否需要多次升级
function checkMultipleLevelUps(oldLines, newLines) {
  // 计算旧行数对应的等级
  const oldLevel = Math.floor(oldLines / 10) + 1;
  // 计算新行数对应的等级
  const newLevel = Math.floor(newLines / 10) + 1;
  
  // 如果等级应该变化
  if (newLevel > oldLevel) {
    // 直接设置为新的等级
    level = newLevel;
    
    // 更新游戏速度
    if (timerId) {
      clearInterval(timerId);
      // 每级减少25ms而不是50ms，并且设置最小速度为200ms
      const baseSpeed = getGameSpeed(); // 基础速度
      const newSpeed = Math.max(baseSpeed - (level - 1) * speedReductionPerLevel, minSpeed);
      
      timerId = setInterval(moveDown, newSpeed);
      console.log(`升级! 当前等级:${level}, 速度:${newSpeed}ms`);
    }
  }
}

// 向左移动
function moveLeft() {
  if (timerId && !isPaused) {
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
}

// 向右移动
function moveRight() {
  if (timerId && !isPaused) {
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
}

// 旋转
function rotate() {
  if (timerId && !isPaused) {
    console.log("执行旋转操作");
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
  restartBtn.disabled = false;  // 确保重新开始按钮可用
  
  // 清除预览区域
  clearPreviewArea();
  
  // 检查是否创造了新的最高分记录
  const isNewHighScore = checkHighScore();
  
  // 游戏结束提示
  let gameOverMessage = `游戏结束！\n最终得分：${score}\n消除行数：${lineCount}\n达到等级：${level}`;
  if (isNewHighScore) {
    gameOverMessage += `\n\n恭喜您创造了新的最高分记录！`;
  } else {
    gameOverMessage += `\n\n历史最高分：${highScore}`;
  }
  
  alert(gameOverMessage);
  console.log(`游戏结束 - 得分:${score}, 行数:${lineCount}, 等级:${level}, 历史最高分:${highScore}`);
}

// 键盘控制
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
  if (timerId && !isPaused && !isDropping) {
    isDropping = true; // 设置防抖标志
    console.log("执行直接落下");
    
    undraw();
    currentPosition = getGhostPosition();
    draw();
    freeze();
    
    // 500ms后重置标志，这个时间应该足够一个方块完成落下过程
    setTimeout(() => {
      isDropping = false;
    }, 500);
  }
}

// 设置移动端虚拟按键
function setupMobileControls() {
  console.log("重新设置移动控制按钮 - 添加触摸事件");
  
  // 获取所有按钮引用
  const mLeftBtn = document.getElementById('left-btn');
  const mRightBtn = document.getElementById('right-btn');
  const mDownBtn = document.getElementById('down-btn');
  const mRotateBtn = document.getElementById('rotate-btn');
  const mDropBtn = document.getElementById('drop-btn');
  
  console.log("获取到按钮:", !!mLeftBtn, !!mRightBtn, !!mDownBtn, !!mRotateBtn, !!mDropBtn);
  
  // 移除旧的事件
  [mLeftBtn, mRightBtn, mDownBtn, mRotateBtn, mDropBtn].forEach(btn => {
    if (btn) {
      btn.onclick = null;
      
      // 移除所有事件监听器的最彻底方法是克隆并替换节点
      const newBtn = btn.cloneNode(true);
      if (btn.parentNode) {
        btn.parentNode.replaceChild(newBtn, btn);
      }
    }
  });
  
  // 重新获取引用（因为刚替换了节点）
  const leftBtn = document.getElementById('left-btn');
  const rightBtn = document.getElementById('right-btn');
  const downBtn = document.getElementById('down-btn');
  const rotateBtn = document.getElementById('rotate-btn');
  const dropBtn = document.getElementById('drop-btn');
  
  // 防抖变量，防止快速多次点击
  let canMove = true;
  
  // 通用事件处理函数
  function handleButtonEvent(e, action) {
    // 阻止默认行为和事件冒泡
    e.preventDefault();
    e.stopPropagation();
    
    // 执行相应操作
    if (canMove && timerId && !isPaused) {
      canMove = false;
      action();
      setTimeout(() => { canMove = true; }, 100);
    }
    return false;
  }
  
  // 添加触摸事件
  if (leftBtn) {
    leftBtn.addEventListener('touchstart', function(e) {
      console.log("左移触摸");
      handleButtonEvent(e, moveLeft);
    }, { passive: false, capture: true });
    
    leftBtn.addEventListener('click', function(e) {
      console.log("左移点击");
      handleButtonEvent(e, moveLeft);
    }, { passive: false, capture: true });
  }
  
  if (rightBtn) {
    rightBtn.addEventListener('touchstart', function(e) {
      console.log("右移触摸");
      handleButtonEvent(e, moveRight);
    }, { passive: false, capture: true });
    
    rightBtn.addEventListener('click', function(e) {
      console.log("右移点击");
      handleButtonEvent(e, moveRight);
    }, { passive: false, capture: true });
  }
  
  if (downBtn) {
    downBtn.addEventListener('touchstart', function(e) {
      console.log("下移触摸");
      handleButtonEvent(e, moveDown);
    }, { passive: false, capture: true });
    
    downBtn.addEventListener('click', function(e) {
      console.log("下移点击");
      handleButtonEvent(e, moveDown);
    }, { passive: false, capture: true });
  }
  
  if (rotateBtn) {
    rotateBtn.addEventListener('touchstart', function(e) {
      console.log("旋转触摸");
      handleButtonEvent(e, rotate);
    }, { passive: false, capture: true });
    
    rotateBtn.addEventListener('click', function(e) {
      console.log("旋转点击");
      handleButtonEvent(e, rotate);
    }, { passive: false, capture: true });
  }
  
  if (dropBtn) {
    dropBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("落下触摸");
      if (timerId && !isPaused && !isDropping) {
        hardDrop();
      }
      return false;
    }, { passive: false, capture: true });
    
    dropBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("落下点击");
      if (timerId && !isPaused && !isDropping) {
        hardDrop();
      }
      return false;
    }, { passive: false, capture: true });
  }
  
  // 防止触摸控制区域时页面滚动
  const mobileControls = document.querySelector('.mobile-controls');
  if (mobileControls) {
    mobileControls.addEventListener('touchmove', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, { passive: false, capture: true });
  }
  
  console.log("移动控制按钮事件已重新绑定 - 使用触摸事件");
}

// 调整游戏速度根据设备类型和难度
function adjustGameSpeed() {
  return getGameSpeed();  // 使用基于难度的速度设置
}

// 响应窗口大小变化
function handleResize() {
  isMobileDevice = checkMobileDevice();
  
  if (timerId) {
    clearInterval(timerId);
    let gameSpeed = getGameSpeed();
    timerId = setInterval(moveDown, gameSpeed);
    console.log(`窗口大小变化，调整速度: ${gameSpeed}ms`);
  }
  
  // 当窗口尺寸变化时，确保移动控制按钮在小屏幕上显示
  const mobileControls = document.querySelector('.mobile-controls');
  if (mobileControls) {
    if (isMobileDevice || window.innerWidth <= 768) {
      mobileControls.style.display = 'flex';
    } else {
      mobileControls.style.display = 'none';
    }
  }
}

// 事件监听
document.addEventListener('keydown', control);
window.addEventListener('resize', handleResize);

// 在页面内容完全加载后初始化游戏
window.addEventListener('load', function() {
  // 初始化移动设备检测
  isMobileDevice = checkMobileDevice();
  // 初始化所有控制
  initializeControls();
  // 加载历史最高分
  loadHighScore();
  // 绘制初始方块
  draw();
  console.log("游戏完全加载并初始化完成");
});

// 更新游戏控制函数
function startGame() {
  if (!timerId) {
    let gameSpeed = getGameSpeed();
    timerId = setInterval(moveDown, gameSpeed);
    console.log(`游戏开始，难度: ${difficultyLevel}, 速度: ${gameSpeed}ms`);
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    restartBtn.disabled = false;  // 确保重新开始按钮可用
    isPaused = false;
  }
}

function pauseGame() {
  if (timerId && !isPaused) {
    clearInterval(timerId);
    timerId = null;
    isPaused = true;
    pauseBtn.textContent = '继续';
    console.log('游戏暂停');
  } else if (!timerId && isPaused) {
    let gameSpeed = getGameSpeed();
    timerId = setInterval(moveDown, gameSpeed);
    isPaused = false;
    pauseBtn.textContent = '暂停';
    console.log(`游戏继续，速度: ${gameSpeed}ms`);
  }
}

function resetGame() {
  clearInterval(timerId);
  timerId = null;
  isPaused = false;
  isGameOver = false;
  pauseBtn.textContent = '暂停';
  pauseBtn.disabled = true;
  restartBtn.disabled = true;
  startBtn.disabled = false;
  
  // 重置游戏状态 (保留highScore)
  score = 0;
  lineCount = 0;
  level = 1;
  updateScore();
  
  // 清空游戏区域
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
  currentPosition = 4 - width * 2;
  random = Math.floor(Math.random() * tetrominoes.length);
  currentRotation = 0;
  currentTetromino = tetrominoes[random][currentRotation];
  currentColor = tetrominoColors[random];
  nextRandom = Math.floor(Math.random() * tetrominoes.length);
  
  // 重新绘制
  draw();
  displayNextPiece();
  console.log('游戏重置，当前最高分:', highScore);
}

// 初次绘制
draw();

// 设置难度按钮事件
normalBtn.addEventListener('click', function() {
  setDifficulty('normal');
  updateDifficultyButtons();
});

hardBtn.addEventListener('click', function() {
  setDifficulty('hard');
  updateDifficultyButtons();
});

// 设置难度函数
function setDifficulty(level) {
  difficultyLevel = level;
  
  // 如果游戏正在进行，更新下落速度
  if (timerId) {
    clearInterval(timerId);
    let gameSpeed = getGameSpeed();
    timerId = setInterval(moveDown, gameSpeed);
  }
  
  console.log(`难度已设置为: ${level}, 下落速度: ${getGameSpeed()}ms`);
}

// 获取当前难度对应的游戏速度
function getGameSpeed() {
  // 根据难度和设备类型调整速度
  if (difficultyLevel === 'hard') {
    return isMobileDevice ? hardSpeed + 100 : hardSpeed; // 移动设备上稍微慢一点
  } else {
    return isMobileDevice ? normalSpeed + 100 : normalSpeed; // 移动设备上稍微慢一点
  }
}

// 更新难度按钮显示状态
function updateDifficultyButtons() {
  normalBtn.classList.remove('active');
  hardBtn.classList.remove('active');
  
  if (difficultyLevel === 'normal') {
    normalBtn.classList.add('active');
  } else {
    hardBtn.classList.add('active');
  }
}

// 更新分数显示
function updateScore() {
  scoreDisplay.innerHTML = `分数: ${score} | 最高分: ${highScore} | 行数: ${lineCount} | 等级: ${level}`;
}

// 从localStorage加载历史最高分
function loadHighScore() {
  const savedHighScore = localStorage.getItem('tetrisHighScore');
  if (savedHighScore !== null) {
    highScore = parseInt(savedHighScore);
    console.log('加载历史最高分:', highScore);
  }
  updateScore(); // 更新显示
}

// 检查并更新最高分
function checkHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('tetrisHighScore', highScore);
    console.log('新的最高分记录:', highScore);
    return true;
  }
  return false;
}

// 重置最高分
function resetHighScore() {
  highScore = 0;
  localStorage.removeItem('tetrisHighScore');
  updateScore();
  console.log('最高分已重置');
} 