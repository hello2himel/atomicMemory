// Scoring System

// Rank tiers
const RANKS = [
  { name: 'Novice', min: 0, max: 10000, color: '#94a3b8' },
  { name: 'Apprentice', min: 10001, max: 25000, color: '#06b6d4' },
  { name: 'Chemist', min: 25001, max: 50000, color: '#3b82f6' },
  { name: 'Expert', min: 50001, max: 75000, color: '#8b5cf6' },
  { name: 'Master', min: 75001, max: 100000, color: '#f59e0b' },
  { name: 'Grand Master', min: 100001, max: 150000, color: '#ef4444' },
  { name: 'Legendary', min: 150001, max: Infinity, color: '#10b981' }
];

// Scoring constants
const SCORING = {
  BASE_MULTIPLIER: 1000,
  FIRST_TRY_BONUS: 50,
  STREAK_BONUS: 10,
  PERFECT_BONUS: 1000,
  SPEED_BONUS: 500, // For under 5 minutes on full table
  
  MISTAKE_PENALTY: {
    FIRST: 50,
    SECOND: 100,
    THIRD: 200
  },
  
  HINT_PENALTY: {
    SMALL: 25,
    MEDIUM: 50,
    LARGE: 150
  }
};

class ScoringSystem {
  constructor() {
    this.score = 0;
    this.baseScore = 0;
    this.bonusPoints = 0;
    this.penaltyPoints = 0;
    
    this.streak = 0;
    this.maxStreak = 0;
    this.firstTryCount = 0;
    this.hintsUsed = 0;
    
    this.elementScores = new Map(); // Track per-element scoring
  }

  reset() {
    this.score = 0;
    this.baseScore = 0;
    this.bonusPoints = 0;
    this.penaltyPoints = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.firstTryCount = 0;
    this.hintsUsed = 0;
    this.elementScores.clear();
  }

  calculateBaseScore(elementsCompleted, timeInSeconds) {
    if (timeInSeconds === 0) return 0;
    
    // Type Rate = Elements / Time
    const typeRate = elementsCompleted / timeInSeconds;
    
    // Base Score = Type Rate × Multiplier (linear scaling)
    const base = typeRate * SCORING.BASE_MULTIPLIER;
    
    return Math.round(base);
  }

  addCorrectAnswer(elementId, attemptCount, timeForElement) {
    // Base points for correct answer
    let points = 0;
    
    // First try bonus
    if (attemptCount === 1) {
      points += SCORING.FIRST_TRY_BONUS;
      this.firstTryCount++;
      this.bonusPoints += SCORING.FIRST_TRY_BONUS;
    }
    
    // Streak bonus
    this.streak++;
    if (this.streak > this.maxStreak) {
      this.maxStreak = this.streak;
    }
    
    if (this.streak > 1) {
      const streakBonus = SCORING.STREAK_BONUS * Math.min(this.streak, 10);
      points += streakBonus;
      this.bonusPoints += streakBonus;
    }
    
    // Store element score
    this.elementScores.set(elementId, {
      points,
      attemptCount,
      time: timeForElement
    });
    
    this.score += points;
    return points;
  }

  addMistake(elementId, mistakeNumber) {
    let penalty = 0;
    
    switch (mistakeNumber) {
      case 1:
        penalty = SCORING.MISTAKE_PENALTY.FIRST;
        break;
      case 2:
        penalty = SCORING.MISTAKE_PENALTY.SECOND;
        break;
      default:
        penalty = SCORING.MISTAKE_PENALTY.THIRD;
    }
    
    this.penaltyPoints += penalty;
    this.score -= penalty;
    this.streak = 0; // Reset streak on mistake
    
    return -penalty;
  }

  addHintPenalty(hintType = 'SMALL') {
    const penalty = SCORING.HINT_PENALTY[hintType] || SCORING.HINT_PENALTY.SMALL;
    this.penaltyPoints += penalty;
    this.score -= penalty;
    this.hintsUsed++;
    
    return -penalty;
  }

  calculateFinalScore(elementsCompleted, timeInSeconds, totalMistakes) {
    // Calculate base score
    this.baseScore = this.calculateBaseScore(elementsCompleted, timeInSeconds);
    
    // Add base score to total
    let finalScore = this.baseScore + this.bonusPoints - this.penaltyPoints;
    
    // Perfect run bonus (no mistakes)
    if (totalMistakes === 0 && elementsCompleted > 0) {
      finalScore += SCORING.PERFECT_BONUS;
      this.bonusPoints += SCORING.PERFECT_BONUS;
    }
    
    // Speed bonus (under 5 minutes for full table)
    if (elementsCompleted === 118 && timeInSeconds < 300) {
      finalScore += SCORING.SPEED_BONUS;
      this.bonusPoints += SCORING.SPEED_BONUS;
    }
    
    this.score = Math.max(0, Math.round(finalScore));
    return this.score;
  }

  getRank() {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (this.score >= RANKS[i].min) {
        return RANKS[i];
      }
    }
    return RANKS[0];
  }

  getNextRank() {
    const currentRank = this.getRank();
    const currentIndex = RANKS.findIndex(r => r.name === currentRank.name);
    
    if (currentIndex < RANKS.length - 1) {
      return RANKS[currentIndex + 1];
    }
    
    return null; // Already at max rank
  }

  getProgressToNextRank() {
    const currentRank = this.getRank();
    const nextRank = this.getNextRank();
    
    if (!nextRank) return 100;
    
    const rangeSize = nextRank.min - currentRank.min;
    const progress = this.score - currentRank.min;
    
    return Math.round((progress / rangeSize) * 100);
  }

  formatScore(score) {
    return score.toLocaleString();
  }

  showScoreChange(points, x, y) {
    const floater = document.getElementById('scoreFloater');
    
    floater.textContent = points > 0 ? `+${points}` : points;
    floater.className = 'score-floater ' + (points > 0 ? 'positive' : 'negative');
    floater.style.left = `${x}px`;
    floater.style.top = `${y}px`;
    floater.classList.remove('hidden');
    
    setTimeout(() => {
      floater.classList.add('hidden');
    }, 1000);
  }

  updateScoreDisplay() {
    const scoreDisplay = document.getElementById('currentScore');
    const rankDisplay = document.getElementById('currentRank');
    const progressText = document.getElementById('scoreProgress');
    
    if (scoreDisplay) {
      scoreDisplay.textContent = this.formatScore(this.score);
      scoreDisplay.style.animation = 'none';
      setTimeout(() => {
        scoreDisplay.style.animation = '';
      }, 10);
    }
    
    if (rankDisplay) {
      const rank = this.getRank();
      rankDisplay.textContent = rank.name;
      rankDisplay.style.background = `linear-gradient(135deg, ${rank.color} 0%, ${rank.color}dd 100%)`;
    }
    
    if (progressText) {
      const nextRank = this.getNextRank();
      if (nextRank) {
        const pointsNeeded = nextRank.min - this.score;
        progressText.textContent = `${pointsNeeded.toLocaleString()} points to ${nextRank.name}`;
      } else {
        progressText.textContent = 'Maximum rank achieved!';
      }
    }
  }

  saveScore(config, elementsCount, time, mistakes) {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    
    const entry = {
      score: this.score,
      rank: this.getRank().name,
      elementsCount: elementsCount,
      time: time,
      mistakes: mistakes,
      accuracy: mistakes === 0 ? 100 : Math.round(((elementsCount / (elementsCount + mistakes)) * 100)),
      maxStreak: this.maxStreak,
      date: Date.now()
    };
    
    leaderboard.unshift(entry);
    
    // Keep top 100 scores
    if (leaderboard.length > 100) {
      leaderboard.splice(100);
    }
    
    // Sort by score
    leaderboard.sort((a, b) => b.score - a.score);
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    
    return entry;
  }

  getTopScores(limit = 10) {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    return leaderboard.slice(0, limit);
  }

  getPersonalBest() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    
    if (leaderboard.length === 0) return null;
    
    return leaderboard.reduce((best, current) => {
      return current.score > best.score ? current : best;
    });
  }
}

// Initialize global scoring system
const scoringSystem = new ScoringSystem();