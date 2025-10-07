// Shared player registry (used by createPlayer and Game)
const playerPool = new Map();


// Gameboard Module
const Gameboard = (function () {
    const board = [
        [{ input: '' }, { input: '' }, { input: '' }],
        [{ input: '' }, { input: '' }, { input: '' }],
        [{ input: '' }, { input: '' }, { input: '' }]
    ];

    const getBoard = () => board.map(row => row.map(cell => ({ input: cell.input })));
    const isEmpty = (posX, posY) => board[posX][posY].input === '';

    const place = function (posX, posY, marker) {
        try {
            const outOfBounds = (posX > 2 || posY > 2) || (posX < 0 || posY < 0);

            if (typeof posX !== 'number' && typeof posY !== 'number') {
                throw `Invalid data type`;
            }

            if (outOfBounds) {
                throw `Cell (${posX},${posY}) is out of bounds`;
            }

            if (!isEmpty(posX, posY)) {
                throw `Cell (${posX},${posY}) already occupied!`;
            }

            if ((marker !== 'X' && marker !== 'O') || typeof marker !== 'string') {
                throw `Wrong marker: ${marker}`;
            }

            board[posX][posY].input = marker;

            return true;

        } catch (error) {
            console.log(error);
            return false;
        }
    }

    const reset = function () {
        board.forEach(row => row.forEach(cell => cell.input = ''));
    }


    return { getBoard, place, reset, isEmpty };

})();

// AI Module
const AI = (function () {

    const getEmptyCells = (board = Gameboard.getBoard()) => {
        const empty = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j].input === '') {
                    empty.push({ row: i, col: j });
                }
            }
        }
        return empty;
    };

    const isWinning = (board, marker) => {
        // rows & cols
        for (let i = 0; i < 3; i++) {
            if (board[i][0].input === marker && board[i][1].input === marker && board[i][2].input === marker) {
                return true;
            }
            if (board[0][i].input === marker && board[1][i].input === marker && board[2][i].input === marker) {
                return true;
            }
        }
        // diagonals
        if (board[0][0].input === marker && board[1][1].input === marker && board[2][2].input === marker) {
            return true;
        }
        if (board[0][2].input === marker && board[1][1].input === marker && board[2][0].input === marker) {
            return true;
        }
        return false;
    };


    const easyMove = (board = Gameboard.getBoard()) => {
        const empty = getEmptyCells(board);
        return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
    };

    //Heuristic AI
    const normalMove = (board, aiMarker, humanMarker) => {
        const empty = getEmptyCells(board);

        if (!empty.length) {
            return null;
        }

        if (board[1][1].input === '') {
            return { row: 1, col: 1 };
        }

        //Check for wins and return coords
        for (const cell of empty) {
            board[cell.row][cell.col].input = aiMarker
            if (isWinning(board, aiMarker)) {
                board[cell.row][cell.col].input = '';
                return cell;
            };
            board[cell.row][cell.col].input = '';
        }

        //return cell for a winning human
        for (const cell of empty) {
            board[cell.row][cell.col].input = humanMarker
            if (isWinning(board, humanMarker)) {
                board[cell.row][cell.col].input = '';
                return cell;
            };
            board[cell.row][cell.col].input = '';
        }

        const corners = [
            { row: 0, col: 0, opp: { row: 2, col: 2 } },
            { row: 0, col: 2, opp: { row: 2, col: 0 } },
            { row: 2, col: 0, opp: { row: 0, col: 2 } },
            { row: 2, col: 2, opp: { row: 0, col: 0 } },
        ];

        for (const cell of corners) {
            if (board[cell.row][cell.col].input === humanMarker && board[cell.opp.row][cell.opp.col].input === '') {
                return { row: cell.opp.row, col: cell.opp.col };
            }

            if (board[cell.row][cell.col].input === '') {
                return { row: cell.row, col: cell.col };
            }
        }

        return easyMove(board);
    };


    const minimax = (board, isMaximizing, aiMarker, humanMarker) => {
        const empty = getEmptyCells(board);

        if (isWinning(board, aiMarker)) {
            return 1;
        }

        if (isWinning(board, humanMarker)) {
            return -1;
        }

        if (empty.length === 0) {
            return 0;
        }


        if (isMaximizing) {
            let best = -Infinity;
            for (const cell of empty) {
                board[cell.row][cell.col].input = aiMarker;
                best = Math.max(best, minimax(board, false, aiMarker, humanMarker));
                board[cell.row][cell.col].input = '';
            }
            return best;
        } else {
            let best = Infinity;
            for (const cell of empty) {
                board[cell.row][cell.col].input = humanMarker;
                best = Math.min(best, minimax(board, true, aiMarker, humanMarker));
                board[cell.row][cell.col].input = '';
            }
            return best;
        }
    };

    const hardMove = (board, aiMarker, humanMarker) => {
        const empty = getEmptyCells(board);

        let bestVal = -Infinity;
        let bestCell = null;

        for (const cell of empty) {
            board[cell.row][cell.col].input = aiMarker;
            const cellVal = minimax(board, false, aiMarker, humanMarker);
            board[cell.row][cell.col].input = '';

            if (cellVal > bestVal) {
                bestVal = cellVal;
                bestCell = cell;
            }
        }

        return bestCell;
    };

    return { easyMove, normalMove, hardMove }

})();

// Game module
const Game = (function () {
    let round = 0;
    let humanPlayer = null;
    let aiPlayer = null;
    let humanPlayer1 = null;
    let humanPlayer2 = null;
    let isRoundWon = false;
    let hasStart = false;
    let currentTurn = 'X';
    let gameMode = '';
    let aiDiff = '';
    const moveHistory = [];
    const scoreHistory = [];

    //config factory
    const start = (players = playerPool, mode, aiDiffParam = 'none') => {

        if (players.size === 0) {
            console.log("Create players first");
            return;
        }

        if (mode === 'PvAI' && players.size === 1) {
            const [humanId, humanPlayerObj] = players.entries().next().value;
            const aiId = crypto.randomUUID();
            const aiTeam = humanPlayerObj.team === 'X' ? 'O' : 'X';
            const aiPlayerObj = { id: aiId, name: 'AI', team: aiTeam };
            players.set(aiId, aiPlayerObj);
            humanPlayer = humanPlayerObj;
            aiPlayer = aiPlayerObj;
        } else if (mode === 'PvP' && players.size === 2) {
            const [p1, p2] = players.values();
            humanPlayer1 = p1;
            humanPlayer2 = p2;
        }
        // Common reset for either mode
        round = 0;
        hasStart = true;
        gameMode = mode;
        aiDiff = aiDiffParam;
        Gameboard.reset();
        moveHistory.length = 0;
        isRoundWon = false;
        currentTurn = 'X';
    };

    const getCurrentPlayer = () => {
        if (gameMode === 'PvAI') {
            if (!humanPlayer || !aiPlayer) return null;
            return currentTurn === humanPlayer.team ? humanPlayer : aiPlayer;
        }
        if (gameMode === 'PvP') {
            if (!humanPlayer1 || !humanPlayer2) return null;
            return currentTurn === humanPlayer1.team ? humanPlayer1 : humanPlayer2;
        }
        return null;
    };

    const applyMove = function (posX, posY) {

        if (!hasStart || isRoundWon) {
            return false;
        }

        const player = getCurrentPlayer();
        const success = Gameboard.place(posX, posY, currentTurn);

        if (success) {
            moveHistory.push({ name: (player && player.name) ? player.name : currentTurn, posX, posY, currentTurn });
            UI.updateBoardContent(Gameboard.getBoard());
            UI.updatePanelContent();
            const hasWinner = checkWinner();

            if (hasWinner) {
                console.log(`${hasWinner} wins!`);
                return true;
            }

            currentTurn = currentTurn === 'X' ? 'O' : 'X';

        }

        if (gameMode === 'PvAI' && aiPlayer && humanPlayer && currentTurn === aiPlayer.team) {
            setTimeout(() => {
                const board = Gameboard.getBoard();
                const move = aiDiff === 'easy' ? AI.easyMove(board)
                    : aiDiff === 'normal' ? AI.normalMove(board, aiPlayer.team, humanPlayer.team)
                        : AI.hardMove(board, aiPlayer.team, humanPlayer.team);
                if (move) applyMove(move.row, move.col);
            }, 500);
        }
    };

    const checkWinner = () => {
        const board = Gameboard.getBoard();
        const lastMove = moveHistory.at(-1);
        let winningCells = null;
        let winner = '';

        if (lastMove === null || lastMove === undefined) {
            return;
        }

        if (isRoundWon) {
            return;
        }

        for (let i = 0; i < 3; i++) {
            //Horizontal Check
            if (!Gameboard.isEmpty(i, 0) && board[i][0].input === board[i][1].input && board[i][1].input === board[i][2].input) {
                winner = board[i][0].input;
                winningCells = { cell1: { row: i, col: 0 }, cell2: { row: i, col: 1 }, cell3: { row: i, col: 2 } };
                UI.highlightGridWinner(winningCells);
                isRoundWon = true;
                return winner;
            }

            // Vertical Check
            if (!Gameboard.isEmpty(0, i) && board[0][i].input === board[1][i].input && board[1][i].input === board[2][i].input) {
                winner = board[0][i].input;
                winningCells = { cell1: { row: 0, col: i }, cell2: { row: 1, col: i }, cell3: { row: 2, col: i } };
                UI.highlightGridWinner(winningCells);
                isRoundWon = true;
                return winner;
            }
        }

        //Diagonal Checks
        if (!Gameboard.isEmpty(0, 0) && board[0][0].input === board[1][1].input && board[1][1].input === board[2][2].input) {
            winner = board[0][0].input;
            winningCells = { cell1: { row: 0, col: 0 }, cell2: { row: 1, col: 1 }, cell3: { row: 2, col: 2 } };
            UI.highlightGridWinner(winningCells);
            isRoundWon = true;
            return winner;
        }

        if (!Gameboard.isEmpty(0, 2) && board[0][2].input === board[1][1].input && board[1][1].input === board[2][0].input) {
            winner = board[0][2].input;
            winningCells = { cell1: { row: 0, col: 2 }, cell2: { row: 1, col: 1 }, cell3: { row: 2, col: 0 } };
            UI.highlightGridWinner(winningCells);
            isRoundWon = true;
            return winner;
        }

        if (moveHistory.length === 9 && !isRoundWon) {
            console.log('No winners! It\'s a tie.');
            isRoundWon = true;
            return 'tie';
        }
    }

    const getState = () => {
        return { currentTurn, round, gameMode, hasStart, isRoundWon };
    }

    const getMoveHistory = () => {
        const deepCopy = [];

        for (const element of moveHistory) {
            if (element && typeof element === 'object') {
                const newObj = {};
                for (const key in element) {
                    newObj[key] = element[key];
                }
                deepCopy.push(newObj);
            }
            else {
                deepCopy.push(element);
            }
        }

        return deepCopy;
    }


    return { start, applyMove, checkWinner, getState, getMoveHistory };
})();


// Player factory
function createPlayer(name, team) {
    const id = crypto.randomUUID();

    if (team === '' || typeof team !== 'string' || typeof name !== 'string' || name === '') {
        console.log('Please double check input');
        return;
    }

    if (team !== 'X' && team !== 'O') {
        return;
    }

    const player = { id, name, team };
    playerPool.set(id, player);
    return player;
}

// UI MODULE

const UI = (function () {
    // Cache DOM elements
    const modal = document.querySelector('.bg-modal');
    const gamePanel = document.querySelector('.gamePanel');
    const cells = document.querySelectorAll('.cell');
    const app = document.querySelector('.app');
    const gameModeModal = document.querySelector('.gameMode');
    const notification = document.createElement('div');
    const modalForm = document.createElement('form');
    const turnLabel = document.querySelector('.turn');
    const roundLabel = document.querySelector('.round');
    const modeLabel = document.querySelector('.mode');
    const status = document.querySelector('.status');
    const historyContainer = document.querySelector('.history[data-history="false"]');
    const matchHistory = document.querySelector('.matchBoard__history');


    function updatePanelContent() {
        const state = Game.getState();
        const moveHistory = Game.getMoveHistory();
        turnLabel.textContent = `Turn: ${state.currentTurn}`;
        roundLabel.textContent = `Round: ${state.round + 1}`;
        modeLabel.textContent = `Mode: ${state.gameMode}`;

        if (moveHistory && moveHistory.length !== 0) {
            if (historyContainer.dataset.history === 'false') {
                const removed = matchHistory.removeChild(historyContainer);
                removed.innerHTML = '';
                historyContainer.dataset.history = 'true';
                matchHistory.appendChild(removed);
            }


            historyContainer.style.display = 'grid';

            const historyItem = document.createElement('div');
            historyItem.classList.add('historyItem');
            const last = moveHistory.at(-1);

            historyItem.innerHTML = `<div class="historyItem__number">${moveHistory.length}</div>
                            <div class="historyItem__name"> ${last.name} </div>
                            <div class="historyItem__move"> ${last.currentTurn || ''}  </div>
                            <div class="historyItem__coords"> (${last.posX + 1}, ${last.posY})   </div>`;


            historyContainer.appendChild(historyItem);
        }


    }

    function highlightGridWinner(winningCells) {
        const winningCellsList = Array.from(cells).filter(el => {
            return Object.values(winningCells).some(winningCell => {
                return Number(el.dataset.row) === winningCell.row && Number(el.dataset.col) === winningCell.col;
            });
        });

        // Add a highlight class to the winning cells
        winningCellsList.forEach(cell => cell.classList.add('highlight'));
    }

    function updateBoardContent(board) {
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;

            cell.textContent = board[row][col].input;
        })
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
        }
    });

    modal.addEventListener('click', e => {

        if (e.target.closest('.form__exit')) {
            modalForm.remove();
            gameModeModal.style.display = 'flex';

        }


        if (e.target.closest('.pvpBtn') && !document.querySelector('.modalForm')) {
            gameModeModal.style.display = 'none';

            modalForm.innerHTML = `
                    <button type="button" class="form__exit">X</button>
                    <h1 class="form__title">Enter names:</h1>
                    <div class="form-row">
                        <div class="form-field">
                            <label for="playerName1">Player 1 (X): </label>
                            <input type="text" id="playerName1" name="playerName1" placeholder="e.g. Bleu24" required>
                        </div>
                        <div class="form-field">
                            <label for="playerName2">Player 2 (O): </label>
                            <input type="text" id="playerName2" name="playerName2" placeholder="e.g. NoobMaster69" required>
                        </div>
                    </div>
                    <button type="submit">Play</button>
            `;
            modalForm.classList.add('modalForm');
            modalForm.dataset.type = 'PvP';
            modal.appendChild(modalForm);
        }

        if (e.target.closest('.pvaiBtn') && !document.querySelector('.modalForm')) {
            gameModeModal.style.display = 'none';

            modalForm.innerHTML = `
            <button type="button" class="form__exit">X</button>
            <h1 class="form__title">Set game configuration:</h1>
            <div class="form-row">
                <div class="form-field">
                    <label for="playerName">Player name: </label>
                    <input type="text" id="playerName" name="playerName" placeholder="e.g. Bleu24" required>
                </div>
            </div>
            <div class="form-row">
                <div class="teamBtns">
                    <label for="teamName">Set Team:</label>
                    <input type="hidden" id="teamName" name="teamName">
                    <button type="button" data-team="X">Team X</button>
                    <button type="button" data-team="O">Team O</button>
                </div>
            </div>
            <div class="form-row">
                <div class="aiDiffs">
                    <label for="aiDifficulty">Set AI Difficulty:</label>
                    <input type="hidden" id="aiDifficulty" name="aiDifficulty">
                    <button type="button" data-diff="easy">Easy</button>
                    <button type="button" data-diff="normal">Normal</button>
                    <button type="button" data-diff="hard">Hard</button>
                </div>
            </div>
            <button type="submit">Play</button>
    `;
            modalForm.classList.add('modalForm');
            modalForm.dataset.type = 'PvAI';
            modal.appendChild(modalForm);

            const teamInput = modalForm.querySelector('#teamName');
            const aiDiffInput = modalForm.querySelector('#aiDifficulty');
            const teamButtons = modalForm.querySelectorAll('.teamBtns button');
            const aiDiffButtons = modalForm.querySelectorAll('.aiDiffs button');

            teamButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    teamInput.value = btn.dataset.team;
                    // Optional: visually indicate selection
                    teamButtons.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                });
            });

            aiDiffButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    aiDiffInput.value = btn.dataset.diff;
                    // Optional: visually indicate selection
                    aiDiffButtons.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                });
            });
        }

    });

    modalForm.addEventListener('submit', e => {
        e.preventDefault();

        const gameForm = new FormData(modalForm);

        if (modalForm.dataset.type === 'PvAI') {
            const playerName = gameForm.get('playerName');
            const mode = modalForm.dataset.type;
            const team = gameForm.get('teamName');
            const aiDiffMode = gameForm.get('aiDifficulty');

            const p = createPlayer(playerName, team);

            //Check if player is created and registered in the pool
            if (playerPool.has(p.id)) {
                Game.start(playerPool, mode, aiDiffMode);

                const startEvent = new CustomEvent('gameStart', { detail: Game.getState() });
                app.dispatchEvent(startEvent);

                console.log("Game Initiated!");
            } else {
                console.log('Error occured!');
            }



        }

        if (modalForm.dataset.type === 'PvP') {
            const pN1 = gameForm.get("playerName1");
            const pN2 = gameForm.get("playerName2");
            const mode = modalForm.dataset.type;

            const player1 = createPlayer(pN1, 'X');
            const player2 = createPlayer(pN2, 'O');

            if (playerPool.has(player1.id) && playerPool.has(player2.id)) {
                Game.start(playerPool, mode);

                const startEvent = new CustomEvent('gameStart', { detail: Game.getState(), bubbles: true });
                app.dispatchEvent(startEvent);

                console.log("Game Initiated!");
            } else {
                console.log("Error occured!");
            }

        }
    });


    gamePanel.addEventListener('click', e => {
        const gameState = Game.getState();
        if (e.target.closest('.cell') && !gameState.hasStart) {
            if (!document.body.querySelector('.notification')) {

                notification.innerHTML = `
                <!-- Notif -->
                <div class="notification red">
                    <p class="notification__text">Create Player first</p>
                    <button class="notification__exit">X</button>
                </div>`;

                document.body.appendChild(notification);
                autoRemoveNotification(); // Automatically remove this notification after a timeout
            }
        } else if (e.target.closest('.cell') && gameState.hasStart) {
            const cell = e.target.closest('.cell');
            Game.applyMove(Number(cell.dataset.row), Number(cell.dataset.col));
        }

        if (e.target.closest('.newGame')) {
            modal.style.display = 'flex';
        }

    });

    notification.addEventListener('click', e => {
        if (e.target.closest('.notification__exit')) {
            notification.remove();
        }
    });

    // Automatically remove notifications after a timeout
    function autoRemoveNotification(timeout = 2500) {
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, timeout);
    }

    app.addEventListener('gameStart', e => {
        const gameState = Game.getState();

        modal.remove();

        status.dataset.status = 'Start';
        notification.innerHTML = `
                <!-- Notif -->
                <div class="notification green">
                    <p class="notification__text">Game Initialized!</p>
                    <button class="notification__exit">X</button>
                </div> `;

        document.body.appendChild(notification);

        turnLabel.textContent = `Turn: ${gameState.currentTurn}`;
        roundLabel.textContent = `Round: ${gameState.round + 1}`;
        modeLabel.textContent = `Mode: ${gameState.gameMode}`

        // Call autoRemoveNotification whenever a notification is added
        document.body.appendChild(notification);
        autoRemoveNotification();
    })

    // Public API
    return { updatePanelContent, updateBoardContent, highlightGridWinner };
})();
