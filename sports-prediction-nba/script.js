document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_KEY_STORAGE_KEY = 'nba_odds_api_key';
    let apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);

    // State
    let liveScores = [];
    let predictions = [];
    let featuredGame = null;

    // Mock Data (Fallback)
    const mockLiveScores = [
        { home: 'LAL', away: 'GSW', score: '102-98', time: 'Q4 2:30', isLive: true },
        { home: 'BOS', away: 'MIA', score: '45-42', time: 'Q2 5:15', isLive: true },
        { home: 'NYK', away: 'BKN', score: '0-0', time: '7:00 PM', isLive: false },
        { home: 'DEN', away: 'PHX', score: '112-108', time: 'Final', isLive: false },
        { home: 'DAL', away: 'HOU', score: '0-0', time: '8:30 PM', isLive: false }
    ];

    const mockFeaturedGame = {
        home: { name: 'Boston Celtics', code: 'BOS', record: '45-12', color: '#007A33' },
        away: { name: 'Milwaukee Bucks', code: 'MIL', record: '40-17', color: '#00471B' },
        time: '7:30 PM ET',
        venue: 'TD Garden',
        odds: { spread: 'BOS -4.5', total: '228.5', moneyline: '-180' },
        stats: [
            { label: 'Win Probability', value: 68, homeVal: '68%', awayVal: '32%' },
            { label: 'Public Betting', value: 55, homeVal: '55%', awayVal: '45%' },
            { label: 'Power Ranking', value: 90, homeVal: '#1', awayVal: '#3' }
        ]
    };

    const mockPredictions = [
        {
            id: 1,
            home: 'LAL',
            away: 'GSW',
            pick: 'Lakers -2.5',
            odds: '-110',
            confidence: 85,
            type: 'high-confidence',
            analysis: 'Lakers are 8-2 ATS in their last 10 home games.'
        },
        {
            id: 2,
            home: 'PHX',
            away: 'DEN',
            pick: 'Over 230.5',
            odds: '-110',
            confidence: 72,
            type: 'all',
            analysis: 'Both teams averaging 120+ PPG in last 5 matchups.'
        },
        {
            id: 3,
            home: 'MIA',
            away: 'ORL',
            pick: 'Magic ML',
            odds: '+145',
            confidence: 60,
            type: 'underdog',
            analysis: 'Heat resting key starters tonight.'
        }
    ];

    // Initialize
    init();

    async function init() {
        setupEventListeners();

        if (apiKey) {
            await fetchData();
        } else {
            console.log('No API Key found, using mock data.');
            useMockData();
        }
    }

    function setupEventListeners() {
        // Filter Buttons
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderPredictions(btn.dataset.filter);
            });
        });

        // API Key Button
        const apiKeyBtn = document.getElementById('api-key-btn');
        if (apiKeyBtn) {
            apiKeyBtn.addEventListener('click', handleApiKeyInput);
        }
    }

    function handleApiKeyInput() {
        const key = prompt('Enter your API Key from https://the-odds-api.com (Free):', apiKey || '');
        if (key !== null) {
            apiKey = key.trim();
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
            if (apiKey) {
                fetchData();
            } else {
                useMockData();
            }
        }
    }

    function useMockData() {
        liveScores = mockLiveScores;
        featuredGame = mockFeaturedGame;
        predictions = mockPredictions;
        renderAll();
    }

    async function fetchData() {
        try {
            // 1. Fetch Odds (Upcoming Games)
            const oddsUrl = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american`;
            const oddsRes = await fetch(oddsUrl);

            if (!oddsRes.ok) throw new Error('Failed to fetch odds');
            const oddsData = await oddsRes.json();

            // 2. Fetch Scores (Live/Recent)
            const scoresUrl = `https://api.the-odds-api.com/v4/sports/basketball_nba/scores/?apiKey=${apiKey}&daysFrom=1`;
            const scoresRes = await fetch(scoresUrl);

            if (!scoresRes.ok) throw new Error('Failed to fetch scores');
            const scoresData = await scoresRes.json();

            processApiData(oddsData, scoresData);
            renderAll();

        } catch (error) {
            console.error('API Error:', error);
            alert('Error fetching data. Check your API Key or quota. Falling back to mock data.');
            useMockData();
        }
    }

    function processApiData(oddsData, scoresData) {
        // Process Live Scores
        liveScores = scoresData.map(game => {
            const isCompleted = game.completed;
            const scoreStr = game.scores ? `${game.scores.find(s => s.name === game.home_team).score}-${game.scores.find(s => s.name === game.away_team).score}` : '0-0';
            return {
                home: getTeamAbbr(game.home_team),
                away: getTeamAbbr(game.away_team),
                score: scoreStr,
                time: isCompleted ? 'Final' : 'Live', // API doesn't give exact quarter/time in free tier easily
                isLive: !isCompleted && game.scores
            };
        });

        // Process Predictions (Simple logic: Favorite = Prediction)
        predictions = oddsData.map((game, index) => {
            const bookmaker = game.bookmakers[0]; // Use first bookmaker
            if (!bookmaker) return null;

            const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads');
            if (!spreadMarket) return null;

            const outcome = spreadMarket.outcomes[0]; // Just pick first outcome for demo prediction
            const isFavorite = outcome.price < 0;

            return {
                id: game.id,
                home: getTeamAbbr(game.home_team),
                away: getTeamAbbr(game.away_team),
                pick: `${getTeamAbbr(outcome.name)} ${outcome.point > 0 ? '+' : ''}${outcome.point}`,
                odds: outcome.price,
                confidence: Math.floor(Math.random() * (95 - 60) + 60), // Random confidence for demo
                type: isFavorite ? 'high-confidence' : 'underdog',
                analysis: `Odds provided by ${bookmaker.title}.`
            };
        }).filter(p => p !== null);

        // Set Featured Game (First upcoming game)
        if (oddsData.length > 0) {
            const game = oddsData[0];
            featuredGame = {
                home: { name: game.home_team, code: getTeamAbbr(game.home_team), record: '-', color: '#333' },
                away: { name: game.away_team, code: getTeamAbbr(game.away_team), record: '-', color: '#333' },
                time: new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                venue: 'NBA Arena',
                odds: { spread: 'See Predictions', total: '-', moneyline: '-' },
                stats: [
                    { label: 'Win Probability', value: 50, homeVal: '50%', awayVal: '50%' }, // Placeholder
                    { label: 'Public Betting', value: 50, homeVal: '-', awayVal: '-' },
                    { label: 'Power Ranking', value: 50, homeVal: '-', awayVal: '-' }
                ]
            };
        } else {
            featuredGame = mockFeaturedGame;
        }
    }

    function renderAll() {
        renderLiveTicker();
        renderFeaturedGame();
        renderPredictions('all');
    }

    function renderLiveTicker() {
        const ticker = document.getElementById('live-ticker');
        if (!ticker) return;

        const content = liveScores.map(game => `
            <div class="ticker-item">
                <span class="ticker-teams">${game.home} vs ${game.away}</span>
                <span class="ticker-score">${game.score}</span>
                <span class="${game.isLive ? 'ticker-live' : ''}">${game.time} ${game.isLive ? '●' : ''}</span>
            </div>
        `).join('');

        ticker.innerHTML = content + content + content;
    }

    function renderFeaturedGame() {
        const container = document.getElementById('featured-game');
        if (!container || !featuredGame) return;

        const { home, away, time, venue, odds, stats } = featuredGame;

        const statsHtml = stats.map(stat => `
            <div class="stat-bar-group">
                <div class="stat-header">
                    <span>${stat.label}</span>
                    <span>${stat.homeVal}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stat.value}%"></div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="game-info">
                <div class="game-header">
                    <span><i class="fa-regular fa-clock"></i> ${time}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${venue}</span>
                </div>
                <div class="matchup-display">
                    <div class="team">
                        <div class="team-icon" style="background: ${home.color}">${home.code}</div>
                        <div class="team-name">${home.name}</div>
                        <div class="team-record">${home.record}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <div class="team-icon" style="background: ${away.color}">${away.code}</div>
                        <div class="team-name">${away.name}</div>
                        <div class="team-record">${away.record}</div>
                    </div>
                </div>
                <div class="game-meta">
                    <div class="meta-item">
                        <span class="meta-label">Spread</span>
                        <span class="meta-value">${odds.spread}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Total</span>
                        <span class="meta-value">${odds.total}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Moneyline</span>
                        <span class="meta-value">${odds.moneyline}</span>
                    </div>
                </div>
                <button class="btn btn-primary" style="width: 100%">See Full Analysis</button>
            </div>
            <div class="game-stats-viz">
                ${statsHtml}
            </div>
        `;
    }

    function renderPredictions(filterType) {
        const grid = document.getElementById('predictions-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const filtered = filterType === 'all'
            ? predictions
            : predictions.filter(p => p.type === filterType);

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No predictions available at the moment.</p>';
            return;
        }

        filtered.forEach(pred => {
            const card = document.createElement('div');
            card.className = 'prediction-card';
            card.innerHTML = `
                <div class="card-header">
                    <span>NBA • Today</span>
                    ${pred.confidence >= 80 ? '<span style="color: var(--primary)">🔥 Hot Pick</span>' : ''}
                </div>
                <div class="card-matchup">
                    <div class="mini-team">
                        <div class="team-logo" style="width: 30px; height: 30px; font-size: 0.7rem">${pred.home}</div>
                        <span>${pred.home}</span>
                    </div>
                    <span style="color: var(--text-muted); font-size: 0.8rem">vs</span>
                    <div class="mini-team">
                        <span>${pred.away}</span>
                        <div class="team-logo" style="width: 30px; height: 30px; font-size: 0.7rem">${pred.away}</div>
                    </div>
                </div>
                <div class="card-pick">
                    <div class="pick-label">Our Pick</div>
                    <div class="pick-value">${pred.pick} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 400">(${pred.odds})</span></div>
                </div>
                <div class="confidence-meter">
                    <span>Confidence</span>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${pred.confidence}%"></div>
                    </div>
                    <span>${pred.confidence}%</span>
                </div>
                <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted)">${pred.analysis}</p>
            `;
            grid.appendChild(card);
        });
    }

    // Helper: Map full team names to abbreviations (Simplified list)
    function getTeamAbbr(name) {
        const map = {
            'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Brooklyn Nets': 'BKN', 'Charlotte Hornets': 'CHA',
            'Chicago Bulls': 'CHI', 'Cleveland Cavaliers': 'CLE', 'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN',
            'Detroit Pistons': 'DET', 'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU', 'Indiana Pacers': 'IND',
            'Los Angeles Clippers': 'LAC', 'Los Angeles Lakers': 'LAL', 'Memphis Grizzlies': 'MEM', 'Miami Heat': 'MIA',
            'Milwaukee Bucks': 'MIL', 'Minnesota Timberwolves': 'MIN', 'New Orleans Pelicans': 'NOP', 'New York Knicks': 'NYK',
            'Oklahoma City Thunder': 'OKC', 'Orlando Magic': 'ORL', 'Philadelphia 76ers': 'PHI', 'Phoenix Suns': 'PHX',
            'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC', 'San Antonio Spurs': 'SAS', 'Toronto Raptors': 'TOR',
            'Utah Jazz': 'UTA', 'Washington Wizards': 'WAS'
        };
        return map[name] || name.substring(0, 3).toUpperCase();
    }
});

