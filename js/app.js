let currentColor = "#6C63FF";
let currentTool = "pen";

const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");

let gridSize = 16;
const canvasSize = 480;
let cellSize = canvasSize / gridSize;


// ===============================
// UNDO / REDO HISTORY
// ===============================

let undoStack = [];
let redoStack = [];


// ===============================
// CANVAS SETUP
// ===============================

canvas.width = canvasSize;
canvas.height = canvasSize;


// ===============================
// CREATE 2D GRID
// ===============================

let grid = [];

function createEmptyGrid() {

    grid = [];

    for (let row = 0; row < gridSize; row++) {

        grid[row] = [];

        for (let col = 0; col < gridSize; col++) {

            grid[row][col] = "#ffffff";
        }
    }
}

createEmptyGrid();


// ===============================
// HOVER VARIABLES
// ===============================

let hoverRow = -1;
let hoverCol = -1;


// ===============================
// COPY GRID
// ===============================

function copyGrid(sourceGrid) {

    return sourceGrid.map(function (row) {

        return [...row];

    });
}


// ===============================
// SAVE HISTORY
// ===============================

function saveHistory() {

    undoStack.push(copyGrid(grid));

    // New action removes redo history
    redoStack = [];
}


// ===============================
// DRAW THE GRID
// ===============================

function drawGrid() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < gridSize; row++) {

        for (let col = 0; col < gridSize; col++) {

            const x = col * cellSize;
            const y = row * cellSize;

            ctx.fillStyle = grid[row][col];

            ctx.fillRect(
                x,
                y,
                cellSize,
                cellSize
            );
        }
    }

    ctx.strokeStyle = "rgba(60, 60, 70, 0.45)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridSize; i++) {

        const position = Math.round(i * cellSize) + 0.5;

        ctx.beginPath();
        ctx.moveTo(position, 0);
        ctx.lineTo(position, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, position);
        ctx.lineTo(canvas.width, position);
        ctx.stroke();
    }

    drawHoverPreview();
}

drawGrid();


// ===============================
// HOVER PREVIEW
// ===============================

function drawHoverPreview() {

    if (hoverRow === -1 || hoverCol === -1) {

        return;
    }

    const x = hoverCol * cellSize;
    const y = hoverRow * cellSize;


    // Preview color
    ctx.fillStyle = currentColor;

    ctx.globalAlpha = 0.35;

    ctx.fillRect(
        x,
        y,
        cellSize,
        cellSize
    );


    // Reset transparency
    ctx.globalAlpha = 1;


    // Preview border
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 2;

    ctx.strokeRect(
        x,
        y,
        cellSize,
        cellSize
    );


    // Reset line width
    ctx.lineWidth = 1;
}


// ===============================
// GET CELL FROM MOUSE POSITION
// ===============================

function getCellFromMouse(event) {
    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left - canvas.clientLeft;
    const y = event.clientY - rect.top - canvas.clientTop;

    const width = rect.width - (canvas.clientLeft * 2);
    const height = rect.height - (canvas.clientTop * 2);

    const scaleX = canvas.width / width;
    const scaleY = canvas.height / height;

    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    const col = Math.floor(canvasX / cellSize);
    const row = Math.floor(canvasY / cellSize);

    return {
        row: row,
        col: col
    };
}

// ===============================
// DRAW A PIXEL
// ===============================

function drawPixel(event) {

    const cell = getCellFromMouse(event);

    const row = cell.row;
    const col = cell.col;


    // Prevent drawing outside grid
    if (
        row < 0 ||
        row >= gridSize ||
        col < 0 ||
        col >= gridSize
    ) {

        return;
    }


    // Pen
    if (currentTool === "pen") {

        grid[row][col] = currentColor;
    }


    // Eraser
    else if (currentTool === "eraser") {

        grid[row][col] = "#ffffff";
    }


    drawGrid();
}


// ===============================
// MOUSE DRAWING
// ===============================

let isDrawing = false;


// Mouse down
canvas.addEventListener("mousedown", function (event) {

    if (currentTool === "fill") {

        saveHistory();

        fillFromMouse(event);

        return;
    }


    // Save state before drawing
    saveHistory();

    isDrawing = true;

    drawPixel(event);
});


// Mouse move
canvas.addEventListener("mousemove", function (event) {

    const cell = getCellFromMouse(event);

    hoverRow = cell.row;
    hoverCol = cell.col;


    // Draw while dragging
    if (isDrawing && currentTool !== "fill") {

        drawPixel(event);
    }

    else {

        drawGrid();
    }
});


// Mouse up
canvas.addEventListener("mouseup", function () {

    isDrawing = false;
});


// Mouse leaves canvas
canvas.addEventListener("mouseleave", function () {

    isDrawing = false;

    hoverRow = -1;
    hoverCol = -1;

    drawGrid();
});


// ===============================
// FLOOD FILL
// ===============================

function fillFromMouse(event) {

    const cell = getCellFromMouse(event);

    const row = cell.row;
    const col = cell.col;


    // Prevent filling outside grid
    if (
        row < 0 ||
        row >= gridSize ||
        col < 0 ||
        col >= gridSize
    ) {

        return;
    }

    floodFill(row, col);
}


function floodFill(startRow, startCol) {

    const targetColor = grid[startRow][startCol];

    const replacementColor = currentColor;


    // Nothing to change
    if (targetColor === replacementColor) {

        // Remove the unnecessary history entry
        undoStack.pop();

        return;
    }


    // ===============================
    // VISITED ARRAY
    // ===============================

    let visited = [];

    for (let row = 0; row < gridSize; row++) {

        visited[row] = [];

        for (let col = 0; col < gridSize; col++) {

            visited[row][col] = false;
        }
    }


    // ===============================
    // STACK
    // ===============================

    let stack = [];

    stack.push([startRow, startCol]);


    // ===============================
    // FLOOD FILL PROCESS
    // ===============================

    while (stack.length > 0) {

        const [row, col] = stack.pop();


        // Boundary check
        if (
            row < 0 ||
            row >= gridSize ||
            col < 0 ||
            col >= gridSize
        ) {

            continue;
        }


        // Already visited
        if (visited[row][col]) {

            continue;
        }


        // Different color
        if (grid[row][col] !== targetColor) {

            continue;
        }


        // Mark visited
        visited[row][col] = true;


        // Change color
        grid[row][col] = replacementColor;


        // Up
        stack.push([row - 1, col]);

        // Down
        stack.push([row + 1, col]);

        // Left
        stack.push([row, col - 1]);

        // Right
        stack.push([row, col + 1]);
    }


    drawGrid();
}


// ===============================
// COLOR PALETTE
// ===============================

const colorButtons =
    document.querySelectorAll(".color");


colorButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        currentColor = button.dataset.color;

    });

});


// ===============================
// TOOL BUTTONS
// ===============================

const toolButtons =
    document.querySelectorAll(".tool");


toolButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        currentTool = button.dataset.tool;


        // Remove active state
        toolButtons.forEach(function (btn) {

            btn.classList.remove("active");

        });


        // Activate selected tool
        button.classList.add("active");


        drawGrid();
    });

});


// ===============================
// CUSTOM COLOR PICKER
// ===============================

const customColor =
    document.getElementById("customColor");


customColor.addEventListener("input", function () {

    currentColor = customColor.value;

});


// ===============================
// GRID SIZE CONTROL
// ===============================

const gridSizeSelect =
    document.getElementById("gridSize");


gridSizeSelect.addEventListener("change", function () {

    gridSize = Number(gridSizeSelect.value);

    cellSize = canvasSize / gridSize;


    // Create new empty grid
    createEmptyGrid();


    // Reset history
    undoStack = [];
    redoStack = [];


    // Reset hover
    hoverRow = -1;
    hoverCol = -1;


    drawGrid();

});


// ===============================
// CLEAR CANVAS
// ===============================

const clearButton =
    document.getElementById("clearCanvas");


clearButton.addEventListener("click", function () {

    const confirmClear = confirm(
        "Are you sure you want to clear the canvas?"
    );


    if (!confirmClear) {

        return;
    }


    // Save current state
    saveHistory();


    // Clear grid
    for (let row = 0; row < gridSize; row++) {

        for (let col = 0; col < gridSize; col++) {

            grid[row][col] = "#ffffff";
        }
    }


    drawGrid();

});


// ===============================
// UNDO
// ===============================

const undoButton =
    document.getElementById("undoButton");


undoButton.addEventListener("click", function () {

    if (undoStack.length === 0) {

        return;
    }


    // Save current state for redo
    redoStack.push(copyGrid(grid));


    // Restore previous state
    grid = undoStack.pop();


    drawGrid();

});


// ===============================
// REDO
// ===============================

const redoButton =
    document.getElementById("redoButton");


redoButton.addEventListener("click", function () {

    if (redoStack.length === 0) {

        return;
    }


    // Save current state for undo
    undoStack.push(copyGrid(grid));


    // Restore redo state
    grid = redoStack.pop();


    drawGrid();

});


// ===============================
// EXPORT PNG
// ===============================

const exportButton =
    document.getElementById("exportPNG");


exportButton.addEventListener("click", function () {

    // Create separate export canvas
    const exportCanvas =
        document.createElement("canvas");

    exportCanvas.width = 512;
    exportCanvas.height = 512;

    const exportCtx =
        exportCanvas.getContext("2d");


    // Calculate exported cell size
    const exportCellSize = 512 / gridSize;


    // Draw artwork without grid lines
    for (let row = 0; row < gridSize; row++) {

        for (let col = 0; col < gridSize; col++) {

            exportCtx.fillStyle = grid[row][col];

            exportCtx.fillRect(
                col * exportCellSize,
                row * exportCellSize,
                exportCellSize,
                exportCellSize
            );
        }
    }


    // Create download link
    const link = document.createElement("a");

    link.download = "pixel-art.png";

    link.href =
        exportCanvas.toDataURL("image/png");

    link.click();

});
// ===============================
// SAVE / LOAD
// ===============================

document.getElementById("saveButton").addEventListener("click", function () {
    localStorage.setItem("pixelForgeGrid", JSON.stringify(grid));
    localStorage.setItem("pixelForgeGridSize", gridSize);

    alert("Artwork saved!");
});
document.getElementById("loadButton").addEventListener("click", function () {
    const savedGrid = localStorage.getItem("pixelForgeGrid");
    const savedGridSize = localStorage.getItem("pixelForgeGridSize");

    if (!savedGrid) {
        alert("No saved artwork found!");
        return;
    }

    grid = JSON.parse(savedGrid);
    gridSize = Number(savedGridSize);
    cellSize = canvasSize / gridSize;

    drawGrid();

    alert("Artwork loaded!");
});
// ===============================
// TEMPLATES
// ===============================

document.getElementById("applyTemplate").addEventListener("click", function () {
    const template = document.getElementById("templateSelect").value;

    if (template === "") {
        alert("Please choose a template!");
        return;
    }

    saveHistory();

    // Start with a blank grid
    createEmptyGrid();

    if (template === "heart") {
        drawHeartTemplate();
    } else if (template === "smiley") {
        drawSmileyTemplate();
    } else if (template === "flower") {
        drawFlowerTemplate();
    } else if (template === "house") {
       drawHouseTemplate();
    }

    drawGrid();
});
// ===============================
// TEMPLATE DESIGNS
// ===============================

function drawHeartTemplate() {
    const pattern = [
        "01100110",
        "11111111",
        "11111111",
        "01111110",
        "00111100",
        "00011000"
    ];

    const scale = gridSize / 16;

    const startRow = Math.floor(gridSize / 2) - (3 * scale);
    const startCol = Math.floor(gridSize / 2) - (4 * scale);

    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {

            if (pattern[row][col] === "1") {

                for (let r = 0; r < scale; r++) {
                    for (let c = 0; c < scale; c++) {
                        grid[startRow + (row * scale) + r]
                            [startCol + (col * scale) + c] = "#FF4D6D";
                    }
                }
            }
        }
    }
}

function drawSmileyTemplate() {
    const yellow = "#FFD93D";
    const black = "#222222";

    const scale = gridSize / 16;

    function paintPixel(row, col, color) {
        for (let r = 0; r < scale; r++) {
            for (let c = 0; c < scale; c++) {
                grid[row * scale + r][col * scale + c] = color;
            }
        }
    }

    // Face
    for (let row = 2; row <= 13; row++) {
        for (let col = 2; col <= 13; col++) {
            const dx = col - 7.5;
            const dy = row - 7.5;

            if (dx * dx + dy * dy <= 5.5 * 5.5) {
                paintPixel(row, col, yellow);
            }
        }
    }

    // Eyes
    paintPixel(5, 5, black);
    paintPixel(5, 6, black);
    paintPixel(5, 9, black);
    paintPixel(5, 10, black);

    // Smile
    paintPixel(9, 5, black);
    paintPixel(10, 6, black);
    paintPixel(11, 7, black);
    paintPixel(11, 8, black);
    paintPixel(11, 9, black);
    paintPixel(10, 10, black);
    paintPixel(9, 11, black);
}


function drawFlowerTemplate() {
    const pink = "#FF69B4";
    const yellow = "#FFD93D";
    const green = "#4CAF50";

    const scale = gridSize / 16;

    function paintPixel(row, col, color) {
        for (let r = 0; r < scale; r++) {
            for (let c = 0; c < scale; c++) {
                grid[row * scale + r][col * scale + c] = color;
            }
        }
    }

    // Flower petals
    const petals = [
        [3, 7], [4, 6], [4, 8],
        [5, 5], [5, 9],
        [6, 6], [6, 8],
        [7, 7]
    ];

    petals.forEach(([row, col]) => {
        paintPixel(row, col, pink);
    });

    // Make petals thicker
    paintPixel(3, 6, pink);
    paintPixel(3, 8, pink);
    paintPixel(4, 5, pink);
    paintPixel(4, 9, pink);
    paintPixel(5, 4, pink);
    paintPixel(5, 10, pink);

    // Flower center
    paintPixel(5, 6, yellow);
    paintPixel(5, 7, yellow);
    paintPixel(5, 8, yellow);
    paintPixel(6, 6, yellow);
    paintPixel(6, 7, yellow);
    paintPixel(6, 8, yellow);

    // Stem
    for (let row = 7; row <= 13; row++) {
        paintPixel(row, 7, green);
    }

    // Leaves
    paintPixel(9, 6, green);
    paintPixel(10, 5, green);
    paintPixel(10, 6, green);

    paintPixel(11, 8, green);
    paintPixel(12, 9, green);
    paintPixel(11, 9, green);
}


function drawHouseTemplate() {
    const roof = "#E63946";
    const roofHighlight = "#FFF3D6";
    const roofDark = "#B71C1C";
    const wall = "#FFF3D6";
    const window = "#42A5F5";
    const door = "#8B5E3C";
    const foundation = "#5D4037";

    const scale = gridSize / 16;

    function paintPixel(row, col, color) {
        for (let r = 0; r < scale; r++) {
            for (let c = 0; c < scale; c++) {
                grid[row * scale + r][col * scale + c] = color;
            }
        }
    }

    function paintPixels(pixels, color) {
        pixels.forEach(([row, col]) => {
            paintPixel(row, col, color);
        });
    }

    // Roof
    const roofPixels = [
        [3, 6], [3, 7], [3, 8], [3, 9],

        [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [4, 11],

        [5, 3], [5, 4], [5, 5], [5, 6],
        [5, 7], [5, 8], [5, 9], [5, 10],
        [5, 11], [5, 12],

        [6, 2], [6, 3], [6, 4], [6, 5],
        [6, 6], [6, 7], [6, 8], [6, 9],
        [6, 10], [6, 11], [6, 12], [6, 13],

        [7, 2], [7, 3], [7, 4], [7, 5],
        [7, 6], [7, 7], [7, 8], [7, 9],
        [7, 10], [7, 11], [7, 12], [7, 13]
    ];

    paintPixels(roofPixels, roof);

    // Roof highlights
    const highlightPixels = [
        [4, 6],
        [5, 5],
        [5, 10],
        [6, 4],
        [6, 11]
    ];

    paintPixels(highlightPixels, roofHighlight);

    // Dark lower edge of roof
    for (let col = 3; col <= 12; col++) {
        paintPixel(7, col, roofDark);
    }

    // House walls
    for (let row = 8; row <= 13; row++) {
        for (let col = 4; col <= 11; col++) {
            paintPixel(row, col, wall);
        }
    }

    // Left window - 2 × 2
    paintPixel(9, 5, window);
    paintPixel(9, 6, window);
    paintPixel(10, 5, window);
    paintPixel(10, 6, window);

    // Right window - 2 × 2
    paintPixel(9, 9, window);
    paintPixel(9, 10, window);
    paintPixel(10, 9, window);
    paintPixel(10, 10, window);

    // Center door - exactly 2 × 4
    for (let row = 10; row <= 13; row++) {
        paintPixel(row, 7, door);
        paintPixel(row, 8, door);
    }

    // Foundation
    for (let col = 4; col <= 11; col++) {
        paintPixel(14, col, foundation);
    }
}
// ===============================
// KEYBOARD SHORTCUTS
// ===============================

document.addEventListener("keydown", function (event) {

    if (event.key.toLowerCase() === "p") {
        currentTool = "pen";
    }

    else if (event.key.toLowerCase() === "e") {
        currentTool = "eraser";
    }

    else if (event.key.toLowerCase() === "f") {
        currentTool = "fill";
    }

    else if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoButton.click();
    }

    else if (
        event.ctrlKey &&
        (event.key.toLowerCase() === "y" ||
         (event.shiftKey && event.key.toLowerCase() === "z"))
    ) {
        event.preventDefault();
        redoButton.click();
    }

    toolButtons.forEach(function (button) {
        button.classList.remove("active");

        if (button.dataset.tool === currentTool) {
            button.classList.add("active");
        }
    });

    drawGrid();
});