// Achievement System
const ACHIEVEMENTS = [
  {
    id: 'first_element',
    title: 'First Step',
    description: 'Correctly identify your first element',
    icon: 'ri-seedling-line',
    condition: (stats) => stats.correct >= 1,
    unlocked: false
  },
  {
    id: 'ten_elements',
    title: 'Getting Started',
    description: 'Correctly identify 10 elements in a single run',
    icon: 'ri-plant-line',
    condition: (stats) => stats.correct >= 10,
    unlocked: false
  },
  {
    id: 'fifty_elements',
    title: 'Half Way There',
    description: 'Correctly identify 50 elements in a single run',
    icon: 'ri-leaf-line',
    condition: (stats) => stats.correct >= 50,
    unlocked: false
  },
  {
    id: 'complete_table',
    title: 'Full Table',
    description: 'Complete all 118 elements',
    icon: 'ri-trophy-line',
    condition: (stats) => stats.challengeComplete && stats.correct === 118,
    unlocked: false
  },
  {
    id: 'perfect_run',
    title: 'Perfectionist',
    description: 'Complete all 118 elements with zero mistakes',
    icon: 'ri-star-line',
    condition: (stats) => stats.challengeComplete && stats.correct === 118 && stats.mistakes === 0,
    unlocked: false
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete all 118 elements in under 5 minutes',
    icon: 'ri-flashlight-line',
    condition: (stats) => stats.challengeComplete && stats.correct === 118 && stats.time < 300,
    unlocked: false
  },
  {
    id: 'streak_10',
    title: '10x Streak',
    description: 'Get 10 correct answers in a row',
    icon: 'ri-fire-line',
    condition: (stats) => stats.maxStreak >= 10,
    unlocked: false
  },
  {
    id: 'streak_25',
    title: '25x Streak Master',
    description: 'Get 25 correct answers in a row',
    icon: 'ri-fire-fill',
    condition: (stats) => stats.maxStreak >= 25,
    unlocked: false
  },
  {
    id: 'streak_all',
    title: 'Flawless Run',
    description: 'Get all 118 correct in a row without breaking your streak',
    icon: 'ri-shining-line',
    condition: (stats) => stats.maxStreak >= 118,
    unlocked: false
  },
  {
    id: 'first_milestone',
    title: 'First Milestone',
    description: 'Reach 10,000 points',
    icon: 'ri-medal-line',
    condition: (stats) => stats.score >= 10000,
    unlocked: false
  },
  {
    id: 'half_century',
    title: 'Half Century',
    description: 'Reach 50,000 points',
    icon: 'ri-medal-2-line',
    condition: (stats) => stats.score >= 50000,
    unlocked: false
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Reach 100,000 points',
    icon: 'ri-vip-crown-line',
    condition: (stats) => stats.score >= 100000,
    unlocked: false
  },
  {
    id: 'five_challenges',
    title: 'Dedicated',
    description: 'Complete 5 challenges',
    icon: 'ri-calendar-check-line',
    condition: (stats) => stats.totalChallenges >= 5,
    unlocked: false
  },
  {
    id: 'twenty_challenges',
    title: 'Veteran',
    description: 'Complete 20 challenges',
    icon: 'ri-award-line',
    condition: (stats) => stats.totalChallenges >= 20,
    unlocked: false
  },
  {
    id: 'fast_learner',
    title: 'Fast Learner',
    description: 'Average under 3 seconds per element across all 118',
    icon: 'ri-rocket-line',
    condition: (stats) => stats.challengeComplete && stats.correct === 118 && (stats.time / 118) < 3,
    unlocked: false
  },
  {
    id: 'comeback_kid',
    title: 'Comeback Kid',
    description: 'Score 50,000+ despite making 5 or more mistakes',
    icon: 'ri-emotion-laugh-line',
    condition: (stats) => stats.score >= 50000 && stats.mistakes >= 5,
    unlocked: false
  }
];

class AchievementManager {
  constructor() {
    this.achievements = [...ACHIEVEMENTS];
    this.loadAchievements();
    this.newUnlocks = [];
  }

  loadAchievements() {
    const saved = localStorage.getItem('achievements');
    if (saved) {
      const savedData = JSON.parse(saved);
      this.achievements.forEach(achievement => {
        const savedAchievement = savedData.find(a => a.id === achievement.id);
        if (savedAchievement) {
          achievement.unlocked = savedAchievement.unlocked;
          achievement.unlockedAt = savedAchievement.unlockedAt;
        }
      });
    }
  }

  saveAchievements() {
    const data = this.achievements.map(a => ({
      id: a.id,
      unlocked: a.unlocked,
      unlockedAt: a.unlockedAt
    }));
    localStorage.setItem('achievements', JSON.stringify(data));
  }

  checkAchievements(stats) {
    this.newUnlocks = [];
    
    this.achievements.forEach(achievement => {
      if (!achievement.unlocked && achievement.condition(stats)) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.newUnlocks.push(achievement);
      }
    });

    if (this.newUnlocks.length > 0) {
      this.saveAchievements();
      this.updateBadge();
    }

    return this.newUnlocks;
  }

  showAchievementToast(achievement) {
    const toast = document.getElementById('achievementToast');
    const title = toast.querySelector('.achievement-title');
    const description = toast.querySelector('.achievement-description');
    const icon = toast.querySelector('.achievement-icon i');

    title.textContent = achievement.title;
    description.textContent = achievement.description;
    icon.className = achievement.icon;

    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

  getUnlockedCount() {
    return this.achievements.filter(a => a.unlocked).length;
  }

  getTotalCount() {
    return this.achievements.length;
  }

  updateBadge() {
    const badge = document.getElementById('achievementBadge');
    const unlockedCount = this.getUnlockedCount();
    
    if (unlockedCount > 0) {
      badge.textContent = unlockedCount;
      badge.classList.remove('hidden');
    }
  }

  renderAchievements() {
    const container = document.getElementById('achievementsModalBody');
    
    if (this.achievements.length === 0) {
      container.innerHTML = `
        <div class="achievements-empty">
          <i class="ri-medal-line"></i>
          <p>No achievements yet.<br>Start practicing to unlock them!</p>
        </div>
      `;
      return;
    }

    const unlockedAchievements = this.achievements.filter(a => a.unlocked);
    const lockedAchievements = this.achievements.filter(a => !a.unlocked);
    
    const sortedAchievements = [...unlockedAchievements, ...lockedAchievements];

    container.innerHTML = `
      <div class="achievements-stats" style="margin-bottom: 24px; text-align: center;">
        <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
          Unlocked ${this.getUnlockedCount()} of ${this.getTotalCount()} achievements
        </div>
        <div style="background: var(--bg-tertiary); height: 8px; border-radius: 999px; overflow: hidden;">
          <div style="height: 100%; background: var(--accent-gradient); width: ${(this.getUnlockedCount() / this.getTotalCount()) * 100}%; transition: width 300ms ease;"></div>
        </div>
      </div>
      <div class="achievements-grid">
        ${sortedAchievements.map(achievement => `
          <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-card-icon">
              <i class="${achievement.icon}"></i>
            </div>
            <div class="achievement-card-title">${achievement.title}</div>
            <div class="achievement-card-description">${achievement.description}</div>
            ${achievement.unlocked && achievement.unlockedAt ? `
              <div style="margin-top: 8px; font-size: 10px; color: var(--text-tertiary);">
                ${new Date(achievement.unlockedAt).toLocaleDateString()}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
}

// Initialize global achievement manager
const achievementManager = new AchievementManager();