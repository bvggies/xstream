// Countdown utility functions
export const calculateTimeRemaining = (targetDate) => {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const difference = target - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isExpired: true,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference,
    isExpired: false,
  };
};

export const formatCountdown = (timeRemaining) => {
  if (timeRemaining.isExpired) {
    return 'Match Started';
  }

  const { days, hours, minutes, seconds } = timeRemaining;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export const canAccessMatch = (matchDate) => {
  const now = new Date().getTime();
  const match = new Date(matchDate).getTime();
  const twoMinutesBefore = match - 2 * 60 * 1000; // 2 minutes in milliseconds
  
  return now >= twoMinutesBefore;
};

