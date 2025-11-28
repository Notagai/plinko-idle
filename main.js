window.onload = () => {

    // ----- ELEMENTS AND BASIC SETUP -----
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const upgradeMenu = document.getElementById("upgradeMenu");
    if (upgradeMenu) {
        upgradeMenu.classList.remove("hide");
    }

    let totalScore = 0; //resets on prestige
    let lifetimeScore = 0; //lifetime, does not reset
    let scoreMultiplier = 1; //multi
    let ballRadius = 16; //ball size
    let prestigeCount = 0; //total prestiges, does not reset even on next layers

    let totalBallsDropped = 0;
    let totalUpgrades = 0;
    let slotUpgradePurchases = 0;
    let unlockedAchievements = [];
    let totalCriticalHits = 0;
    let critUpgradePurchases = 0;
    let critUpgradeCost = 0.5;

    const scoreEl = document.getElementById("score");
    const multiplierEl = document.getElementById("multiplier");
    const prestigeBtn = document.getElementById("prestigeBtn");
    const progressFill = document.getElementById("prestigeFill");

    const addBallBtn = document.getElementById("addBallBtn");
    const tooltip = addBallBtn.querySelector(".tooltip");
    const addBallCostEl = document.getElementById("addBallCost");

    const upgradeBtn2 = document.getElementById("slotUpgradeBtn");
    const upgradeCostEl = upgradeBtn2.querySelector(".tooltip");
    const slotUpgradeCostEl = document.getElementById("slotUpgradeCost");

    const critUpgradeBtn = document.getElementById("critUpgradeBtn");
    const critUpgradeCostEl = document.getElementById("critUpgradeCost");
    const critChanceEl = document.getElementById("critChance");

    let slotUpgradeCost = 1;
    let addBallCost = 2000;

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            // Show selected
            document.getElementById(tabName + '-tab').classList.add('active');
            tab.classList.add('active');
        });
    });
    // ----- NUMBER FORMATTING -----
    function formatNumber(num) {
        if (num < 1000000) return num.toLocaleString();
        const suffixes = ['million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion'];
        let exponent = Math.floor(Math.log10(num));
        let index = Math.floor(exponent / 3) - 2;
        if (index < 0) index = 0;
        if (index >= suffixes.length) index = suffixes.length - 1;
        let divisor = Math.pow(10, 3 * (index + 2));
        let value = num / divisor;
        return value.toFixed(3) + ' ' + suffixes[index];
    }

    const horizontalSpacing = 50;
    const verticalSpacing = 60;
    const rows = 10;
    const colsStart = 5;
    const gravity = 0.2;
    const friction = 0.995;
    let delta = 0.6;
    let lastTime = performance.now();

    const pegs = [];
    const balls = [];
    const slots = [];
    const walls = [];



    // ----- CANVAS RESIZE -----
    function resizeCanvas() {
        canvas.width = window.innerWidth / 2;
        canvas.height = window.innerHeight;

        pegs.length = 0;
        slots.length = 0;
        walls.length = 0;

        makePegs();
        buildWalls();
        buildSlots();

        // Reset all balls to prevent cheating
        for (let b of balls) {
            b.x = canvas.width / 2;
            b.y = 50;
            b.vx = (Math.random() - 0.5) * 6;
            b.vy = 1 + Math.random() * 2;
        }
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

                let scoreGained = Math.round(best.points * scoreMultiplier);

                // Critical hit check
                let critChance = Math.min(0.5, (best.points - 1000) / 10000 + critUpgradePurchases * 0.05);
                let isCrit = Math.random() < critChance;
                if (isCrit) {
                    let critMultiplier = 2 + prestigeCount * 0.2;
                    scoreGained = Math.round(scoreGained * critMultiplier);
                    totalCriticalHits++;
                    showSavePopup(`CRITICAL HIT! x${critMultiplier.toFixed(1)}`);
                }

                totalScore += scoreGained;
                lifetimeScore += scoreGained;
                scoreEl.innerText = "Score: " + formatNumber(totalScore);

                totalBallsDropped++;

                populateStats();
                checkAchievements();

                if (totalScore >= 100000) {
                    prestigeBtn.style.display = "block";
                } else {
                    prestigeBtn.style.display = "none";
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
            scoreEl.innerText = "Score: " + formatNumber(totalScore);

            balls.push(new Ball(canvas.width / 2, 50, ballRadius));

            addBallCost = Math.floor(addBallCost * 1.6);
            addBallCostEl.innerText = addBallCost;

            totalUpgrades++;

            populateStats();
            checkAchievements();
        }
    });

    upgradeBtn2.addEventListener("click", () => {
        if (scoreMultiplier - slotUpgradeCost >= 1) {

            for (let s of slots) {
                s.points *= 2;
            }

            scoreMultiplier -= slotUpgradeCost;
            slotUpgradeCost *= 2;

            slotUpgradeCostEl.innerText = slotUpgradeCost;
            multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;

            totalUpgrades++;
            slotUpgradePurchases++;

            populateStats();
            checkAchievements();
        }
    });

    critUpgradeBtn.addEventListener("click", () => {
        if (scoreMultiplier - critUpgradeCost >= 1) {

            scoreMultiplier -= critUpgradeCost;

            critUpgradeCost += 0.5;

            critUpgradeCostEl.innerText = critUpgradeCost;
            multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;

            totalUpgrades++;
            critUpgradePurchases++;
            critChanceEl.innerText = `Crit Chance Bonus: ${critUpgradePurchases * 5}%`;

            populateStats();
            checkAchievements();
        }
    });

    prestigeBtn.addEventListener("click", () => {
        scoreMultiplier += 0.5;
        multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;

        document.querySelector('.tab[data-tab="prestige"]').classList.remove("hide");

        totalScore = 0;
        scoreEl.innerText = "Score: " + formatNumber(totalScore);

        progressFill.style.width = "0%";

        balls.length = 0;
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));

        addBallCost = 2000;
        addBallCostEl.innerText = addBallCost;

        prestigeBtn.style.display = "none";

        prestigeCount++;

        checkAchievements();
    });

    // ----- SAVE POPUP -----
    const savePopup = document.getElementById("savePopup");
    const savePopupMsg = savePopup.querySelector(".msg");
    const savePopupClose = savePopup.querySelector(".close");

    const confirmPopup = document.getElementById("confirmPopup");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");

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

    // ----- ACHIEVEMENTS -----
    function checkAchievements() {
        for (let ach of achievements) {
            if (!ach.unlocked && ach.condition({
                totalScore,
                totalBallsDropped,
                prestigeCount,
                scoreMultiplier,
                totalUpgrades
            })) {
                ach.unlocked = true;
                unlockedAchievements.push(ach.id);
                showSavePopup(`Achievement Unlocked: ${ach.name}!`);
                populateAchievements();
                populateStats();
            }
        }
    }

    function populateStats() {
        const list = document.getElementById("statsList");
        list.innerHTML = "";
        const stats = [
            { name: "Total Balls Dropped", value: totalBallsDropped },
            { name: "Times Prestiged", value: prestigeCount },
            { name: "Lifetime Upgrades", value: totalUpgrades },
            { name: "Lifetime Score", value: formatNumber(lifetimeScore) },
            { name: "Total Critical Hits", value: totalCriticalHits },
            { name: "Achievements Unlocked", value: unlockedAchievements.length + " / " + achievements.length }
        ];
        for (let stat of stats) {
            const div = document.createElement("div");
            div.className = "stat";
            div.innerHTML = `
                <span>${stat.name}:</span>
                <span>${stat.value}</span>
            `;
            list.appendChild(div);
        }
    }

    function populateAchievements() {
        const list = document.getElementById("achievementsList");
        list.innerHTML = "";
        for (let ach of achievements) {
            const div = document.createElement("div");
            div.className = "achievement" + (ach.unlocked ? " unlocked" : "");
            div.innerHTML = `
                <h3>${ach.name}</h3>
                <p>${ach.description}</p>
                <p class="hint"><i>${ach.hint}</i></p>
                ${ach.unlocked ? '<span class="checkmark">✓</span>' : ''}
            `;
            list.appendChild(div);
        }
    }

    // ----- SAVE LOAD -----
    const save = JSON.parse(localStorage.getItem("plinkoSave") || "{}");

    if (save.score !== undefined) {
        totalScore = save.score;
        scoreEl.innerText = "Score: " + formatNumber(totalScore);
    }

    if (save.lifetimeScore !== undefined) {
        lifetimeScore = save.lifetimeScore;
    } else {
        // Backward compatibility: set lifetimeScore to current totalScore
        lifetimeScore = totalScore;
    }

    if (save.multiplier !== undefined) {
        scoreMultiplier = save.multiplier;
        multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;
    }


    if (save.addBallCost !== undefined) {
        addBallCost = save.addBallCost;
        addBallCostEl.innerText = addBallCost;
    }

    if (save.slotUpgradeCost !== undefined) {
        slotUpgradeCost = save.slotUpgradeCost;
        slotUpgradeCostEl.innerText = slotUpgradeCost;
    }

    if (save.balls !== undefined) {
        balls.length = 0;

        for (let i = 0; i < save.balls; i++) {
            balls.push(new Ball(canvas.width / 2, 50, ballRadius));
        }
    }

    if (save.prestigeCount !== undefined) {
        prestigeCount = save.prestigeCount;
    }

    if (prestigeCount > 0) {
        document.querySelector('.tab[data-tab="prestige"]').classList.remove("hide");
    } else {
        document.querySelector('.tab[data-tab="prestige"]').classList.add("hide");
    }

    if (save.totalBallsDropped !== undefined) {
        totalBallsDropped = save.totalBallsDropped;
    }

    if (save.totalUpgrades !== undefined) {
        totalUpgrades = save.totalUpgrades;
    } else if (save.addBallPurchases !== undefined || save.slotUpgradePurchases !== undefined) {
        // Backward compatibility
        totalUpgrades = (save.addBallPurchases || 0) + (save.slotUpgradePurchases || 0);
    }

    if (save.slotUpgradePurchases !== undefined) {
        slotUpgradePurchases = save.slotUpgradePurchases;
    }

    if (save.critUpgradePurchases !== undefined) {
        critUpgradePurchases = save.critUpgradePurchases;
        critChanceEl.innerText = `Crit Chance Bonus: ${critUpgradePurchases * 5}%`;
    }

    if (save.critUpgradeCost !== undefined) {
        critUpgradeCost = save.critUpgradeCost;
        critUpgradeCostEl.innerText = critUpgradeCost;
    }

    // Apply slot upgrades to restore points
    for (let i = 0; i < slotUpgradePurchases; i++) {
        for (let s of slots) {
            s.points *= 2;
        }
    }

    if (save.unlockedAchievements !== undefined) {
        unlockedAchievements = save.unlockedAchievements;
        for (let id of unlockedAchievements) {
            let ach = achievements.find(a => a.id === id);
            if (ach) {
                ach.unlocked = true;
            }
        }

        critUpgradeCostEl.innerText = critUpgradeCost;
    }

    if (save.totalCriticalHits !== undefined) {
        totalCriticalHits = save.totalCriticalHits;
    }

    populateAchievements();
    populateStats();

    checkAchievements();

    if (balls.length === 0) {
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));
    }

    if (totalScore >= 100000) {
        prestigeBtn.style.display = "block";
    }



    // ----- MAIN LOOP -----
    function loop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        delta = deltaTime * 36; // adjust factor to maintain speed

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



    // ----- SAVE LOAD -----

    const manualSaveBtn = document.getElementById("manualSaveBtn");
    manualSaveBtn.addEventListener("click", () => {
        try {
            localStorage.setItem(
                "plinkoSave",
                JSON.stringify({
                    score: totalScore,
                    lifetimeScore: lifetimeScore,
                    multiplier: scoreMultiplier,
                    addBallCost: addBallCost,
                    slotUpgradeCost: slotUpgradeCost,
                    balls: balls.length,
                    prestigeCount: prestigeCount,
                    totalBallsDropped: totalBallsDropped,
                    totalUpgrades: totalUpgrades,
                    slotUpgradePurchases: slotUpgradePurchases,
                    unlockedAchievements: unlockedAchievements,
                    totalCriticalHits: totalCriticalHits,
                    critUpgradePurchases: critUpgradePurchases,
                    critUpgradeCost: critUpgradeCost
                })
            );

            showSavePopup("Game saved");
        }

        catch (error) {
            showSavePopup("Save failed");
            console.error("Save error:", error);
        }
    });

    const clearSaveBtn = document.getElementById("clearSaveBtn");
    clearSaveBtn.addEventListener("click", () => {
        confirmPopup.style.display = "flex";
    });

    confirmYes.addEventListener("click", () => {
        localStorage.removeItem("plinkoSave");

        totalScore = 0;
        lifetimeScore = 0;
        scoreEl.innerText = "Score: " + formatNumber(totalScore);

        scoreMultiplier = 1;
        multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;

        addBallCost = 2000;
        addBallCostEl.innerText = addBallCost;

        slotUpgradeCost = 1;
        slotUpgradeCostEl.innerText = slotUpgradeCost;

        balls.length = 0;
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));

        prestigeBtn.style.display = "none";
        progressFill.style.width = "0%";

        document.querySelector('.tab[data-tab="prestige"]').classList.add("hide");

        prestigeCount = 0;

        totalBallsDropped = 0;
        totalUpgrades = 0;
        slotUpgradePurchases = 0;
        unlockedAchievements = [];
        totalCriticalHits = 0;
        critUpgradePurchases = 0;
        critUpgradeCost = 0.5;
        critChanceEl.innerText = `Crit Chance Bonus: 0%`;
        checkAchievements();

        for (let ach of achievements) {
            ach.unlocked = false;
        }

        populateAchievements();
        populateStats();

        confirmPopup.style.display = "none";

        showSavePopup("Save cleared");

        location.reload();
    });

    confirmNo.addEventListener("click", () => {
        confirmPopup.style.display = "none";
    });

    // ----- EXPORT/IMPORT SAVE -----
    const exportImportPopup = document.getElementById("exportImportPopup");
    const saveDataTextarea = document.getElementById("saveDataTextarea");
    const doExportBtn = document.getElementById("doExportBtn");
    const doImportBtn = document.getElementById("doImportBtn");
    const closeExportImport = document.getElementById("closeExportImport");
    const exportImportSaveBtn = document.getElementById("exportImportSaveBtn");

    exportImportSaveBtn.addEventListener("click", () => {
        saveDataTextarea.value = "";
        exportImportPopup.style.display = "flex";
    });

    doExportBtn.addEventListener("click", () => {
        const saveData = {
            score: totalScore,
            lifetimeScore: lifetimeScore,
            multiplier: scoreMultiplier,
            addBallCost: addBallCost,
            slotUpgradeCost: slotUpgradeCost,
            balls: balls.length,
            prestigeCount: prestigeCount,
            totalBallsDropped: totalBallsDropped,
            totalUpgrades: totalUpgrades,
            slotUpgradePurchases: slotUpgradePurchases,
            unlockedAchievements: unlockedAchievements,
            totalCriticalHits: totalCriticalHits,
            critUpgradePurchases: critUpgradePurchases,
            critUpgradeCost: critUpgradeCost
        };
        const json = JSON.stringify(saveData);
        const base64 = btoa(json);
        saveDataTextarea.value = base64;
        navigator.clipboard.writeText(saveDataTextarea.value).then(() => {
            showSavePopup("Save data copied to clipboard");
        }).catch(() => {
            showSavePopup("Failed to copy to clipboard");
        });
    });

    doImportBtn.addEventListener("click", () => {
        try {
            const base64 = saveDataTextarea.value.trim();
            if (!base64) {
                showSavePopup("No save data provided");
                return;
            }
            const json = atob(base64);
            const saveData = JSON.parse(json);

            totalScore = saveData.score || 0;
            lifetimeScore = saveData.lifetimeScore || totalScore;
            scoreEl.innerText = "Score: " + formatNumber(totalScore);

            scoreMultiplier = saveData.multiplier || 1;
            multiplierEl.innerText = `Multiplier: x${scoreMultiplier.toFixed(1)}`;

            addBallCost = saveData.addBallCost || 2000;
            addBallCostEl.innerText = addBallCost;

            slotUpgradeCost = saveData.slotUpgradeCost || 1;
            slotUpgradeCostEl.innerText = slotUpgradeCost;

            balls.length = 0;
            for (let i = 0; i < (saveData.balls || 1); i++) {
                balls.push(new Ball(canvas.width / 2, 50, ballRadius));
            }

            prestigeCount = saveData.prestigeCount || 0;
            totalBallsDropped = saveData.totalBallsDropped || 0;
            totalUpgrades = saveData.totalUpgrades || (saveData.addBallPurchases || 0) + (saveData.slotUpgradePurchases || 0);
            slotUpgradePurchases = saveData.slotUpgradePurchases || 0;
            unlockedAchievements = saveData.unlockedAchievements || [];
            totalCriticalHits = saveData.totalCriticalHits || 0;
            critUpgradePurchases = saveData.critUpgradePurchases || 0;
            critChanceEl.innerText = `Crit Chance Bonus: ${critUpgradePurchases * 5}%`;
            critUpgradeCost = saveData.critUpgradeCost || 0.5;

            // Apply slot upgrades to restore points
            for (let i = 0; i < slotUpgradePurchases; i++) {
                for (let s of slots) {
                    s.points *= 2;
                }
            }

            for (let id of unlockedAchievements) {
                let ach = achievements.find(a => a.id === id);
                if (ach) {
                    ach.unlocked = true;
                }
            }

            populateAchievements();
            populateStats();

            checkAchievements();

            if (prestigeCount > 0) {
                document.querySelector('.tab[data-tab="prestige"]').classList.remove("hide");
            } else {
                document.querySelector('.tab[data-tab="prestige"]').classList.add("hide");
            }

            if (totalScore >= 100000) {
                prestigeBtn.style.display = "block";
            } else {
                prestigeBtn.style.display = "none";
            }

            progressFill.style.width = (Math.min(totalScore / 100000, 1) * 100) + "%";

            exportImportPopup.style.display = "none";
            showSavePopup("Save imported successfully");
        } catch (error) {
            showSavePopup("Import failed: Invalid save data");
            console.error("Import error:", error);
        }
    });

    closeExportImport.addEventListener("click", () => {
        exportImportPopup.style.display = "none";
    });



    // ----- PERIODIC SAVE -----
    setInterval(() => {

        try {
            localStorage.setItem(
                "plinkoSave",
                JSON.stringify({
                    score: totalScore,
                    lifetimeScore: lifetimeScore,
                    multiplier: scoreMultiplier,
                    addBallCost: addBallCost,
                    slotUpgradeCost: slotUpgradeCost,
                    balls: balls.length,
                    prestigeCount: prestigeCount,
                    totalBallsDropped: totalBallsDropped,
                    totalUpgrades: totalUpgrades,
                    slotUpgradePurchases: slotUpgradePurchases,
                    unlockedAchievements: unlockedAchievements,
                    totalCriticalHits: totalCriticalHits,
                    critUpgradePurchases: critUpgradePurchases,
                    critUpgradeCost: critUpgradeCost
                })
            );

            showSavePopup("Game saved");
        }

        catch (error) {
            showSavePopup("Save failed");
            console.error("Save error:", error);
        }

    }, 60000);

};