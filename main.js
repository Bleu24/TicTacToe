import { Gameboard } from "./modules/gameBoard.js";
import { Game } from "./modules/game.js";
import { playerPool } from "./modules/playerPool.ds.js";
import { createPlayer } from "./modules/game.js";

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

    // Reset handler: clears game state and UI
    document.querySelector('.reset').addEventListener('click', () => {
        Game.reset();
        // Clear board UI
        UI.updateBoardContent(Gameboard.getBoard());
        // Reset panel content
        turnLabel.textContent = 'Turn:';
        roundLabel.textContent = 'Round:';
        modeLabel.textContent = 'Mode:';
        status.dataset.status = 'notStart';
        // Reset scores
        document.querySelector('.card.x .score').textContent = '0';
        document.querySelector('.card.o .score').textContent = '0';
        document.querySelector('.card.draw .score').textContent = '0';
        // Clear move history UI
        const historyFalse = document.querySelector('.history[data-history="false"]');
        const historyTrue = document.querySelector('.history[data-history="true"]');
        if (historyTrue) {
            historyTrue.innerHTML = '';
            historyTrue.style.display = 'none';
        }
        if (historyFalse) {
            historyFalse.innerHTML = 'No History Yet';
            historyFalse.style.display = 'flex';
        }
    });


    function updatePanelContent() {
        const state = Game.getState();
        const moveHistory = Game.getMoveHistory();
        const scoreX = document.querySelector('.card.x .score');
        const scoreDraw = document.querySelector('.card.draw .score');
        const scoreO = document.querySelector('.card.o .score');
        if (scoreX) scoreX.textContent = state.scores.X;
        if (scoreO) scoreO.textContent = state.scores.O;
        if (scoreDraw) scoreDraw.textContent = state.scores.draw;
        turnLabel.textContent = `Turn: ${state.currentTurn}`;
        roundLabel.textContent = `Round: ${state.round + 1}`;
        modeLabel.textContent = `Mode: ${state.gameMode}`;
        if (state.gameMode === 'PvAI' && state.aiDiff) {
            modeLabel.textContent += ` (${state.aiDiff})`;
        }
        // Render cumulative match history (rounds + moves)
        const allMatchHistory = Game.getMatchHistory ? Game.getMatchHistory() : [];
        const trueHistory = document.querySelector('.history[data-history="true"]');
        const falseHistory = document.querySelector('.history[data-history="false"]');

        // Clear current true history contents
        if (trueHistory) {
            trueHistory.innerHTML = '';
        }

        if ((!allMatchHistory || allMatchHistory.length === 0) && (!moveHistory || moveHistory.length === 0)) {
            // show placeholder
            if (falseHistory) {
                falseHistory.style.display = 'flex';
                falseHistory.innerHTML = 'No History Yet';
            }
            if (trueHistory) trueHistory.style.display = 'none';
            return;
        }

        // hide placeholder and show true history
        if (falseHistory) falseHistory.style.display = 'none';
        if (trueHistory) {
            trueHistory.style.display = 'block';

            // render previous rounds
            allMatchHistory.forEach(roundEntry => {
                const roundHeader = document.createElement('div');
                roundHeader.classList.add('historyItem', 'historyHeader');
                // simplified header markup for centered title
                roundHeader.innerHTML = `<div class="historyHeader__title">Round ${roundEntry.round} — Winner: ${roundEntry.winner || 'N/A'}</div>`;
                trueHistory.appendChild(roundHeader);

                // render moves for this round
                roundEntry.moves.forEach((m, idx) => {
                    const moveEl = document.createElement('div');
                    moveEl.classList.add('historyItem');
                    moveEl.innerHTML = `<div class="historyItem__number">${idx + 1}</div>
                                    <div class="historyItem__name">${m.name}</div>
                                    <div class="historyItem__move">${m.currentTurn}</div>
                                    <div class="historyItem__coords">(${m.posX + 1}, ${m.posY + 1})</div>`;
                    trueHistory.appendChild(moveEl);
                });
            });

            // render current round moves (if any)
            if (moveHistory && moveHistory.length) {
                const currentHeader = document.createElement('div');
                currentHeader.classList.add('historyItem', 'historyHeader');
                currentHeader.innerHTML = `<div class="historyHeader__title">Round ${state.round + 1} (current)</div>`;
                trueHistory.appendChild(currentHeader);

                moveHistory.forEach((m, idx) => {
                    const moveEl = document.createElement('div');
                    moveEl.classList.add('historyItem');
                    moveEl.innerHTML = `<div class="historyItem__number">${idx + 1}</div>
                                    <div class="historyItem__name">${m.name}</div>
                                    <div class="historyItem__move">${m.currentTurn}</div>
                                    <div class="historyItem__coords">(${m.posX + 1}, ${m.posY + 1})</div>`;
                    trueHistory.appendChild(moveEl);
                });
            }
        }


    }

    function removeHighlight(winningCells) {
        const winningCellsList = Array.from(cells).filter(el => {
            return Object.values(winningCells).some(winningCell => {
                return Number(el.dataset.row) === winningCell.row && Number(el.dataset.col) === winningCell.col;
            });
        });

        winningCellsList.forEach(cell => cell.classList.remove('highlight'));
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
                    <div class="form-row">
                        <div class="form-field">
                            <label for=rounds">How many rounds?: </label>
                            <input type="number" id="rounds" name="rounds" placeholder="e.g. 3" min="1" required>
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
            <div class="form-row">
                <div class="form-field">
                    <label for=rounds">How many rounds?: </label>
                    <input type="number" id="rounds" name="rounds" placeholder="e.g. 3" min="1" required>
                </div>
            </div>
            <button type="submit">Play</button>
    `;
            modalForm.classList.add('modalForm');
            modalForm.classList.add('pvai');
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

        // simple validation helper
        const showFormError = (msg) => {
            let err = modalForm.querySelector('.form-error');
            if (!err) {
                err = document.createElement('div');
                err.classList.add('form-error');
                modalForm.prepend(err);
            }
            err.textContent = msg;
        };
        const clearFormError = () => {
            const err = modalForm.querySelector('.form-error');
            if (err) err.remove();
        };

        if (modalForm.dataset.type === 'PvAI') {
            const playerName = gameForm.get('playerName');
            const mode = modalForm.dataset.type;
            const team = gameForm.get('teamName');
            const aiDiffMode = gameForm.get('aiDifficulty');
            const rounds = Number(gameForm.get('rounds')) || 1;

            // validation
            if (!playerName || playerName.trim() === '') {
                showFormError('Player name is required');
                return;
            }
            if (!team || (team !== 'X' && team !== 'O')) {
                showFormError('Please select a team');
                return;
            }
            clearFormError();

            const p = createPlayer(playerName, team);

            //Check if player is created and registered in the pool
            if (playerPool.has(p.id)) {
                Game.start(playerPool, mode, aiDiffMode, rounds);

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
            const rounds = Number(gameForm.get('rounds')) || 1;

            // validation
            if (!pN1 || pN1.trim() === '' || !pN2 || pN2.trim() === '') {
                showFormError('Both player names are required');
                return;
            }
            if (pN1.trim() === pN2.trim()) {
                showFormError('Player names must be different');
                return;
            }
            clearFormError();

            const player1 = createPlayer(pN1, 'X');
            const player2 = createPlayer(pN2, 'O');

            if (playerPool.has(player1.id) && playerPool.has(player2.id)) {
                Game.start(playerPool, mode, rounds);

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


    function autoRemoveNotification(timeout = 2500) {
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, timeout);
    }

    app.addEventListener('gameStart', e => {
        const gameState = Game.getState();

        modal.style.display = 'none';

        if (gameModeModal) gameModeModal.style.display = 'flex';

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
        modeLabel.textContent = `Mode: ${gameState.gameMode}`;
        if (gameState.gameMode === 'PvAI' && gameState.aiDiff) {
            modeLabel.textContent += ` (${gameState.aiDiff})`;
        }

        // Call autoRemoveNotification whenever a notification is added
        document.body.appendChild(notification);
        autoRemoveNotification();
    })

    // Show match end modal with summary and actions
    function showMatchEndModal({ winner, scores }) {
        // winner may be the string 'tie' or an object { team, winningCells }
        let displayWinner = 'N/A';
        let winningCells = null;
        if (winner === 'tie') {
            displayWinner = 'Tie';
        } else if (winner && typeof winner === 'object') {
            displayWinner = winner.team || 'N/A';
            winningCells = winner.winningCells || null;
        } else if (typeof winner === 'string') {
            displayWinner = winner;
        }
        // create modal overlay using existing bg-modal styles, add end-modal for tweaks
        const endModal = document.createElement('div');
        endModal.classList.add('bg-modal', 'end-modal');
        endModal.setAttribute('role', 'dialog');
        endModal.setAttribute('aria-modal', 'true');
        endModal.style.display = 'flex';

        endModal.innerHTML = `
            <div class="modal" aria-labelledby="end-title" tabindex="-1">
                <div class="gameMode">
                    <h2 id="end-title">Match Finished</h2>
                    <p>Winner: <strong>${displayWinner}</strong></p>
                    <p>Scores - X: ${scores.X} | Draw: ${scores.draw} | O: ${scores.O}</p>
                    <div class="btns" style="display:flex; gap:8px; margin-top:12px; justify-content:center;">
                        <button class="rematchBtn">Rematch</button>
                        <button class="newMatchBtn">New Match</button>
                        <button class="closeMatchBtn">Close</button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(endModal);

        // focus handling: move focus to modal
        const firstFocusable = endModal.querySelector('button');
        if (firstFocusable) firstFocusable.focus();

        // click handlers
        endModal.addEventListener('click', (ev) => {
            if (ev.target.closest('.closeMatchBtn')) {
                endModal.remove();
            }
            if (ev.target.closest('.newMatchBtn')) {
                // close end modal and re-open the main game start modal (game mode selection)
                if (typeof winningCells !== 'undefined' && winningCells && UI && UI.removeHighlight) {
                    UI.removeHighlight(winningCells);
                }
                // ensure any leftover modal form is removed
                const existingForm = document.querySelector('.modalForm');
                if (existingForm) existingForm.remove();

                endModal.remove();
                // show the original modal to let user pick mode again
                modal.style.display = 'flex';
                if (gameModeModal) gameModeModal.style.display = 'flex';
            }
            if (ev.target.closest('.rematchBtn')) {
                try {
                    if (typeof winningCells !== 'undefined' && winningCells && UI && UI.removeHighlight) {
                        UI.removeHighlight(winningCells);
                    }
                    if (typeof Game !== 'undefined' && Game.rematch) {
                        Game.rematch();
                        UI.updateBoardContent(Gameboard.getBoard());
                        UI.updatePanelContent();
                    } else {
                        // fallback
                        Game.reset();
                        UI.updateBoardContent(Gameboard.getBoard());
                        UI.updatePanelContent();
                    }
                    endModal.remove();
                } catch (err) {
                    location.reload();
                }
            }
        });

        // allow Esc to close
        const onKey = (e) => {
            if (e.key === 'Escape') {
                endModal.remove();
                document.removeEventListener('keydown', onKey);
            }
        };

        document.addEventListener('keydown', onKey);
    }
    // Public API
    return { updatePanelContent, updateBoardContent, highlightGridWinner, removeHighlight, showMatchEndModal };
})();

export { UI };