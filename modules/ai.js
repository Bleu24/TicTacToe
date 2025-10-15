import { Gameboard } from './gameBoard';

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

export { AI };