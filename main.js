window.onload = () => {

    // ----- ELEMENTS AND BASIC SETUP -----
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const upgradeMenu = document.getElementById("upgradeMenu");
    if (upgradeMenu) {
        upgradeMenu.classList.remove("hide");
    }

    let totalScore = 0;
    let scoreMultiplier = 1;
    let ballRadius = 16;

    const scoreEl = document.getElementById("score");
    const multiplierEl = document.getElementById("multiplier");
    const prestigeBtn = document.getElementById("prestigeBtn");
    const progressFill = document.getElementById("prestigeFill");

    const addBallBtn = document.getElementById("addBallBtn");
    const tooltip = addBallBtn.querySelector(".tooltip");

    const upgradeBtn2 = document.getElementById("slotUpgradeBtn");
    const upgradeCostEl = upgradeBtn2.querySelector(".tooltip");

    let slotUpgradeCost = 1;
    let addBallCost = 2000;

    const horizontalSpacing = 50;
    const verticalSpacing = 60;
    const rows = 10;
    const colsStart = 5;
    const gravity = 0.2;
    const friction = 0.995;
    const delta = 0.6;

    const pegs = [];
    const balls = [];
    const slots = [];
    const walls = [];



    // ----- CANVAS RESIZE -----
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = window.innerHeight;

        pegs.length = 0;
        slots.length = 0;
        walls.length = 0;

        makePegs();
        buildWalls();
        buildSlots();
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();



    // ----- PEG GENERATION -----
    function makePegs() {
        const boardWidth = horizontalSpacing * (colsStart + rows - 2);
        const startX = (canvas.width - boardWidth) / 2;

        for (let row = 0; row < rows; row++) {
            const cols = colsStart + row;
            const offset = (boardWidth - horizontalSpacing * (cols - 1)) / 2;

            for (let col = 0; col < cols; col++) {
                pegs.push({
                    x: startX + offset + col * horizontalSpacing,
                    y: 150 + row * verticalSpacing,
                    r: 6
                });
            }
        }
    }



    // ----- WALLS -----
    function buildWalls() {
        const topRow = pegs.slice(0, colsStart);
        const bottomRow = pegs.slice(-(colsStart + rows - 1));

        walls.push({
            x1: topRow[0].x,
            y1: topRow[0].y,
            x2: bottomRow[0].x,
            y2: bottomRow[0].y
        });

        walls.push({
            x1: topRow[topRow.length - 1].x,
            y1: topRow[topRow.length - 1].y,
            x2: bottomRow[bottomRow.length - 1].x,
            y2: bottomRow[bottomRow.length - 1].y
        });
    }



    // ----- BALL CLASS -----
    class Ball {
        constructor(x, y, r) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = 1 + Math.random() * 2;
        }

        update() {
            this.vy += gravity * delta;
            this.x += this.vx * delta;
            this.y += this.vy * delta;

            // peg collisions
            for (let p of pegs) {
                const dx = this.x - p.x;
                const dy = this.y - p.y;
                const dist = Math.hypot(dx, dy);

                if (dist < this.r + p.r) {
                    const overlap = this.r + p.r - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    this.x += nx * overlap;
                    this.y += ny * overlap;

                    const dot = this.vx * nx + this.vy * ny;
                    this.vx -= dot * nx * 1.05;
                    this.vy -= dot * ny * 1.05;

                    this.vx *= friction;
                    this.vy *= friction;
                }
            }

            // wall collisions
            for (let w of walls) {
                collideWall(this, w);
            }

            checkScore(this);
        }

        draw() {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }



    // ----- SLOTS -----
    function buildSlots() {
        const bottomRow = pegs.slice(-(colsStart + rows - 1));
        const slotY = bottomRow[0].y + verticalSpacing / 2;
        const numSlots = bottomRow.length - 1;

        const mid = Math.floor(numSlots / 2);
        const stepValues = [500, 1000, 1500, 2500, 3500, 4500, 5000];

        for (let i = 0; i < numSlots; i++) {
            const s = bottomRow[i];
            const e = bottomRow[i + 1];

            const dist = Math.abs(i - mid);
            const points = stepValues[dist] || 500;

            const t = dist / mid;
            const r = 255;
            const g = Math.floor(255 * (1 - t));

            slots.push({
                x: s.x,
                width: e.x - s.x,
                points: points,
                offsetY: 0,
                color: `rgb(${r},${g},0)`
            });
        }
    }



    // ----- DRAWING -----
    function drawPegs() {
        ctx.fillStyle = "white";

        for (let p of pegs) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawWalls() {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;

        for (let w of walls) {
            ctx.beginPath();
            ctx.moveTo(w.x1, w.y1);
            ctx.lineTo(w.x2, w.y2);
            ctx.stroke();
        }
    }

    function drawSlots() {
        const bottomRow = pegs.slice(-(colsStart + rows - 1));
        const slotY = bottomRow[0].y + verticalSpacing / 2;

        for (let s of slots) {
            ctx.fillStyle = s.color;
            ctx.fillRect(s.x, slotY + s.offsetY, s.width, 20);

            ctx.fillStyle = "black";
            ctx.fillText(s.points, s.x + s.width / 2 - 10, slotY + s.offsetY + 14);

            s.offsetY *= 0.8;
        }
    }



    // ----- WALL COLLISION -----
    function collideWall(ball, wall) {
        const lx = wall.x2 - wall.x1;
        const ly = wall.y2 - wall.y1;

        const px = ball.x - wall.x1;
        const py = ball.y - wall.y1;

        const len = lx * lx + ly * ly;

        const t = Math.max(0, Math.min(1, (px * lx + py * ly) / len));

        const cx = wall.x1 + t * lx;
        const cy = wall.y1 + t * ly;

        const dx = ball.x - cx;
        const dy = ball.y - cy;

        const dist = Math.hypot(dx, dy);

        if (dist < ball.r) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = ball.r - dist;
            ball.x += nx * overlap;
            ball.y += ny * overlap;

            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= dot * nx * 1.05;
            ball.vy -= dot * ny * 1.05;

            ball.vx *= friction;
            ball.vy *= friction;
        }
    }



    // ----- SCORING -----
    function checkScore(ball) {
        const bottomRow = pegs.slice(-(colsStart + rows - 1));
        const slotY = bottomRow[0].y + verticalSpacing / 2;

        if (ball.y + ball.r >= slotY) {

            let best = null;
            let closest = Infinity;

            for (let s of slots) {
                const c = s.x + s.width / 2;
                const d = Math.abs(ball.x - c);

                if (d < closest) {
                    closest = d;
                    best = s;
                }
            }

            if (best !== null) {
                best.offsetY = -5;

                totalScore += Math.round(best.points * scoreMultiplier);
                scoreEl.innerText = "Score: " + totalScore;

                if (totalScore >= 100000) {
                    prestigeBtn.style.display = "block";
                }

                progressFill.style.width = (Math.min(totalScore / 100000, 1) * 100) + "%";

                ball.x = canvas.width / 2;
                ball.y = 50;
                ball.vx = (Math.random() - 0.5) * 6;
                ball.vy = 1 + Math.random() * 2;
            }
        }
    }



    // ----- BUTTONS -----
    addBallBtn.addEventListener("click", () => {
        if (totalScore >= addBallCost) {

            totalScore -= addBallCost;
            scoreEl.innerText = "Score: " + totalScore;

            balls.push(new Ball(canvas.width / 2, 50, ballRadius));

            addBallCost = Math.floor(addBallCost * 1.6);
            tooltip.innerText = "Cost: " + addBallCost;
        }
    });

    upgradeBtn2.addEventListener("click", () => {
        if (scoreMultiplier > slotUpgradeCost) {

            for (let s of slots) {
                s.points *= 2;
            }

            scoreMultiplier -= slotUpgradeCost;
            slotUpgradeCost *= 2;

            upgradeCostEl.innerText = "Cost: " + slotUpgradeCost;
            multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;
        }
    });

    prestigeBtn.addEventListener("click", () => {
        scoreMultiplier += 0.5;
        multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;

        totalScore = 0;
        scoreEl.innerText = "Score: " + totalScore;

        progressFill.style.width = "0%";

        balls.length = 0;
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));

        addBallCost = 2000;
        tooltip.innerText = "Cost: " + addBallCost;

        prestigeBtn.style.display = "none";
    });



    // ----- SAVE LOAD -----
    const save = JSON.parse(localStorage.getItem("plinkoSave") || "{}");

    if (save.score !== undefined) {
        totalScore = save.score;
        scoreEl.innerText = "Score: " + totalScore;
    }

    if (save.multiplier !== undefined) {
        scoreMultiplier = save.multiplier;
        multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;
    }

    if (save.addBallCost !== undefined) {
        addBallCost = save.addBallCost;
        tooltip.innerText = "Cost: " + addBallCost;
    }

    if (save.slotUpgradeCost !== undefined) {
        slotUpgradeCost = save.slotUpgradeCost;
        upgradeCostEl.innerText = "Cost: " + slotUpgradeCost;
    }

    if (save.balls !== undefined) {
        balls.length = 0;

        for (let i = 0; i < save.balls; i++) {
            balls.push(new Ball(canvas.width / 2, 50, ballRadius));
        }
    }

    if (balls.length === 0) {
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));
    }



    // ----- MAIN LOOP -----
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawPegs();
        drawWalls();
        drawSlots();

        for (let b of balls) {
            b.update();
            b.draw();
        }

        requestAnimationFrame(loop);
    }

    loop();



    // ----- SAVE POPUP -----
    const savePopup = document.getElementById("savePopup");
    const savePopupMsg = savePopup.querySelector(".msg");
    const savePopupClose = savePopup.querySelector(".close");

    let savePopupTimeout = null;

    function showSavePopup(message) {
        savePopupMsg.innerText = message;
        savePopup.style.display = "flex";

        if (savePopupTimeout !== null) {
            clearTimeout(savePopupTimeout);
        }

        savePopupTimeout = setTimeout(() => {
            hideSavePopup();
        }, 10000);
    }

    function hideSavePopup() {
        savePopup.style.display = "none";

        if (savePopupTimeout !== null) {
            clearTimeout(savePopupTimeout);
            savePopupTimeout = null;
        }
    }

    savePopupClose.addEventListener("click", hideSavePopup);



    // ----- PERIODIC SAVE -----
    setInterval(() => {

        try {
            localStorage.setItem(
                "plinkoSave",
                JSON.stringify({
                    score: totalScore,
                    multiplier: scoreMultiplier,
                    addBallCost: addBallCost,
                    slotUpgradeCost: slotUpgradeCost,
                    balls: balls.length
                })
            );

            showSavePopup("Game saved");
        }

        catch (error) {
            showSavePopup("Save failed");
            console.error("Save error:", error);
        }

    }, 120000);

};
