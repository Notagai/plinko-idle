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
    let lifetimePrestiges = 0; //lifetime prestiges across all transcends

    let totalBallsDropped = 0;
    let totalUpgrades = 0;
    let slotUpgradePurchases = 0;
    let unlockedAchievements = [];
    let totalCriticalHits = 0;
    let critUpgradePurchases = 0;
    let critUpgradeCost = 0.5;
    let transcendCount = 0;
    let transcendCost = 5;
    let transcensionShards = 0;
    let prestigeShardMultiplier = 1;
    let prestigeUpgradesUnlocked = false;
    let transcendUpgradesUnlocked = false;
    let automationUnlocked = false;
    let hasReached100k = false;
    let fancyEffectsEnabled = true; // default enabled
    let autosaveInterval = 60000; // default 60 seconds
    let autosaveTimer = null;

    function startAutosave() {
        if (autosaveTimer) clearInterval(autosaveTimer);
        autosaveTimer = setInterval(() => {
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
                        lifetimePrestiges: lifetimePrestiges,
                        totalBallsDropped: totalBallsDropped,
                        totalUpgrades: totalUpgrades,
                        slotUpgradePurchases: slotUpgradePurchases,
                        unlockedAchievements: unlockedAchievements,
                        totalCriticalHits: totalCriticalHits,
                        critUpgradePurchases: critUpgradePurchases,
                        critUpgradeCost: critUpgradeCost,
                        autosaveInterval: autosaveInterval,
                        transcendCount: transcendCount,
                        transcendCost: transcendCost,
                        prestigeShardMultiplier: prestigeShardMultiplier,
                        hasReached100k: hasReached100k,
                        fancyEffectsEnabled: fancyEffectsEnabled,
                        missionProgress: (typeof missionSystem !== 'undefined' && missionSystem) ? {
                            currentMissionIndex: missionSystem.currentMissionIndex,
                            completedMissions: Array.from(missionSystem.completedMissions),
                            allMissionsComplete: missionSystem.allMissionsComplete
                        } : null
                    })
                );

                showSavePopup("Game saved");
            }

            catch (error) {
                showSavePopup("Save failed");
                console.error("Save error:", error);
            }
        }, autosaveInterval);
    }

    const scoreEl = document.getElementById("score");
    const prestigeMultiplierEl = document.getElementById("prestigeMultiplier");
    const transcendMultiplierEl = document.getElementById("transcendMultiplier");
    const transcensionShardsEl = document.getElementById("transcensionShards");
    const prestigeBtn = document.getElementById("prestigeBtn");
    const transcendInfo = document.getElementById("transcendInfo");
    const prestigeProgressFill = document.getElementById("prestigeProgressFill");
    const transcendProgressFill = document.getElementById("transcendProgressFill");

    const addBallBtn = document.getElementById("addBallBtn");
    const tooltip = addBallBtn.querySelector(".tooltip");
    const addBallCostEl = document.getElementById("addBallCost");

    const upgradeBtn2 = document.getElementById("slotUpgradeBtn");
    const upgradeCostEl = upgradeBtn2.querySelector(".tooltip");
    const slotUpgradeCostEl = document.getElementById("slotUpgradeCost");

    const critUpgradeBtn = document.getElementById("critUpgradeBtn");
    const critUpgradeCostEl = document.getElementById("critUpgradeCost");
    const critChanceEl = document.getElementById("critChance");
    const prestigeUpgrades = document.getElementById("prestigeUpgrades");
    const transcendUpgrades = document.getElementById("transcendUpgrades");
    const transcendBtn = document.getElementById("transcendBtn");

    let slotUpgradeCost = 1;
    let addBallCost = 2000;

    // Function to check if prestige tab should be visible
    function shouldShowPrestigeTab() {
        return totalScore >= 100000 || lifetimePrestiges > 0 || transcendCount > 0;
    }



    // Function to update prestige tab visibility
    function updatePrestigeTabVisibility() {
        const prestigeTab = document.querySelector('.tab[data-tab="prestige"]');
        if (prestigeTab) {
            const shouldShow = shouldShowPrestigeTab();
            console.log('Checking prestige tab visibility:', {
                lifetimePrestiges,
                transcendCount,
                totalScore,
                shouldShow
            });
            
            if (shouldShow) {
                prestigeTab.classList.remove("hide");
                if (lifetimePrestiges === 0 && totalScore > 100000) {
                    prestigeTab.classList.add("highlight");
                }
            } else {
                prestigeTab.classList.add("hide");
                prestigeTab.classList.remove("highlight");
            }
        } else {
            console.warn('Prestige tab element not found');
        }
    }

    // Function to update transcend upgrades visibility in regular upgrades tab
    function updateTranscendUpgradesVisibility() {
        if (transcendUpgradesUnlocked) {
            transcendUpgrades.style.display = "block";
        } else {
            transcendUpgrades.style.display = "none";
        }
    }

    // Function to calculate total cost for N shards (rounded up to nearest 0.5)
    function getTranscendCostForShards(shardCount) {
        if (shardCount <= 0) return 0;
        // Total cost = 10x * (1.5^N - 1), then round up to nearest 0.5
        const totalCost = 10 * (Math.pow(1.5, shardCount) - 1);
        return Math.ceil(totalCost * 2) / 2; // Round up to nearest 0.5
    }

    // Function to calculate how many shards can be afforded with current multiplier
    function getAffordableShards(multiplier) {
        let shardCount = 0;
        let cost = 0;

        while (cost <= multiplier) {
            shardCount++;
            cost = getTranscendCostForShards(shardCount);

            // Prevent infinite loop
            if (shardCount > 100) break;
        }

        return Math.max(0, shardCount - 1); // Subtract 1 because the last iteration exceeded
    }

    // Function to apply gradient colors to "Transcendence" and "Prestige" words
    function applyGradientColors(text) {
        if (!text) return text;

        // Replace "Transcendence(s)" with gradient span (case insensitive)
        text = text.replace(/Transcendence(s)?/gi, '<span class="transcend-gradient">$&</span>');

        // Replace "Prestige(s)" with gradient span (case insensitive)
        text = text.replace(/Prestige(s)?/gi, '<span class="prestige-gradient">$&</span>');

        return text;
    }

    // Make function globally available for missions.js
    window.applyGradientColors = applyGradientColors;

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
            // Remove highlight when clicked
            if (tabName === 'prestige') {
                tab.classList.remove('highlight');
            }
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



    // ----- FLYING TEXT -----
    function createFlyingText(x, y, text, color) {
        const div = document.createElement('div');
        div.innerText = text;
        div.style.position = 'absolute';
        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.color = color;
        div.style.fontSize = '20px';
        div.style.fontWeight = 'bold';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '1000';
        div.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(div);

        let vy = -2;
        let opacity = 1;
        const animate = () => {
            div.style.top = (parseFloat(div.style.top) + vy) + 'px';
            vy -= 0.1;
            opacity -= 0.02;
            div.style.opacity = opacity;
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(div);
            }
        };
        animate();
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

                let scoreGained = Math.round(best.points * scoreMultiplier * Math.pow(2, transcensionShards) * prestigeShardMultiplier);

                // Critical hit check
                let critChance = Math.min(0.5, 0.05 + critUpgradePurchases * 0.05);
                let isCrit = Math.random() < critChance;
                if (isCrit) {
                    let critMultiplier = 2 + prestigeCount * 0.2;
                    scoreGained = Math.round(scoreGained * critMultiplier);
                    totalCriticalHits++;
                    const critX = best.x + best.width / 2;
                    const critY = slotY;
                    createFlyingText(critX, critY, `CRIT x${critMultiplier.toFixed(1)}`, 'red');
                }

                totalScore += scoreGained;
                lifetimeScore += scoreGained;
                scoreEl.innerText = "Score: " + formatNumber(totalScore);

                totalBallsDropped++;

                populateStats();
                checkAchievements();
                updateButtonStates();
                updateProgressBars();

                // Update mission system
                if (typeof missionSystem !== 'undefined' && missionSystem) {
                    missionSystem.update({
                        totalScore,
                        lifetimeScore,
                        balls,
                        totalUpgrades,
                        totalCriticalHits,
                        updateMultiplierDisplays: updateMultiplierDisplays,
                        scoreMultiplier
                    });
                }


                if (totalScore >= 100000) {
                    hasReached100k = true;
                }
                updatePrestigeTabVisibility();
                if (totalScore >= 100000) {
                    prestigeBtn.classList.remove('disabled');
                } else {
                    prestigeBtn.classList.add('disabled');
                }
                prestigeBtn.style.display = "block";


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
            updateButtonStates();
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
            updateMultiplierDisplays();

            totalUpgrades++;
            slotUpgradePurchases++;

            populateStats();
            checkAchievements();
            updateButtonStates();
        }
    });

    critUpgradeBtn.addEventListener("click", () => {
        if (scoreMultiplier - critUpgradeCost >= 1) {

            scoreMultiplier -= critUpgradeCost;

            critUpgradeCost += 0.5;

            critUpgradeCostEl.innerText = critUpgradeCost;
            updateMultiplierDisplays();

            totalUpgrades++;
            critUpgradePurchases++;
            critChanceEl.innerText = `Crit Chance: ${5 + critUpgradePurchases * 5}%`;

            populateStats();
            checkAchievements();
            updateButtonStates();

        }
    });

    const spendShardBtn = document.getElementById("spendShardBtn");
    spendShardBtn.addEventListener("click", () => {
        if (transcensionShards >= 1) {
            transcensionShards -= 1;
            transcensionShardsEl.innerText = `Transcension Shards: ${transcensionShards}`;

            prestigeShardMultiplier *= 2;
            updateMultiplierDisplays();

            updateButtonStates();
            updateProgressBars();
        }
    });

    const unlockAutomationBtn = document.getElementById("unlockAutomationBtn");
    unlockAutomationBtn.addEventListener("click", () => {
        if (transcensionShards >= 10) {
            transcensionShards -= 10;
            transcensionShardsEl.innerText = `Transcension Shards: ${transcensionShards}`;

            automationUnlocked = true;
            const automationSection = document.getElementById("automationSection");
            if (automationSection) {
                automationSection.style.display = "block";
            }
            unlockAutomationBtn.style.display = "none";

            updateMultiplierDisplays();
            updateButtonStates();
        }
    });

    const actualTranscendBtn = document.getElementById("actualTranscendBtn");
    actualTranscendBtn.addEventListener("click", () => {
        const affordableShards = getAffordableShards(scoreMultiplier);
        if (affordableShards <= 0) return; // Need at least 1 shard affordable

        // Perform transcend: gain all affordable shards
        transcensionShards += affordableShards;
        transcensionShardsEl.innerText = `Transcension Shards: ${transcensionShards}`;
        updateMultiplierDisplays();

        // Reset multiplier, score, upgrades, and prestige upgrades
        scoreMultiplier = 1;
        updateMultiplierDisplays();

        transcendCount += 1;

        // reset everything except lifetime stats
        totalScore = 0;
        scoreEl.innerText = "Score: " + formatNumber(totalScore);

        prestigeProgressFill.style.width = "0%";
        transcendProgressFill.style.width = "0%";

        balls.length = 0;
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));

        addBallCost = 2000;
        addBallCostEl.innerText = addBallCost;

        slotUpgradeCost = 1;
        slotUpgradeCostEl.innerText = slotUpgradeCost;

        critUpgradeCost = 0.5;
        critUpgradeCostEl.innerText = critUpgradeCost;

        slotUpgradePurchases = 0;
        critUpgradePurchases = 0;
        critChanceEl.innerText = `Crit Chance: 5%`;

        prestigeCount = 0;
        // Do NOT reset lifetimePrestiges - preserve lifetime prestige count

        if (transcendCount >= 1) {
            transcendUpgradesUnlocked = true;
        }

        // hide/show
        prestigeUpgrades.style.display = prestigeUpgradesUnlocked ? "block" : "none";
        prestigeBtn.classList.add('disabled');
        updateTranscendUpgradesVisibility();

        // reset slots points
        buildSlots();

        populateStats();
        checkAchievements();
        updateButtonStates();
        updateProgressBars();

        startAutosave();
    });

    prestigeBtn.addEventListener("click", () => {
        if (prestigeBtn.classList.contains('disabled')) return;

        // Calculate prestiges to gain based on score thresholds
        let prestigesToGain = 0;
        let remainingScore = totalScore;
        let threshold = 100000;
        while (remainingScore >= threshold) {
            prestigesToGain++;
            remainingScore -= threshold;
            threshold *= 2;
        }

        prestigeCount += prestigesToGain;
        lifetimePrestiges += prestigesToGain;
        scoreMultiplier += prestigesToGain * 0.5 * Math.pow(2, transcendCount) * prestigeShardMultiplier;
        updateMultiplierDisplays();

        updatePrestigeTabVisibility();

        totalScore = 0;
        scoreEl.innerText = "Score: " + formatNumber(totalScore);

        prestigeProgressFill.style.width = "0%";

        balls.length = 0;
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));

        addBallCost = 2000;
        addBallCostEl.innerText = addBallCost;

        if (lifetimePrestiges >= 1) {
            prestigeUpgradesUnlocked = true;
            prestigeUpgrades.style.display = "block";
        }

        if (transcendCount >= 1) {
            transcendUpgradesUnlocked = true;
            updateTranscendUpgradesVisibility();
        }

        prestigeBtn.classList.add('disabled');

        checkAchievements();
        updateButtonStates();
        updateProgressBars();

        startAutosave();
    });

    // Ctrl+S to save game
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const manualSaveBtn = document.getElementById("manualSaveBtn");
            manualSaveBtn.click();
        }
    });

    // ----- SAVE POPUP -----
    const savePopup = document.getElementById("savePopup");
    const savePopupMsg = savePopup.querySelector(".msg");
    const savePopupClose = savePopup.querySelector(".close");

    const confirmPopup = document.getElementById("confirmPopup");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");

    const autosaveIntervalEl = document.getElementById("autosaveInterval");
    const fancyEffectsToggleEl = document.getElementById("fancyEffectsToggle");

    autosaveIntervalEl.addEventListener("change", () => {
        autosaveInterval = parseInt(autosaveIntervalEl.value);
        startAutosave();
    });

    fancyEffectsToggleEl.addEventListener("change", () => {
        fancyEffectsEnabled = fancyEffectsToggleEl.checked;
        if (window.backgroundEffects) {
            window.backgroundEffects.setEnabled(fancyEffectsEnabled);
        }
    });

    // Set initial state
    fancyEffectsToggleEl.checked = fancyEffectsEnabled;
    if (window.backgroundEffects) {
        window.backgroundEffects.setEnabled(fancyEffectsEnabled);
    }

    let savePopupTimeout = null;

    function showSavePopup(message, onClick) {
        savePopupMsg.innerText = message;
        savePopup.style.display = "flex";

        if (onClick) {
            savePopup.onclick = () => {
                onClick();
                hideSavePopup();
            };
            savePopupClose.onclick = (e) => {
                e.stopPropagation();
                hideSavePopup();
            };
        }

        if (savePopupTimeout !== null) {
            clearTimeout(savePopupTimeout);
        }

        savePopupTimeout = setTimeout(() => {
            hideSavePopup();
        }, 10000);
    }

    function hideSavePopup() {
        savePopup.style.display = "none";
        savePopup.onclick = null; // clean up

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
                totalUpgrades,
                lifetimeScore,
                transcendCount,
                transcensionShards,
                prestigeShardMultiplier
            })) {
                ach.unlocked = true;
                unlockedAchievements.push(ach.id);
                showSavePopup(`Achievement Unlocked: ${ach.name}!`, () => {
                    // Switch to stats tab
                    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.getElementById('stats-tab').classList.add('active');
                    document.querySelector('.tab[data-tab="stats"]').classList.add('active');
                });
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
            { name: "Times Prestiged", value: lifetimePrestiges },
            { name: "Times Transcended", value: transcendCount },
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
            div.id = `achievement-${ach.id}`;
            div.className = "achievement" + (ach.unlocked ? " unlocked" : "");
            div.innerHTML = `
                <h3>${applyGradientColors(ach.name)}</h3>
                <p>${ach.unlocked ? applyGradientColors(ach.description) : "???"}</p>
                <p class="hint"><i>${ach.hint}</i></p>
                ${ach.unlocked ? '<span class="checkmark">✓</span>' : ''}
            `;
            list.appendChild(div);
        }
    }


    function updateButtonStates() {
        if (totalScore >= addBallCost) {
            addBallBtn.classList.remove('disabled');
        } else {
            addBallBtn.classList.add('disabled');
        }
        if (scoreMultiplier - slotUpgradeCost >= 1) {
            upgradeBtn2.classList.remove('disabled');
        } else {
            upgradeBtn2.classList.add('disabled');
        }
        if (scoreMultiplier - critUpgradeCost >= 1) {
            critUpgradeBtn.classList.remove('disabled');
        } else {
            critUpgradeBtn.classList.add('disabled');
        }
        // Check for actual transcend button (requires at least 1 shard affordable)
        const affordableShards = getAffordableShards(scoreMultiplier);
        if (affordableShards > 0) {
            actualTranscendBtn.classList.remove('disabled');
        } else {
            actualTranscendBtn.classList.add('disabled');
        }

        // Check for spend shard button
        if (transcensionShards >= 1) {
            spendShardBtn.classList.remove('disabled');
        } else {
            spendShardBtn.classList.add('disabled');
        }

        // Check for unlock automation button
        if (transcensionShards >= 10 && !automationUnlocked) {
            unlockAutomationBtn.classList.remove('disabled');
        } else {
            unlockAutomationBtn.classList.add('disabled');
        }

        // Update prestige info
        const prestigeInfo = document.getElementById("prestigeInfo");
        let prestigesToGain = 0;
        let remainingScore = totalScore;
        let threshold = 100000;
        while (remainingScore >= threshold) {
            prestigesToGain++;
            remainingScore -= threshold;
            threshold *= 2;
        }
        const multiplierGain = prestigesToGain * 0.5 * Math.pow(2, transcendCount);
        const newMultiplier = scoreMultiplier + multiplierGain;
        prestigeInfo.innerText = `You will gain +${multiplierGain.toFixed(1)} multiplier (${prestigesToGain} prestige${prestigesToGain > 1 ? 's' : ''}), resulting in x${newMultiplier.toFixed(1)} total multiplier.`;

        // Update transcend info
        const shardsForInfo = getAffordableShards(scoreMultiplier);
        const cost = getTranscendCostForShards(shardsForInfo);
        if (shardsForInfo > 0) {
            transcendInfo.innerText = `Cost: ${cost.toFixed(1)}x multiplier. You will gain ${shardsForInfo} transcension shard${shardsForInfo > 1 ? 's' : ''}.`;
        } else {
            transcendInfo.innerText = `Cost: 5x multiplier for first shard. You will gain 0 shards (not enough multiplier).`;
        }
    }

    function updateTranscendSectionVisibility() {
        const transcendSection = document.getElementById('transcendSection');
        if (transcendSection) {
            // Show transcend section when prestige multiplier reaches 5x or if player has transcended before
            if (scoreMultiplier >= 5 || transcendCount > 0) {
                transcendSection.style.display = 'block';
            } else {
                transcendSection.style.display = 'none';
            }
        }
    }

    function updateMultiplierDisplays() {
        // Calculate transcend multiplier based on both spent AND unspent shards
        // Unspent shards: transcensionShards
        // Spent shards: represented by prestigeShardMultiplier (which is 2^spent_shards)
        const transcendMultiplier = Math.pow(2, transcensionShards) * prestigeShardMultiplier;

        // Update displays with conditional visibility
        if (prestigeCount >= 1 || transcendCount >= 1) {
            prestigeMultiplierEl.innerText = `Prestige Multiplier: x${scoreMultiplier.toFixed(1)}`;
            prestigeMultiplierEl.style.display = 'block';
        } else {
            prestigeMultiplierEl.style.display = 'none';
        }

        if (transcendCount >= 1) {
            transcendMultiplierEl.innerText = `Transcend Multiplier: x${transcendMultiplier.toFixed(1)}`;
            transcendMultiplierEl.style.display = 'block';
        } else {
            transcendMultiplierEl.style.display = 'none';
        }

        // Update transcend section visibility
        updateTranscendSectionVisibility();
    }

    function updateProgressBars() {
        // Calculate prestige progress using the same iterative logic as prestigeBtn
        let prestigesToGain = 0;
        let remainingScore = totalScore;
        let threshold = 100000;

        // Find out how many prestiges the player can afford and what the current threshold is
        while (remainingScore >= threshold) {
            prestigesToGain++;
            remainingScore -= threshold;
            threshold *= 2;
        }

        // The current threshold is what the player is working towards
        const currentThreshold = threshold;
        const progressToCurrentThreshold = (totalScore - (totalScore - remainingScore)) / currentThreshold;
        const prestigeProgress = Math.min(progressToCurrentThreshold, 1) * 100;

        prestigeProgressFill.style.width = prestigeProgress + "%";

        // Transcend progress - show progress towards next shard threshold
        const affordableShards = getAffordableShards(scoreMultiplier);

        let transcendProgress;
        if (affordableShards === 0) {
            // Can't afford any shards - show progress from 0 to first shard cost
            const firstShardCost = getTranscendCostForShards(1);
            transcendProgress = Math.min(scoreMultiplier / firstShardCost, 1) * 100;
        } else {
            // Can afford at least one shard - show progress from last affordable to next
            const lastAffordableCost = getTranscendCostForShards(affordableShards);
            const nextCost = getTranscendCostForShards(affordableShards + 1);
            const progressWithinTier = (scoreMultiplier - lastAffordableCost) / (nextCost - lastAffordableCost);
            transcendProgress = Math.min(Math.max(progressWithinTier, 0), 1) * 100;
        }
        transcendProgressFill.style.width = transcendProgress + "%";
    }

    // ----- MISSION SYSTEM -----
    // Initialize mission system
    const missionSystem = new MissionSystem();

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
        updateMultiplierDisplays();
    }

    if (save.transcensionShards !== undefined) {
        transcensionShards = save.transcensionShards;
        transcensionShardsEl.innerText = `Transcension Shards: ${transcensionShards}`;
        updateMultiplierDisplays();
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

    if (save.lifetimePrestiges !== undefined) {
        lifetimePrestiges = save.lifetimePrestiges;
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
        critChanceEl.innerText = `Crit Chance: ${5 + critUpgradePurchases * 5}%`;
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


    if (save.autosaveInterval !== undefined) {
        autosaveInterval = save.autosaveInterval;
    } else {
        autosaveInterval = 60000;
    }
    autosaveIntervalEl.value = autosaveInterval;

    if (save.transcendCount !== undefined) {
        transcendCount = save.transcendCount;
    }

    if (save.transcendCost !== undefined) {
        transcendCost = save.transcendCost;
    }

    if (save.transcensionShards !== undefined) {
        transcensionShards = save.transcensionShards;
        transcensionShardsEl.innerText = `Transcension Shards: ${transcensionShards}`;
        updateMultiplierDisplays();
    }

    if (save.prestigeUpgradesUnlocked !== undefined) {
        prestigeUpgradesUnlocked = save.prestigeUpgradesUnlocked;
    }

    if (save.transcendUpgradesUnlocked !== undefined) {
        transcendUpgradesUnlocked = save.transcendUpgradesUnlocked;
    }

    if (save.automationUnlocked !== undefined) {
        automationUnlocked = save.automationUnlocked;
    }

    // Update transcend upgrades visibility after loading save data
    updateTranscendUpgradesVisibility();

    if (save.hasReached100k !== undefined) {
        hasReached100k = save.hasReached100k;
    }

    if (save.fancyEffectsEnabled !== undefined) {
        fancyEffectsEnabled = save.fancyEffectsEnabled;
        fancyEffectsToggleEl.checked = fancyEffectsEnabled;
        if (window.backgroundEffects) {
            window.backgroundEffects.setEnabled(fancyEffectsEnabled);
        }
    }

    // Load mission progress
    if (save.missionProgress !== undefined && typeof missionSystem !== 'undefined' && missionSystem) {
        missionSystem.currentMissionIndex = save.missionProgress.currentMissionIndex || 0;
        missionSystem.completedMissions = new Set(save.missionProgress.completedMissions || []);
        missionSystem.allMissionsComplete = save.missionProgress.allMissionsComplete || false;
        missionSystem.updateMissionDisplay();
    }

    // Set unlocked flags
    if (lifetimePrestiges > 0) {
        prestigeUpgradesUnlocked = true;
    }
    if (transcendCount >= 1) {
        transcendUpgradesUnlocked = true;
    }

    // Update visibility after setting flags
    updateTranscendUpgradesVisibility();

    // Set displays
    prestigeUpgrades.style.display = prestigeUpgradesUnlocked ? "block" : "none";
    // transcendUpgrades visibility handled by updateTranscendUpgradesVisibility()

    // Show automation section if unlocked
    if (automationUnlocked) {
        const automationSection = document.getElementById("automationSection");
        if (automationSection) {
            automationSection.style.display = "block";
        }
        const unlockAutomationBtn = document.getElementById("unlockAutomationBtn");
        if (unlockAutomationBtn) {
            unlockAutomationBtn.style.display = "none";
        }
    }

    prestigeBtn.style.display = "block";
    updatePrestigeTabVisibility();
    if (totalScore >= 100000) {
        prestigeBtn.classList.remove('disabled');
    } else {
        prestigeBtn.classList.add('disabled');
    }

    populateAchievements();
    populateStats();

    checkAchievements();
    updateButtonStates();
    updateProgressBars();
    updatePrestigeTabVisibility();
    updateMultiplierDisplays();
    updateTranscendUpgradesVisibility();
    updateTranscendSectionVisibility();

    // Backup call to ensure prestige tab visibility is correct after DOM is ready
    setTimeout(() => {
        updatePrestigeTabVisibility();
    }, 100);

    if (balls.length === 0) {
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));
    }

    if (totalScore >= 100000) {
        prestigeBtn.style.display = "block";
        prestigeBtn.classList.remove('disabled');
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

        // Update mission system
        if (typeof missionSystem !== 'undefined' && missionSystem) {
            missionSystem.update({
                totalScore,
                lifetimeScore,
                balls,
                totalUpgrades,
                totalCriticalHits,
                scoreMultiplier
            });
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
                    lifetimePrestiges: lifetimePrestiges,
                    totalBallsDropped: totalBallsDropped,
                    totalUpgrades: totalUpgrades,
                    slotUpgradePurchases: slotUpgradePurchases,
                    unlockedAchievements: unlockedAchievements,
                    totalCriticalHits: totalCriticalHits,
                    critUpgradePurchases: critUpgradePurchases,
                    critUpgradeCost: critUpgradeCost,
                    autosaveInterval: autosaveInterval,
                    transcendCount: transcendCount,
                    transcendCost: transcendCost,
                    transcensionShards: transcensionShards,
                    prestigeUpgradesUnlocked: prestigeUpgradesUnlocked,
                    transcendUpgradesUnlocked: transcendUpgradesUnlocked,
                    automationUnlocked: automationUnlocked,
                    prestigeShardMultiplier: prestigeShardMultiplier,
                    hasReached100k: hasReached100k,
                    fancyEffectsEnabled: fancyEffectsEnabled,
                    missionProgress: (typeof missionSystem !== 'undefined' && missionSystem) ? {
                        currentMissionIndex: missionSystem.currentMissionIndex,
                        completedMissions: Array.from(missionSystem.completedMissions),
                        allMissionsComplete: missionSystem.allMissionsComplete
                    } : null
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
        updateMultiplierDisplays();

        addBallCost = 2000;
        addBallCostEl.innerText = addBallCost;

        slotUpgradeCost = 1;
        slotUpgradeCostEl.innerText = slotUpgradeCost;

        balls.length = 0;
        balls.push(new Ball(canvas.width / 2, 50, ballRadius));

        prestigeBtn.style.display = "block";
        prestigeBtn.classList.add('disabled');
        prestigeProgressFill.style.width = "0%";
        transcendProgressFill.style.width = "0%";

        updatePrestigeTabVisibility();

        prestigeCount = 0;

        totalBallsDropped = 0;
        totalUpgrades = 0;
        slotUpgradePurchases = 0;
        unlockedAchievements = [];
        totalCriticalHits = 0;
        critUpgradePurchases = 0;
        critUpgradeCost = 0.5;
        critChanceEl.innerText = `Crit Chance: 5%`;
        transcendCount = 0;
        transcendCost = 5;
        transcensionShards = 0;
        transcensionShardsEl.innerText = `Transcension Shards: ${transcensionShards}`;
        prestigeUpgradesUnlocked = false;
        transcendUpgradesUnlocked = false;
        automationUnlocked = false;
        hasReached100k = false;
        fancyEffectsEnabled = true;
        fancyEffectsToggleEl.checked = true;
        if (window.backgroundEffects) {
            window.backgroundEffects.setEnabled(true);
        }
        prestigeShardMultiplier = 1;
        autosaveInterval = 60000;
        autosaveIntervalEl.value = autosaveInterval;

        // Reset mission progress
        if (typeof missionSystem !== 'undefined' && missionSystem) {
            missionSystem.currentMissionIndex = 0;
            missionSystem.completedMissions = new Set();
            missionSystem.allMissionsComplete = false;
            missionSystem.updateMissionDisplay();
        }

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
            lifetimePrestiges: lifetimePrestiges,
            totalBallsDropped: totalBallsDropped,
            totalUpgrades: totalUpgrades,
            slotUpgradePurchases: slotUpgradePurchases,
            unlockedAchievements: unlockedAchievements,
            totalCriticalHits: totalCriticalHits,
            critUpgradePurchases: critUpgradePurchases,
            critUpgradeCost: critUpgradeCost,
            autosaveInterval: autosaveInterval,
            transcendCount: transcendCount,
            transcendCost: transcendCost,
            transcensionShards: transcensionShards,
            prestigeUpgradesUnlocked: prestigeUpgradesUnlocked,
            transcendUpgradesUnlocked: transcendUpgradesUnlocked,
            automationUnlocked: automationUnlocked,
            prestigeShardMultiplier: prestigeShardMultiplier,
            hasReached100k: hasReached100k,
            fancyEffectsEnabled: fancyEffectsEnabled,
            missionProgress: (typeof missionSystem !== 'undefined' && missionSystem) ? {
                currentMissionIndex: missionSystem.currentMissionIndex,
                completedMissions: Array.from(missionSystem.completedMissions),
                allMissionsComplete: missionSystem.allMissionsComplete
            } : null
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
            updateMultiplierDisplays();

            addBallCost = saveData.addBallCost || 2000;
            addBallCostEl.innerText = addBallCost;

            slotUpgradeCost = saveData.slotUpgradeCost || 1;
            slotUpgradeCostEl.innerText = slotUpgradeCost;

            balls.length = 0;
            for (let i = 0; i < (saveData.balls || 1); i++) {
                balls.push(new Ball(canvas.width / 2, 50, ballRadius));
            }

            prestigeCount = saveData.prestigeCount || 0;
            lifetimePrestiges = saveData.lifetimePrestiges || 0;
            totalBallsDropped = saveData.totalBallsDropped || 0;
            totalUpgrades = saveData.totalUpgrades || (saveData.addBallPurchases || 0) + (saveData.slotUpgradePurchases || 0);
            slotUpgradePurchases = saveData.slotUpgradePurchases || 0;
            unlockedAchievements = saveData.unlockedAchievements || [];
            totalCriticalHits = saveData.totalCriticalHits || 0;
            critUpgradePurchases = saveData.critUpgradePurchases || 0;
            critChanceEl.innerText = `Crit Chance: ${5 + critUpgradePurchases * 5}%`;
            critUpgradeCost = saveData.critUpgradeCost || 0.5;
            autosaveInterval = saveData.autosaveInterval || 60000;
            autosaveIntervalEl.value = autosaveInterval;
            transcendCount = saveData.transcendCount || 0;
            transcendCost = saveData.transcendCost || 5;
            transcensionShards = saveData.transcensionShards || 0;
            if (transcensionShardsEl) transcensionShardsEl.innerText = `Transcension Shards: ${transcensionShards}`;
            prestigeUpgradesUnlocked = saveData.prestigeUpgradesUnlocked || false;
            transcendUpgradesUnlocked = saveData.transcendUpgradesUnlocked || false;
            automationUnlocked = saveData.automationUnlocked || false;
            prestigeShardMultiplier = saveData.prestigeShardMultiplier || 1;
            hasReached100k = saveData.hasReached100k || false;
            fancyEffectsEnabled = saveData.fancyEffectsEnabled !== undefined ? saveData.fancyEffectsEnabled : true;
            fancyEffectsToggleEl.checked = fancyEffectsEnabled;
            if (window.backgroundEffects) {
                window.backgroundEffects.setEnabled(fancyEffectsEnabled);
            }

            // Load mission progress from import
            if (saveData.missionProgress !== undefined && typeof missionSystem !== 'undefined' && missionSystem) {
                missionSystem.currentMissionIndex = saveData.missionProgress.currentMissionIndex || 0;
                missionSystem.completedMissions = new Set(saveData.missionProgress.completedMissions || []);
                missionSystem.allMissionsComplete = saveData.missionProgress.allMissionsComplete || false;
                missionSystem.updateMissionDisplay();
            }

            // Set unlocked flags
            if (lifetimePrestiges > 0) {
                prestigeUpgradesUnlocked = true;
            }
            if (transcendCount >= 1) {
                transcendUpgradesUnlocked = true;
            }

            // Update visibility after import
            updateTranscendUpgradesVisibility();

            // Set displays
            prestigeUpgrades.style.display = prestigeUpgradesUnlocked ? "block" : "none";
            // transcendUpgrades visibility handled by updateTranscendUpgradesVisibility()

            // Show automation section if unlocked
            if (automationUnlocked) {
                const automationSection = document.getElementById("automationSection");
                if (automationSection) {
                    automationSection.style.display = "block";
                }
                const unlockAutomationBtn = document.getElementById("unlockAutomationBtn");
                if (unlockAutomationBtn) {
                    unlockAutomationBtn.style.display = "none";
                }
            }

            if (prestigeCount > 0) {
                prestigeBtn.classList.add('disabled');
            }

            prestigeBtn.style.display = "block";
            if (totalScore >= 100000) {
                prestigeBtn.classList.remove('disabled');
            } else {
                prestigeBtn.classList.add('disabled');
            }

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
            updateProgressBars();
            updatePrestigeTabVisibility();
            updateTranscendSectionVisibility();

            // Calculate next prestige threshold
            let nextThreshold = 0;
            let threshold = 100000;
            for (let i = 0; i <= prestigeCount; i++) {
                nextThreshold += threshold;
                threshold *= 2;
            }
            prestigeProgressFill.style.width = (Math.min(totalScore / nextThreshold, 1) * 100) + "%";

            prestigeBtn.style.display = "block";
            if (totalScore >= 100000) {
                prestigeBtn.classList.remove('disabled');
            } else {
                prestigeBtn.classList.add('disabled');
            }

            exportImportPopup.style.display = "none";
            updateTranscendUpgradesVisibility();
            showSavePopup("Save imported successfully");
        } catch (error) {
            showSavePopup("Import failed: Invalid save data");
            console.error("Import error:", error);
        }
    });

    closeExportImport.addEventListener("click", () => {
        exportImportPopup.style.display = "none";
    });
};