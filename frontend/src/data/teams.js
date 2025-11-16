// Popular football teams with logos
export const popularTeams = [
  // Premier League
  { name: 'Arsenal', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png' },
  { name: 'Chelsea', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png' },
  { name: 'Liverpool', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png' },
  { name: 'Manchester City', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png' },
  { name: 'Manchester United', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png' },
  { name: 'Tottenham Hotspur', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Tottenham-Hotspur-Logo.png' },
  
  // La Liga
  { name: 'Barcelona', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png' },
  { name: 'Real Madrid', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png' },
  { name: 'Atletico Madrid', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Atletico-Madrid-Logo.png' },
  { name: 'Sevilla', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Sevilla-Logo.png' },
  { name: 'Valencia', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Valencia-Logo.png' },
  
  // Serie A
  { name: 'AC Milan', logo: 'https://logos-world.net/wp-content/uploads/2020/06/AC-Milan-Logo.png' },
  { name: 'Inter Milan', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Inter-Milan-Logo.png' },
  { name: 'Juventus', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Juventus-Logo.png' },
  { name: 'AS Roma', logo: 'https://logos-world.net/wp-content/uploads/2020/06/AS-Roma-Logo.png' },
  { name: 'Napoli', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Napoli-Logo.png' },
  
  // Bundesliga
  { name: 'Bayern Munich', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Bayern-Munich-Logo.png' },
  { name: 'Borussia Dortmund', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Borussia-Dortmund-Logo.png' },
  { name: 'RB Leipzig', logo: 'https://logos-world.net/wp-content/uploads/2020/06/RB-Leipzig-Logo.png' },
  
  // Ligue 1
  { name: 'Paris Saint-Germain', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Paris-Saint-Germain-Logo.png' },
  { name: 'Lyon', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Lyon-Logo.png' },
  { name: 'Marseille', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Marseille-Logo.png' },
  
  // Other Popular Teams
  { name: 'Ajax', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Ajax-Logo.png' },
  { name: 'Porto', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Porto-Logo.png' },
  { name: 'Benfica', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Benfica-Logo.png' },
  { name: 'Celtic', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Celtic-Logo.png' },
  { name: 'Rangers', logo: 'https://logos-world.net/wp-content/uploads/2020/06/Rangers-Logo.png' },
];

export const getTeamLogo = (teamName) => {
  const team = popularTeams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
  return team ? team.logo : null;
};

