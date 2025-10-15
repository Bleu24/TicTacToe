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

export { Gameboard };