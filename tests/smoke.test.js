const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");

// Syntax-check every project JavaScript file.
for (const file of fs.readdirSync(root).filter(name => name.endsWith(".js"))) {
  execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
}

// Load Decimal in a minimal browser-like context.
const decimalContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "decimal.js"), "utf8"), decimalContext);
const Decimal = decimalContext.window.Decimal;

assert.equal(Decimal.fromNumber(Infinity).toString(), "0");
assert.equal(Decimal.fromNumber(NaN).toString(), "0");
assert.equal(new Decimal(0, 0).toString(), "0");
assert.throws(() => Decimal.fromNumber(5).div(0), /division by zero/i);
assert.equal(Decimal.fromNumber(123).mulNumber(0).toString(), "0");
assert.equal(Decimal.fromNumber(2).mulNumber(5).toNumber(), 10);

// Load optional physics and verify zero-distance wall contacts cannot create NaN.
const physicsContext = {
  window: {
    canvas: { width: 800, height: 600 },
    horizontalSpacing: 50,
    colsStart: 5,
    rows: 10,
    verticalSpacing: 60,
    pegs: [],
    walls: [],
    slots: []
  }
};
vm.runInNewContext(fs.readFileSync(path.join(root, "physics.js"), "utf8"), physicsContext);
const Physics = physicsContext.window.Physics;
const ball = { x: 0, y: 0, r: 10, vx: 1, vy: 1 };
Physics.collideWall(ball, { x1: 0, y1: 0, x2: 100, y2: 0 });
assert.ok(Number.isFinite(ball.x) && Number.isFinite(ball.y));
assert.ok(Number.isFinite(ball.vx) && Number.isFinite(ball.vy));

// Regression checks for the main-loop hardening and game-design protection.
const main = fs.readFileSync(path.join(root, "main.js"), "utf8");
assert.match(main, /Math\.min\(\(currentTime - lastTime\) \/ 1000, 0\.05\)/);
assert.match(main, /guaranteedCrit = nonCritStreak >= 19/);
assert.match(main, /Math\.min\(50, 5 \+ critUpgradePurchases \* 5\)/);
assert.match(main, /sanitizeSaveData\(JSON\.parse\(json\)\)/);

console.log("Plinko Idle smoke tests passed.");
