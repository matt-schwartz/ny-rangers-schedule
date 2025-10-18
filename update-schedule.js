import fs from 'fs';

// const TEAM_ID = 3; // NY Rangers team ID
const API_URL = `https://api-web.nhle.com/v1/club-schedule-season/NYR/now`;

async function fetchSchedule() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    // Get last completed game
    const lastGame = data.games
      .filter(game => game.gameState === 'OFF' || game.gameState === 'FINAL')
      .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))[0];

    // Get next 6 upcoming games
    const upcomingGames = data.games
      .filter(game => game.gameState === 'FUT' || game.gameState === 'PRE')
      .slice(0, 6);

    return { lastGame, upcomingGames };
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return null;
  }
}

function formatGame(game, isLast = false) {
  const date = new Date(game.gameDate);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();

  const isHome = game.homeTeam.abbrev === 'NYR';
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const nyrLogo = isHome ? game.homeTeam.logo : game.awayTeam.logo;
  const oppLogo = isHome ? game.awayTeam.logo : game.homeTeam.logo;
  const oppAbbrev = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev;
  const vsAt = isHome ? 'vs' : '@';

  let gameInfo = '';
  if (isLast && game.homeTeam.score !== undefined) {
    const rangerScore = isHome ? game.homeTeam.score : game.awayTeam.score;
    const oppScore = isHome ? game.awayTeam.score : game.homeTeam.score;
    const result = rangerScore > oppScore ? 'W' : (rangerScore < oppScore ? 'L' : 'T');
    const resultClass = rangerScore > oppScore ? 'win' : 'loss';
    gameInfo = `
      <div class="score ${resultClass}">
        <img src="${nyrLogo}" alt="NYR Logo"> NYR ${rangerScore} ${vsAt} ${oppAbbrev} ${oppScore} <img src="${oppLogo}" alt="Opponent Logo">
      </div>
    `;
  } else {
    const time = isLast ? '' : `<div class="game-time">${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET</div>`;
    const venue = isHome ? 'Madison Square Garden' : opponent.placeName?.default || 'Away Game';
    gameInfo = `
      <div class="opponent">${vsAt} ${opponent.commonName?.default || opponent.name?.default}</div>
      ${time}
      <div class="venue">${venue}</div>
    `;
  }

  return `
    <div class="game-card ${isLast ? 'last-game' : ''}">
      <div class="game-date">
        <div class="month">${month}</div>
        <div class="day">${day}</div>
      </div>
      <div class="game-info">
        ${gameInfo}
      </div>
    </div>
  `;
}

async function generateHTML() {
  const scheduleData = await fetchSchedule();

  if (!scheduleData) {
    console.error('Failed to fetch schedule data');
    return;
  }

  const { lastGame, upcomingGames } = scheduleData;
  const lastGameHtml = lastGame ? formatGame(lastGame, true) : '';
  const upcomingGamesHtml = upcomingGames.map(game => formatGame(game)).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NY Rangers Schedule</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        #schedule-container {
            width: 800px;
            height: 480px;
            background: linear-gradient(135deg, #0033A0 0%, #CE1126 100%);
            position: relative;
            overflow: hidden;
        }
        .header {
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 20px;
            text-align: center;
        }
        .logo {
            color: white;
            font-size: 28px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        .subtitle {
            color: #ffffff;
            font-size: 12px;
            margin-top: 5px;
            font-weight: 300;
        }
        .content-wrapper {
            padding: 15px 20px;
            height: 370px;
            overflow-y: auto;
        }
        .last-game {
            background: #FFF !important;
            border-left: 4px solid #FFD700 !important;
            margin-bottom: 12px;
        }
        .section-title {
            color: white;
            font-size: 14px;
            font-weight: bold;
            margin: 15px 0 10px 0;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
        .games-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        .game-card {
            background: #fff;
            border-radius: 8px;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.2s;
            border-left: 4px solid #CE1126;
        }
        .game-card:hover {
            transform: translateX(5px);
        }
        .game-date {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 55px;
        }
        .month {
            font-size: 12px;
            color: #0033A0;
            font-weight: bold;
            text-transform: uppercase;
        }
        .day {
            font-size: 22px;
            font-weight: bold;
            color: #CE1126;
            line-height: 1;
        }
        .game-info {
            flex: 1;
            margin-left: 12px;
        }
        .opponent {
            font-size: 14px;
            font-weight: bold;
            color: #0033A0;
            margin-bottom: 2px;
        }
        .game-time {
            font-size: 10px;
            color: #666;
        }
        .venue {
            font-size: 9px;
            color: #999;
            margin-top: 2px;
        }
        .score {
            display: flex;
            flex-direction: row;
            align-items: center;
            font-size: 22px;
            font-weight: bold;
            margin-top: 4px;
        }
        .score img {
            vertical-align: middle;
            height: 30px;
        }
        .score.win {
            color: #00AA00;
        }
        .score.loss {
            color: #CC0000;
        }
        .update-time {
            position: absolute;
            bottom: 8px;
            right: 12px;
            font-size: 9px;
            color: rgba(255, 255, 255, 0.6);
        }
    </style>
</head>
<body>
    <div id="schedule-container">
        <div class="header">
            <div class="logo">New York Rangers</div>
            <div class="subtitle">Schedule • 2025-26 Season</div>
        </div>
        <div class="content-wrapper">
            ${lastGameHtml ? '<div class="section-title">Last Game</div>' + lastGameHtml : ''}
            <div class="section-title">Upcoming Games</div>
            <div class="games-grid">
                ${upcomingGamesHtml}
            </div>
        </div>
        <div class="update-time">Updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</div>
    </div>
</body>
</html>`;

  fs.writeFileSync('index.html', html);
  console.log('Schedule updated successfully!');
}

generateHTML();
