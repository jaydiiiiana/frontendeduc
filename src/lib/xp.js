/**
 * Calculates the level based on total EXP with a progressive scale.
 * Formula: Level 1 (0-99), Level 2 (100-249), Level 3 (250-449), etc.
 * Required EXP increases by +50 for each level.
 */

const BASE_XP = 100;
const INCREMENT = 50;
const MAX_LEVEL = 100;

export const calculateLevel = (totalXp) => {
  if (totalXp < 0) return 1;
  
  let level = 1;
  let xpNeededForNext = BASE_XP;
  let accumulatedXp = 0;

  while (totalXp >= accumulatedXp + xpNeededForNext && level < MAX_LEVEL) {
    accumulatedXp += xpNeededForNext;
    level++;
    xpNeededForNext = BASE_XP + (level - 1) * INCREMENT;
  }
  
  return level;
};

export const getXpProgress = (totalXp) => {
  let level = 1;
  let xpNeededForNext = BASE_XP;
  let accumulatedXp = 0;

  while (totalXp >= accumulatedXp + xpNeededForNext && level < MAX_LEVEL) {
    accumulatedXp += xpNeededForNext;
    level++;
    xpNeededForNext = BASE_XP + (level - 1) * INCREMENT;
  }

  // If at max level, progress is 100%
  if (level === MAX_LEVEL) {
    return {
      level,
      currentLevelXp: totalXp - accumulatedXp,
      xpNeededForNext: "MAX",
      percentage: 100
    };
  }

  const currentLevelXp = totalXp - accumulatedXp;
  const percentage = Math.min(Math.round((currentLevelXp / xpNeededForNext) * 100), 100);

  return {
    level,
    currentLevelXp,
    xpNeededForNext,
    percentage
  };
};
