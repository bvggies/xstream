// Popular football leagues with logos
export const popularLeagues = [
  {
    name: 'Premier League',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Premier-League-Logo.png',
    country: 'England'
  },
  {
    name: 'La Liga',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/La-Liga-Logo.png',
    country: 'Spain'
  },
  {
    name: 'Serie A',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Serie-A-Logo.png',
    country: 'Italy'
  },
  {
    name: 'Bundesliga',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Bundesliga-Logo.png',
    country: 'Germany'
  },
  {
    name: 'Ligue 1',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Ligue-1-Logo.png',
    country: 'France'
  },
  {
    name: 'Champions League',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/UEFA-Champions-League-Logo.png',
    country: 'Europe'
  },
  {
    name: 'Europa League',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/UEFA-Europa-League-Logo.png',
    country: 'Europe'
  },
  {
    name: 'Eredivisie',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Eredivisie-Logo.png',
    country: 'Netherlands'
  },
  {
    name: 'Primeira Liga',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Primeira-Liga-Logo.png',
    country: 'Portugal'
  },
  {
    name: 'Scottish Premiership',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Scottish-Premiership-Logo.png',
    country: 'Scotland'
  },
  {
    name: 'MLS',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/MLS-Logo.png',
    country: 'USA'
  },
  {
    name: 'Liga MX',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Liga-MX-Logo.png',
    country: 'Mexico'
  },
  {
    name: 'Brasileirão',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Brasileirao-Logo.png',
    country: 'Brazil'
  },
  {
    name: 'Argentine Primera División',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Argentine-Primera-Division-Logo.png',
    country: 'Argentina'
  },
];

export const getLeagueLogo = (leagueName) => {
  const league = popularLeagues.find(l => l.name.toLowerCase() === leagueName.toLowerCase());
  return league ? league.logo : null;
};

