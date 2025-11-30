// Achievements system for Plinko Idle
// Modular list of achievements - add new ones here

const achievements = [
    { //welcome
        id: "welcome",
        name: "Welcome to Plinko!",
        description: "Welcome to the game!",
        hint: "\"It's a slippery slope from here.\"",
        condition: (state) => state.totalScore >= 0,
        unlocked: false
    },
    { //score-pres
        id: "score_500",
        name: "First Points",
        description: "Score some points",
        hint: "\"How many did you get?\"",
        condition: (state) => state.totalScore >= 500,
        unlocked: false
    },
    {
        id: "score_100k",
        name: "A Tenth of a Million",
        description: "Score 100,000 points in one prestige.",
        hint: "\"While it seems like a lot, the big numbers only get bigger from here.\"",
        condition: (state) => state.totalScore >= 100000,
        unlocked: false
    },
    {
        id: "score_1m",
        name: "A Millionaire!",
        description: "Score a million points in one prestige!",
        hint: "\"You're getting there!\"",
        condition: (state) => state.totalScore >= 1000000,
        unlocked: false
    },
    { //score-life
        id: "score_1m_lifetime",
        name: "Sad Millionaire",
        description: "Score a million points... just not in one prestige. (Lifetime)",
        hint: "\"How many times are you gonna keep resetting?\"",
        condition: (state) => state.lifetimeScore >= 1000000,
        unlocked: false
    },
    {
        id: "score_10m",
        name: "Ten Million!",
        description: "Score ten million points in your lifetime.",
        hint: "\"Now we're talking! Maybe gambling has paid off after all!\"",
        condition: (state) => state.lifetimeScore >= 10000000,
        unlocked: false
    },
    {
        id: "score_100m",
        name: "Hundred Millionaire",
        description: "Score a hundred million points in your lifetime.",
        hint: "\"You're a millionaire now, but you're not done yet!\"",
        condition: (state) => state.lifetimeScore >= 100000000,
        unlocked: false
    },
    { //ball
        id: "balls_10",
        name: "Ten Balls!",
        description: "Drop ten balls!",
        hint: "\"Ten isn't enough for making a new generation, let alone generational wealth\"",
        condition: (state) => state.totalBallsDropped >= 10,
        unlocked: false
    },
    {
        id: "balls_100",
        name: "A Hundred Balls!",
        description: "Drop a hundred balls in one prestige!",
        hint: "\"You're on your way to becoming a millionaire!\"",
        condition: (state) => state.totalBallsDropped >= 100,
        unlocked: false
    },
    {
        id: "balls_1000",
        name: "A Thousand Balls!",
        description: "Drop a thousand balls in one prestige!",
        hint: "\"Are you a millionaire yet?\"",
        condition: (state) => state.totalBallsDropped >= 1000,
        unlocked: false
    },
    { //balls-life
        id: "balls_1000_lifetime",
        name: "A Sad Thousand Balls!",
        description: "Drop a thousand balls in your lifetime!",
        hint: "\"Nice... how long did this take?\"",
        condition: (state) => state.totalBallsDropped >= 1000,
        unlocked: false
    },
    {
        id: "balls_10000",
        name: "Ten Thousand Balls!",
        description: "Drop ten thousand balls in your lifetime!",
        hint: "\"Time doesn't matter to you anymore, does it?\"",
        condition: (state) => state.totalBallsDropped >= 10000,
        unlocked: false
    },
    { //upg
        id: "upgrades_1",
        name: "First Upgrade",
        description: "Buy an upgrade!",
        hint: "Purchase 1 upgrade",
        condition: (state) => state.totalUpgrades >= 1,
        unlocked: false
    },
    {
        id: "upgrades_10",
        name: "Ten Times",
        description: "Buy 10 upgrades. (lifetime)",
        hint: "\"You'll need a lot more to get far...\"",
        condition: (state) => state.totalUpgrades >= 10,
        unlocked: false
    },
    {
        id: "upgrades_100",
        name: "A Hundred Of Them!",
        description: "Buy a hundred upgrades!",
        hint: "\"You've got it, keep doing that!\"",
        condition: (state) => state.totalUpgrades >= 100,
        unlocked: false
    },
    {
        id: "upgrades_1000",
        name: "Thousands and Thousands",
        description: "Buy a thousand upgrades!",
        hint: "\"I don't even know how you do this\"",
        condition: (state) => state.totalUpgrades >= 1000,
        unlocked: false
    },
    { //pres
        id: "prestige_1",
        name: "First Prestige",
        description: "Prestige for the first time",
        hint: "\"Prestige!!\"",
        condition: (state) => state.prestigeCount >= 1,
        unlocked: false
    },
    {
        id: "prestige_10",
        name: "Ten Prestiges",
        description: "Prestige ten times",
        hint: "\"You're getting good at this!\"",
        condition: (state) => state.prestigeCount >= 10,
        unlocked: false
    },
    {
        id: "prestige_25",
        name: "Twenty-Five Prestiges",
        description: "Prestige twenty-five times",
        hint: "\"This game is a game. And games are fun, it seems.\"",
        condition: (state) => state.prestigeCount >= 25,
        unlocked: false
    },
    {
        id: "prestige_50",
        name: "Fifty Prestiges",
        description: "Prestige fifty times",
        hint: "\"Prestiging is second nature to you now, isn't it?\"",
        condition: (state) => state.prestigeCount >= 50,
        unlocked: false
    },
    {
        id: "prestige_100",
        name: "A Hundred Prestiges",
        description: "Prestige a hundred times",
        hint: "\"\"Gambling on and on, never seeming to stop.\"-The Art of War, Sun Tzu\"",
        condition: (state) => state.prestigeCount >= 100,
        unlocked: false
    },
    { //transcend
        id: "transcend_1",
        name: "First Transcendence",
        description: "Transcend for the first time",
        hint: "\"Beyond the veil of reality, there is you.\"",
        condition: (state) => state.transcendCount >= 1,
        unlocked: false
    },
    {
        id: "transcend_5",
        name: "Five Transcendences",
        description: "Transcend five times",
        hint: "\"Your reality is becoming abstract.\"",
        condition: (state) => state.transcendCount >= 5,
        unlocked: false
    },
    {
        id: "transcend_10",
        name: "Ten Transcendences",
        description: "Transcend ten times",
        hint: "\"Do you even remember what reality is anymore?\"",
        condition: (state) => state.transcendCount >= 10,
        unlocked: false
    },
    {
        id: "transcend_25",
        name: "Twenty-Five Transcendences",
        description: "Transcend twenty-five times",
        hint: "\"You broke physics. Not the plinko ones though, I spent way too long getting that to work.\"",
        condition: (state) => state.transcendCount >= 25,
        unlocked: false
    },
    {
        id: "transcend_50",
        name: "Fifty Transcendences",
        description: "Transcend fifty times",
        hint: "\"Do you miss your family?\"",
        condition: (state) => state.transcendCount >= 50,
        unlocked: false
    },
    {
        id: "transcend_100",
        name: "A Hundred Transcendences",
        description: "Transcend a hundred times",
        hint: "\"What is a family?\"",
        condition: (state) => state.transcendCount >= 100,
        unlocked: false
    },
];

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = achievements;
} else {
    window.achievements = achievements;
}