// Achievements system for Plinko Idle
// Modular list of achievements - add new ones here

const achievements = [
    {
        id: "score_10k",
        name: "Welcome to Plinko!",
        description: "Open the game",
        condition: (state) => state.totalScore >= 0,
        unlocked: true
    },
    {
        id: "score_100k",
        name: "Fill The Bar",
        description: "Something might unlock...",
        condition: (state) => state.totalScore >= 100000,
        unlocked: false
    },
    {
        id: "score_1m",
        name: "Millionaire",
        description: "Reach 1,000,000 points",
        condition: (state) => state.totalScore >= 1000000,
        unlocked: false
    },
    {
        id: "balls_100",
        name: "Ball Dropper",
        description: "Drop 100 balls",
        condition: (state) => state.totalBallsDropped >= 100,
        unlocked: false
    },
    {
        id: "balls_1000",
        name: "Ball Enthusiast",
        description: "Drop 1,000 balls",
        condition: (state) => state.totalBallsDropped >= 1000,
        unlocked: false
    },
    {
        id: "prestige_1",
        name: "First Prestige",
        description: "Prestige for the first time",
        condition: (state) => state.prestigeCount >= 1,
        unlocked: false
    },
    {
        id: "prestige_5",
        name: "Prestige Veteran",
        description: "Prestige 5 times",
        condition: (state) => state.prestigeCount >= 5,
        unlocked: false
    },
    {
        id: "multiplier_5",
        name: "Multiplier Expert",
        description: "Reach x5.0 multiplier",
        condition: (state) => state.scoreMultiplier >= 5.0,
        unlocked: false
    },
    {
        id: "add_ball_5",
        name: "Ball Collector",
        description: "Buy a lot of balls!",
        condition: (state) => state.addBallPurchases >= 5,
        unlocked: false
    },
    {
        id: "slot_upgrade_5",
        name: "Slot Master",
        description: "Upgrade your slots a ton!",
        condition: (state) => state.slotUpgradePurchases >= 5,
        unlocked: false
    }
];

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = achievements;
} else {
    window.achievements = achievements;
}