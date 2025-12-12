(function(window){
    const Physics = {};

    Physics.makePegs = function(){
        const canvas = window.canvas;
        const horizontalSpacing = window.horizontalSpacing;
        const colsStart = window.colsStart;
        const rows = window.rows;
        const verticalSpacing = window.verticalSpacing;
        const pegs = window.pegs;
        pegs.length = 0;

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
    };

    Physics.buildWalls = function(){
        const pegs = window.pegs;
        const walls = window.walls;
        const colsStart = window.colsStart;
        const rows = window.rows;
        walls.length = 0;
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
    };

    Physics.buildSlots = function(){
        const pegs = window.pegs;
        const slots = window.slots;
        slots.length = 0;
        const colsStart = window.colsStart;
        const rows = window.rows;
        const verticalSpacing = window.verticalSpacing;

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
                color: `rgb(${r},${g},0)`,
                offsetY: 0
            });
        }
    };

    Physics.collideWall = function(ball, wall){
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

            ball.vx *= window.friction || 0.995;
            ball.vy *= window.friction || 0.995;
        }
    };

    // Ball class uses window variables for environment
    Physics.Ball = class {
        constructor(x, y, r) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = 1 + Math.random() * 2;
        }

        update() {
            const delta = window.delta || 0.6;
            const gravity = window.gravity || 0.2;
            this.vy += gravity * delta;
            this.x += this.vx * delta;
            this.y += this.vy * delta;

            // peg collisions
            const pegs = window.pegs || [];
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

                    this.vx *= window.friction || 0.995;
                    this.vy *= window.friction || 0.995;
                }
            }

            // wall collisions
            const walls = window.walls || [];
            for (let w of walls) {
                Physics.collideWall(this, w);
            }

            // scoring callback if present
            if (typeof window.checkScore === 'function') window.checkScore(this);
        }

        draw() {
            const ctx = window.ctx;
            if (!ctx) return;
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    window.Physics = Physics;
})(window);