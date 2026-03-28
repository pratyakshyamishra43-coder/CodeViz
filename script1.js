// =======================
// CodeViz Ultimate Engine
// =======================

// Select elements
const runButton = document.querySelector(".run-btn");
const statusBar = document.querySelector(".status-bar");
const consolePanel = document.querySelector(".console");
const codeInput = document.querySelector(".code-input");

const controlButtons = document.querySelectorAll(".control-btn");
const prevBtn = controlButtons[0];
const playBtn = controlButtons[1];
const nextBtn = controlButtons[2];

const variablesPanel = document.querySelector(".variables");
const callStackPanel = document.querySelector(".call-stack");

// Global state
let steps = [];
let currentStep = 0;
let lines = [];
let variables = {};
let callStack = [];
let playInterval = null;

// Event listeners
runButton.addEventListener("click", runCode);
nextBtn.addEventListener("click", nextStep);
prevBtn.addEventListener("click", prevStep);
playBtn.addEventListener("click", playSteps);

// =======================
// RUN CODE
// =======================
function runCode() {
    statusBar.textContent = "Running code...";

    try {
        let code = codeInput.value;

        // Reset
        steps = [];
        currentStep = 0;
        variables = {};
        callStack = [];
        clearInterval(playInterval);
        playInterval = null;

        // Convert let to var
        code = code.replace(/let /g, "var ");

        lines = code.split("\n");

        let output = "";
        const originalLog = console.log;

        console.log = function(msg) {
            output += msg + "\n";
        };

        let i = 0;

        while (i < lines.length) {
            let line = lines[i].trim();

            try {
                // Handle blocks (if, for, function, while)
                if (line.includes("{")) {
                    let blockCode = line + "\n";
                    i++;

                    while (i < lines.length && !lines[i].includes("}")) {
                        blockCode += lines[i] + "\n";
                        i++;
                    }

                    blockCode += lines[i]; // add closing }
                    eval(blockCode);

                    steps.push({
                        line: i,
                        code: blockCode,
                        vars: { ...variables },
                        stack: [...callStack]
                    });
                } else {
                    eval(line);

                    // Track variables
                    if (line.includes("=")) {
                        let varName = line.split("=")[0].replace("var", "").trim();
                        try {
                            variables[varName] = eval(varName);
                        } catch {}
                    }

                    steps.push({
                        line: i,
                        code: line,
                        vars: { ...variables },
                        stack: [...callStack]
                    });
                }

            } catch (e) {
                output += "Error on line " + (i + 1) + "\n";
            }

            i++;
        }

        console.log = originalLog;

        consolePanel.innerHTML = "<pre>" + output + "</pre>";

        updateStepDisplay();

        statusBar.textContent = "Execution finished.";

    } catch (error) {
        statusBar.textContent = "Error: " + error.message;
    }
}

// =======================
// UPDATE DISPLAY
// =======================
function updateStepDisplay() {
    const stepCount = document.querySelector(".step-count");

    if (steps.length === 0) {
        stepCount.textContent = "Step 0 / 0";
        return;
    }

    stepCount.textContent = `Step ${currentStep + 1} / ${steps.length}`;

    updateVariablesPanel();
    updateCallStackPanel();
    highlightCurrentLine();
}

// =======================
// VARIABLES PANEL
// =======================
function updateVariablesPanel() {
    if (!variablesPanel) return;

    let vars = steps[currentStep].vars;

    let html = "<h3>Variables</h3>";

    for (let key in vars) {
        html += `<p>${key} : ${vars[key]}</p>`;
    }

    variablesPanel.innerHTML = html;
}

// =======================
// CALL STACK PANEL
// =======================
function updateCallStackPanel() {
    if (!callStackPanel) return;

    let stack = steps[currentStep].stack;

    let html = "<h3>Call Stack</h3>";

    for (let i = stack.length - 1; i >= 0; i--) {
        html += `<p>${stack[i]}()</p>`;
    }

    callStackPanel.innerHTML = html;
}

// =======================
// LINE HIGHLIGHT
// =======================
function highlightCurrentLine() {
    let codeLines = codeInput.value.split("\n");

    let highlighted = codeLines.map((line, i) => {
        if (steps.length > 0 && i === steps[currentStep].line) {
            return ">> " + line.replace(">> ", "");
        }
        return line.replace(">> ", "");
    });

    codeInput.value = highlighted.join("\n");
}

// =======================
// NEXT STEP
// =======================
function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        updateStepDisplay();
    }
}

// =======================
// PREVIOUS STEP
// =======================
function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        updateStepDisplay();
    }
}

// =======================
// PLAY / PAUSE
// =======================
function playSteps() {
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
        return;
    }

    playInterval = setInterval(() => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            updateStepDisplay();
        } else {
            clearInterval(playInterval);
            playInterval = null;
        }
    }, 800);
}