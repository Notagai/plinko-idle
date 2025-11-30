// Mission System for Plinko Idle
// Modular mission system that shows one mission at a time

const MISSION_VERSION = '1.3'; // Increment when mission array changes

const missions = [
    {
        id: '100k_score',
        description: 'Reach 100,000 score to unlock Prestige',
        target: 'score',
        value: 100000
    },
    {
        id: '5x_multi',
        description: 'Reach 5x Prestige multiplier to unlock Transcendence',
        target: 'multiplier',
        value: 5
    }
];

class MissionSystem {
    constructor() {
        this.currentMissionIndex = 0;
        this.completedMissions = new Set();
        this.missionBox = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.boxStartX = 0;
        this.boxStartY = 0;
        this.allMissionsComplete = false;
        this.init();
    }

    init() {
        this.createMissionBox();
        this.updateMissionDisplay();
    }

    createMissionBox() {
        // Create mission box element
        this.missionBox = document.createElement('div');
        this.missionBox.id = 'missionBox';
        this.missionBox.innerHTML = `
            <div class="mission-header">
                <span class="mission-title">Mission</span>
            </div>
            <div class="mission-content">
                <div class="mission-description"></div>
                <div class="mission-progress">
                    <div class="mission-progress-bar">
                        <div class="mission-progress-fill"></div>
                    </div>
                    <div class="mission-progress-text"></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.missionBox);

        // Set initial position to bottom-right
        this.missionBox.style.right = '20px';
        this.missionBox.style.bottom = '20px';
        this.missionBox.style.left = 'auto';
        this.missionBox.style.top = 'auto';

        // Make the header draggable
        const header = this.missionBox.querySelector('.mission-header');
        header.style.cursor = 'move';

        header.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            const rect = this.missionBox.getBoundingClientRect();
            this.boxStartX = rect.left;
            this.boxStartY = rect.top;
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.dragStartX;
                const deltaY = e.clientY - this.dragStartY;
                const newLeft = Math.max(20, Math.min(window.innerWidth - this.missionBox.offsetWidth - 20, this.boxStartX + deltaX));
                const newTop = Math.max(20, Math.min(window.innerHeight - this.missionBox.offsetHeight - 20, this.boxStartY + deltaY));
                this.missionBox.style.left = newLeft + 'px';
                this.missionBox.style.top = newTop + 'px';
                this.missionBox.style.right = 'auto';
                this.missionBox.style.bottom = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            document.body.style.userSelect = '';
        });
    }

    getCurrentMission() {
        if (this.allMissionsComplete) {
            return null;
        }
        return missions[this.currentMissionIndex];
    }

    checkMissionProgress(gameState) {
        if (this.allMissionsComplete) {
            return;
        }
        const mission = this.getCurrentMission();
        if (!mission || this.completedMissions.has(mission.id)) {
            return;
        }

        let currentValue = 0;
        switch (mission.target) {
            case 'score':
                currentValue = gameState.totalScore || 0;
                break;
            case 'lifetime_score':
                currentValue = gameState.lifetimeScore || 0;
                break;
            case 'balls':
                currentValue = gameState.balls?.length || 0;
                break;
            case 'upgrades':
                currentValue = gameState.totalUpgrades || 0;
                break;
            case 'critical_hits':
                currentValue = gameState.totalCriticalHits || 0;
                break;
            case 'multiplier':
                currentValue = gameState.scoreMultiplier || 1;
                break;
            default:
                currentValue = 0;
        }

        const progress = Math.min(currentValue / mission.value, 1);
        this.updateProgressBar(progress, currentValue, mission.value);

        if (currentValue >= mission.value) {
            this.completeMission(mission, gameState);
        }
    }

    completeMission(mission, gameState) {
        this.completedMissions.add(mission.id);

        // Show completion notification using the same style as save popup
        this.showMissionComplete(mission);

        // Move to next mission
        this.currentMissionIndex++;
        if (this.currentMissionIndex >= missions.length) {
            this.allMissionsComplete = true;
        }

        // Update display after a delay
        setTimeout(() => {
            this.updateMissionDisplay();
        }, 2000);
    }

    showMissionComplete(mission) {
        // Use the same popup style as the save notification
        const savePopup = document.getElementById("savePopup");
        const savePopupMsg = savePopup.querySelector(".msg");

        if (savePopup && savePopupMsg) {
            const missionDesc = window.applyGradientColors ? window.applyGradientColors(mission.description) : mission.description;
            savePopupMsg.innerHTML = `Mission Complete: ${missionDesc}!`;
            savePopup.style.display = "flex";

            // Auto-hide after 3 seconds
            setTimeout(() => {
                savePopup.style.display = "none";
            }, 3000);
        }
    }

    updateProgressBar(progress, current, target) {
        const progressFill = this.missionBox.querySelector('.mission-progress-fill');
        const progressText = this.missionBox.querySelector('.mission-progress-text');
        
        if (progressFill) {
            progressFill.style.width = (progress * 100) + '%';
        }
        
        if (progressText) {
            progressText.textContent = `${Math.floor(current).toLocaleString()} / ${target.toLocaleString()}`;
        }
    }

    updateMissionDisplay() {
        const mission = this.getCurrentMission();

        const missionName = this.missionBox.querySelector('.mission-name');
        const missionDescription = this.missionBox.querySelector('.mission-description');

        if (!mission) {
            // All missions complete
            if (missionName) {
                missionName.innerHTML = 'All Missions Complete';
            }
            if (missionDescription) {
                missionDescription.innerHTML = 'Congratulations! You have completed all available missions.';
            }
            // Hide progress bar
            const progressBar = this.missionBox.querySelector('.mission-progress');
            if (progressBar) {
                progressBar.style.display = 'none';
            }
            return;
        }

        // Show progress bar
        const progressBar = this.missionBox.querySelector('.mission-progress');
        if (progressBar) {
            progressBar.style.display = 'block';
        }

        if (missionName) {
            missionName.innerHTML = window.applyGradientColors ? window.applyGradientColors(mission.name) : mission.name;
        }

        if (missionDescription) {
            missionDescription.innerHTML = window.applyGradientColors ? window.applyGradientColors(mission.description) : mission.description;
        }

        // Reset progress bar
        this.updateProgressBar(0, 0, mission.value);
    }


    // Method to be called from main game loop to check progress
    update(gameState) {
        this.checkMissionProgress(gameState);
    }
}

// Export for use in main game
window.MissionSystem = MissionSystem;