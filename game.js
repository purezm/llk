// 游戏配置
const GAME_CONFIG = {
    // 颜色配置（12种可分辨的颜色，避免太相近）
    colors: [
        '#FF6B6B', // 红色
        '#4ECDC4', // 青色
        '#45B7D1', // 蓝色
        '#96CEB4', // 绿色
        '#FFEAA7', // 黄色
        '#DDA0DD', // 紫色
        '#98D8C8', // 薄荷绿
        '#F7DC6F', // 金色
        '#BB8FCE', // 薰衣草色
        '#85C1E9', // 天蓝色
        '#F8C471', // 橙色
        '#82E0AA'  // 浅绿色
    ],
    // PC端和移动端的配置
    pc: {
        rows: 16,
        cols: 16
    },
    mobile: {
        rows: 8,
        cols: 8
    }
};

// 游戏状态
let gameState = {
    board: [],
    selectedBlock: null,
    score: 0,
    level: 1,
    globalHighscore: 0,
    personalHighscore: 0,
    isMusicOn: true,
    isSoundOn: true,
    gameSize: null // 存储当前游戏大小配置
};

// DOM元素
let elements = {};

// 初始化游戏
function initGame() {
    // 初始化DOM元素
    elements = {
        gameBoard: document.getElementById('game-board'),
        currentScore: document.getElementById('current-score'),
        globalHighscore: document.getElementById('global-highscore'),
        personalHighscore: document.getElementById('personal-highscore'),
        level: document.getElementById('level'),
        remainingBlocks: document.getElementById('remaining-blocks'),
        newGameBtn: document.getElementById('new-game'),
        hintBtn: document.getElementById('hint'),
        musicToggleBtn: document.getElementById('music-toggle'),
        soundToggleBtn: document.getElementById('sound-toggle'),
        rulesModal: document.getElementById('rules-modal'),
        closeRulesBtn: document.getElementById('close-rules'),
        gameOverModal: document.getElementById('game-over'),
        restartGameBtn: document.getElementById('restart-game'),
        levelClearModal: document.getElementById('level-clear'),
        completedLevel: document.getElementById('completed-level'),
        nextLevelBtn: document.getElementById('next-level'),
        fireworksContainer: document.getElementById('fireworks-container'),
        matchSound: document.getElementById('match-sound'),
        errorSound: document.getElementById('error-sound'),
        backgroundMusic: document.getElementById('background-music')
    };

    // 设置音量
    elements.matchSound.volume = 0.5;
    elements.errorSound.volume = 0.5;
    elements.backgroundMusic.volume = 0.3; // 背景音乐音量低于音效

    // 检查是否首次进入游戏
    if (!localStorage.getItem('hasSeenRules')) {
        elements.rulesModal.style.display = 'flex';
        localStorage.setItem('hasSeenRules', 'true');
    }

    // 加载最高分
    loadHighscores();

    // 检测设备类型并设置游戏大小
    detectDevice();

    // 初始化事件监听器
    initEventListeners();

    // 开始游戏
    startNewGame();

    // 播放背景音乐
    if (gameState.isMusicOn) {
        elements.backgroundMusic.play();
    }
}

// 检测设备类型
function detectDevice() {
    if (window.innerWidth <= 768) {
        gameState.gameSize = GAME_CONFIG.mobile;
    } else {
        gameState.gameSize = GAME_CONFIG.pc;
    }
}

// 初始化事件监听器
function initEventListeners() {
    // 新游戏按钮
    elements.newGameBtn.addEventListener('click', startNewGame);

    // 提示按钮
    elements.hintBtn.addEventListener('click', showHint);

    // 音乐开关
    elements.musicToggleBtn.addEventListener('click', toggleMusic);

    // 音效开关
    elements.soundToggleBtn.addEventListener('click', toggleSound);

    // 关闭规则弹窗
    elements.closeRulesBtn.addEventListener('click', () => {
        elements.rulesModal.style.display = 'none';
    });

    // 重新开始游戏
    elements.restartGameBtn.addEventListener('click', () => {
        elements.gameOverModal.style.display = 'none';
        startNewGame();
    });

    // 下一关
    elements.nextLevelBtn.addEventListener('click', () => {
        elements.levelClearModal.style.display = 'none';
        gameState.level++;
        startNewGame();
    });

    // 窗口大小变化时重新检测设备
    window.addEventListener('resize', () => {
        const oldGameSize = gameState.gameSize;
        detectDevice();
        if (oldGameSize !== gameState.gameSize) {
            startNewGame();
        }
    });
}

// 加载最高分
function loadHighscores() {
    gameState.globalHighscore = parseInt(localStorage.getItem('globalHighscore')) || 0;
    gameState.personalHighscore = parseInt(localStorage.getItem('personalHighscore')) || 0;
    updateDataDisplay();
}

// 保存最高分
function saveHighscores() {
    if (gameState.score > gameState.globalHighscore) {
        gameState.globalHighscore = gameState.score;
        localStorage.setItem('globalHighscore', gameState.globalHighscore.toString());
    }
    if (gameState.score > gameState.personalHighscore) {
        gameState.personalHighscore = gameState.score;
        localStorage.setItem('personalHighscore', gameState.personalHighscore.toString());
    }
    updateDataDisplay();
}

// 开始新游戏
function startNewGame() {
    // 重置游戏状态
    gameState.score = 0;
    gameState.selectedBlock = null;
    
    // 生成游戏板
    generateBoard();
    
    // 更新数据显示
    updateDataDisplay();
    
    // 渲染游戏板
    renderBoard();
}

// 生成游戏板
function generateBoard() {
    const { rows, cols } = gameState.gameSize;
    const totalBlocks = rows * cols;
    const pairsNeeded = totalBlocks / 2;
    
    // 生成颜色数组
    let colorArray = [];
    for (let i = 0; i < pairsNeeded; i++) {
        const colorIndex = i % GAME_CONFIG.colors.length;
        colorArray.push(GAME_CONFIG.colors[colorIndex]);
        colorArray.push(GAME_CONFIG.colors[colorIndex]);
    }
    
    // 打乱颜色数组
    colorArray = shuffleArray(colorArray);
    
    // 生成游戏板
    gameState.board = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            row.push({
                color: colorArray[index],
                isVisible: true,
                row: i,
                col: j
            });
        }
        gameState.board.push(row);
    }
    
    // 确保有可消除的方块
    ensureSolvable();
}

// 确保游戏板可解
function ensureSolvable() {
    // 检查是否有可消除的方块
    let hasSolvablePairs = false;
    for (let i = 0; i < gameState.gameSize.rows; i++) {
        for (let j = 0; j < gameState.gameSize.cols; j++) {
            if (gameState.board[i][j].isVisible) {
                for (let k = 0; k < gameState.gameSize.rows; k++) {
                    for (let l = 0; l < gameState.gameSize.cols; l++) {
                        if ((i !== k || j !== l) && gameState.board[k][l].isVisible && 
                            gameState.board[i][j].color === gameState.board[k][l].color && 
                            canConnect(i, j, k, l)) {
                            hasSolvablePairs = true;
                            return;
                        }
                    }
                }
            }
        }
    }
    
    // 如果没有可消除的方块，重新生成游戏板
    if (!hasSolvablePairs) {
        generateBoard();
    }
}

// 渲染游戏板
function renderBoard() {
    const { rows, cols } = gameState.gameSize;
    elements.gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    elements.gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    elements.gameBoard.innerHTML = '';
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const block = gameState.board[i][j];
            if (block.isVisible) {
                const blockElement = document.createElement('div');
                blockElement.classList.add('block');
                blockElement.style.backgroundColor = block.color;
                blockElement.dataset.row = i;
                blockElement.dataset.col = j;
                blockElement.addEventListener('click', () => selectBlock(i, j));
                elements.gameBoard.appendChild(blockElement);
            } else {
                const emptyElement = document.createElement('div');
                emptyElement.style.opacity = '0';
                elements.gameBoard.appendChild(emptyElement);
            }
        }
    }
}

// 选择方块
function selectBlock(row, col) {
    const block = gameState.board[row][col];
    
    // 如果方块不可见，直接返回
    if (!block.isVisible) return;
    
    // 如果已经选中了一个方块
    if (gameState.selectedBlock) {
        const selectedBlock = gameState.selectedBlock;
        
        // 如果点击的是同一个方块，取消选择
        if (selectedBlock.row === row && selectedBlock.col === col) {
            deselectBlock();
            return;
        }
        
        // 检查两个方块是否相同颜色
        if (selectedBlock.color === block.color) {
            // 检查是否可以连接
            if (canConnect(selectedBlock.row, selectedBlock.col, row, col)) {
                // 消除方块
                removeBlocks(selectedBlock.row, selectedBlock.col, row, col);
                
                // 播放匹配音效
                if (gameState.isSoundOn) {
                    elements.matchSound.currentTime = 0;
                    elements.matchSound.play();
                }
                
                // 增加分数
                gameState.score += 10 * gameState.level;
                updateDataDisplay();
                
                // 检查是否完成关卡
                checkLevelCompletion();
            } else {
                // 播放错误音效
                if (gameState.isSoundOn) {
                    elements.errorSound.currentTime = 0;
                    elements.errorSound.play();
                }
                
                // 取消选择
                deselectBlock();
            }
        } else {
            // 播放错误音效
            if (gameState.isSoundOn) {
                elements.errorSound.currentTime = 0;
                elements.errorSound.play();
            }
            
            // 取消选择并选择新方块
            deselectBlock();
            selectBlock(row, col);
        }
    } else {
        // 选择第一个方块
        gameState.selectedBlock = block;
        const blockElement = document.querySelector(`.block[data-row="${row}"][data-col="${col}"]`);
        if (blockElement) {
            blockElement.classList.add('selected');
        }
    }
}

// 取消选择方块
function deselectBlock() {
    if (gameState.selectedBlock) {
        const blockElement = document.querySelector(`.block[data-row="${gameState.selectedBlock.row}"][data-col="${gameState.selectedBlock.col}"]`);
        if (blockElement) {
            blockElement.classList.remove('selected');
        }
        gameState.selectedBlock = null;
    }
}

// 检查两个方块是否可以连接
function canConnect(row1, col1, row2, col2) {
    // 直线连接（无拐角）
    if (canConnectDirectly(row1, col1, row2, col2)) {
        return true;
    }
    
    // 一个拐角
    if (canConnectWithOneCorner(row1, col1, row2, col2)) {
        return true;
    }
    
    // 两个拐角
    if (canConnectWithTwoCorners(row1, col1, row2, col2)) {
        return true;
    }
    
    return false;
}

// 直线连接（无拐角）
function canConnectDirectly(row1, col1, row2, col2) {
    // 同一行
    if (row1 === row2) {
        const minCol = Math.min(col1, col2);
        const maxCol = Math.max(col1, col2);
        for (let col = minCol + 1; col < maxCol; col++) {
            if (gameState.board[row1][col].isVisible) {
                return false;
            }
        }
        return true;
    }
    
    // 同一列
    if (col1 === col2) {
        const minRow = Math.min(row1, row2);
        const maxRow = Math.max(row1, row2);
        for (let row = minRow + 1; row < maxRow; row++) {
            if (gameState.board[row][col1].isVisible) {
                return false;
            }
        }
        return true;
    }
    
    return false;
}

// 一个拐角连接
function canConnectWithOneCorner(row1, col1, row2, col2) {
    // 检查左上角和右下角的拐角
    if (canConnectDirectly(row1, col1, row1, col2) && canConnectDirectly(row1, col2, row2, col2)) {
        return true;
    }
    if (canConnectDirectly(row1, col1, row2, col1) && canConnectDirectly(row2, col1, row2, col2)) {
        return true;
    }
    
    return false;
}

// 两个拐角连接
function canConnectWithTwoCorners(row1, col1, row2, col2) {
    const { rows, cols } = gameState.gameSize;
    
    // 检查上边和下边的边界
    for (let col = 0; col < cols; col++) {
        if (canConnectDirectly(row1, col1, row1, col) && canConnectDirectly(row1, col, 0, col) && canConnectDirectly(0, col, row2, col) && canConnectDirectly(row2, col, row2, col2)) {
            return true;
        }
        if (canConnectDirectly(row1, col1, row1, col) && canConnectDirectly(row1, col, rows - 1, col) && canConnectDirectly(rows - 1, col, row2, col) && canConnectDirectly(row2, col, row2, col2)) {
            return true;
        }
    }
    
    // 检查左边和右边的边界
    for (let row = 0; row < rows; row++) {
        if (canConnectDirectly(row1, col1, row, col1) && canConnectDirectly(row, col1, row, 0) && canConnectDirectly(row, 0, row, col2) && canConnectDirectly(row, col2, row2, col2)) {
            return true;
        }
        if (canConnectDirectly(row1, col1, row, col1) && canConnectDirectly(row, col1, row, cols - 1) && canConnectDirectly(row, cols - 1, row, col2) && canConnectDirectly(row, col2, row2, col2)) {
            return true;
        }
    }
    
    return false;
}

// 消除方块
function removeBlocks(row1, col1, row2, col2) {
    // 标记方块为不可见
    gameState.board[row1][col1].isVisible = false;
    gameState.board[row2][col2].isVisible = false;
    
    // 移除选中状态
    deselectBlock();
    
    // 重新渲染游戏板
    renderBoard();
}

// 检查关卡是否完成
function checkLevelCompletion() {
    // 检查是否所有方块都被消除
    const { rows, cols } = gameState.gameSize;
    let allCleared = true;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (gameState.board[i][j].isVisible) {
                allCleared = false;
                break;
            }
        }
        if (!allCleared) break;
    }
    
    if (allCleared) {
        // 保存最高分
        saveHighscores();
        
        // 显示礼花特效
        showFireworks();
        
        // 显示关卡完成弹窗
        elements.completedLevel.textContent = gameState.level;
        elements.levelClearModal.style.display = 'flex';
    } else {
        // 检查是否无路可走
        checkNoMovesLeft();
    }
}

// 检查是否无路可走
function checkNoMovesLeft() {
    const { rows, cols } = gameState.gameSize;
    let hasMoves = false;
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (gameState.board[i][j].isVisible) {
                for (let k = 0; k < rows; k++) {
                    for (let l = 0; l < cols; l++) {
                        if ((i !== k || j !== l) && gameState.board[k][l].isVisible && 
                            gameState.board[i][j].color === gameState.board[k][l].color && 
                            canConnect(i, j, k, l)) {
                            hasMoves = true;
                            return;
                        }
                    }
                }
            }
        }
    }
    
    if (!hasMoves) {
        // 保存最高分
        saveHighscores();
        
        // 显示游戏失败弹窗
        elements.gameOverModal.style.display = 'flex';
        
        // 重置关卡
        gameState.level = 1;
    }
}

// 显示提示
function showHint() {
    const { rows, cols } = gameState.gameSize;
    
    // 查找可消除的方块对
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (gameState.board[i][j].isVisible) {
                for (let k = 0; k < rows; k++) {
                    for (let l = 0; l < cols; l++) {
                        if ((i !== k || j !== l) && gameState.board[k][l].isVisible && 
                            gameState.board[i][j].color === gameState.board[k][l].color && 
                            canConnect(i, j, k, l)) {
                            // 标记提示方块
                            const block1 = document.querySelector(`.block[data-row="${i}"][data-col="${j}"]`);
                            const block2 = document.querySelector(`.block[data-row="${k}"][data-col="${l}"]`);
                            if (block1 && block2) {
                                block1.classList.add('hint');
                                block2.classList.add('hint');
                                
                                // 3秒后移除提示效果
                                setTimeout(() => {
                                    block1.classList.remove('hint');
                                    block2.classList.remove('hint');
                                }, 3000);
                                
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}

// 显示礼花特效
function showFireworks() {
    const container = elements.fireworksContainer;
    container.innerHTML = '';
    
    // 生成10个礼花
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.style.position = 'absolute';
            firework.style.left = Math.random() * 100 + '%';
            firework.style.top = Math.random() * 70 + '%';
            firework.style.width = '10px';
            firework.style.height = '10px';
            firework.style.backgroundColor = GAME_CONFIG.colors[Math.floor(Math.random() * GAME_CONFIG.colors.length)];
            firework.style.borderRadius = '50%';
            firework.style.transform = 'scale(0)';
            firework.style.transition = 'all 1s ease-out';
            
            container.appendChild(firework);
            
            // 触发动画
            setTimeout(() => {
                firework.style.transform = 'scale(3)';
                firework.style.opacity = '0';
            }, 10);
            
            // 移除礼花
            setTimeout(() => {
                container.removeChild(firework);
            }, 1100);
        }, i * 200);
    }
}

// 切换音乐
function toggleMusic() {
    gameState.isMusicOn = !gameState.isMusicOn;
    elements.musicToggleBtn.textContent = `音乐: ${gameState.isMusicOn ? '开' : '关'}`;
    
    if (gameState.isMusicOn) {
        elements.backgroundMusic.play();
    } else {
        elements.backgroundMusic.pause();
    }
}

// 切换音效
function toggleSound() {
    gameState.isSoundOn = !gameState.isSoundOn;
    elements.soundToggleBtn.textContent = `音效: ${gameState.isSoundOn ? '开' : '关'}`;
}

// 更新数据显示
function updateDataDisplay() {
    elements.currentScore.textContent = gameState.score;
    elements.globalHighscore.textContent = gameState.globalHighscore;
    elements.personalHighscore.textContent = gameState.personalHighscore;
    elements.level.textContent = gameState.level;
    
    // 计算剩余方块数量
    const { rows, cols } = gameState.gameSize;
    let remaining = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (gameState.board[i][j].isVisible) {
                remaining++;
            }
        }
    }
    elements.remainingBlocks.textContent = remaining;
}

// 打乱数组
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', initGame);