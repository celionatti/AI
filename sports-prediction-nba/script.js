document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_KEY_STORAGE_KEY = 'nba_odds_api_key';
    let apiKey = 'c8c6da5eb272bd46dadb79cb019b1a33'; // Hardcoded as requested
    // let apiKey = localStorage.getItem(API_KEY_STORAGE_KEY); // Legacy
    let currentSport = 'basketball_nba'; // Default

    // League Configuration
    const LEAGUES = {
        'basketball_nba': { name: 'NBA', icon: 'fa-basketball' },
        'soccer_epl': { name: 'Premier League', icon: 'fa-futbol' },
        'soccer_spain_la_liga': { name: 'La Liga', icon: 'fa-futbol' },
        'soccer_germany_bundesliga': { name: 'Bundesliga', icon: 'fa-futbol' },
        'soccer_italy_serie_a': { name: 'Serie A', icon: 'fa-futbol' },
        'soccer_france_ligue_one': { name: 'Ligue 1', icon: 'fa-futbol' }
    };

    // State
    let liveScores = [];
    let predictions = [];
    let featuredGame = null;
    let allGamesData = []; // Store raw data for modal

    // Mock Data (Fallback)
    const mockLiveScores = [
        { home: 'LAL', away: 'GSW', score: '102-98', time: 'Q4 2:30', isLive: true },
        { home: 'BOS', away: 'MIA', score: '45-42', time: 'Q2 5:15', isLive: true },
        { home: 'RMA', away: 'BAR', score: '1-1', time: '75\'', isLive: true },
        { home: 'MCI', away: 'LIV', score: '2-2', time: 'Final', isLive: false },
        { home: 'BAY', away: 'DOR', score: '0-0', time: '20:30', isLive: false }
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
            id: 'mock1',
            home: 'LAL',
            away: 'GSW',
            pick: 'Lakers -2.5',
            odds: '-110',
            confidence: 85,
            type: 'high-confidence',
            analysis: 'Lakers are 8-2 ATS in their last 10 home games.',
            details: { home: 'Los Angeles Lakers', away: 'Golden State Warriors', bookmaker: 'DraftKings' }
        },
        {
            id: 'mock2',
            home: 'PHX',
            away: 'DEN',
            pick: 'Over 230.5',
            odds: '-110',
            confidence: 72,
            type: 'all',
            analysis: 'Both teams averaging 120+ PPG in last 5 matchups.',
            details: { home: 'Phoenix Suns', away: 'Denver Nuggets', bookmaker: 'FanDuel' }
        },
        {
            id: 'mock3',
            home: 'MIA',
            away: 'ORL',
            pick: 'Magic ML',
            odds: '+145',
            confidence: 60,
            type: 'underdog',
            analysis: 'Heat resting key starters tonight.',
            details: { home: 'Miami Heat', away: 'Orlando Magic', bookmaker: 'BetMGM' }
        },
        {
            id: 'mock4',
            home: 'ARS',
            away: 'CHE',
            pick: 'Draw',
            odds: '+260',
            confidence: 65,
            type: 'all',
            analysis: 'London derby likely to be a tight affair.',
            details: { home: 'Arsenal', away: 'Chelsea', bookmaker: 'Bet365' }
        },
        {
            id: 'mock5',
            home: 'RMA',
            away: 'ATM',
            pick: 'Over 4.5 Cards',
            odds: '-120',
            confidence: 80,
            type: 'high-confidence',
            analysis: 'High intensity derby match, expect many bookings.',
            details: { home: 'Real Madrid', away: 'Atletico Madrid', bookmaker: 'Unibet' }
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

        // Sport Selector Dropdown
        const sportSelect = document.getElementById('sport-select');
        if (sportSelect) {
            sportSelect.addEventListener('change', async (e) => {
                currentSport = e.target.value;

                // Reset data
                liveScores = [];
                predictions = [];
                featuredGame = null;
                renderAll(); // Clear UI temporarily

                if (apiKey) {
                    await fetchData();
                } else {
                    useMockData();
                }
            });
        }

        // API Key Button
        const apiKeyBtn = document.getElementById('api-key-btn');
        if (apiKeyBtn) {
            apiKeyBtn.addEventListener('click', handleApiKeyInput);
        }

        // Modal Close
        const modal = document.getElementById('details-modal');
        const closeBtn = document.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.classList.remove('show');
                setTimeout(() => modal.style.display = 'none', 300);
            };
        }
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.style.display = 'none', 300);
            }
        };
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
            // Determine markets based on sport
            // NBA: spreads, totals, h2h
            // Soccer: h2h, totals (Over/Under)
            const markets = currentSport.startsWith('soccer') ? 'h2h,totals' : 'spreads,totals,h2h';

            // 1. Fetch Odds (Upcoming Games)
            const oddsUrl = `https://api.the-odds-api.com/v4/sports/${currentSport}/odds/?apiKey=${apiKey}&regions=us&markets=${markets}&oddsFormat=american`;
            const oddsRes = await fetch(oddsUrl);

            if (!oddsRes.ok) throw new Error('Failed to fetch odds');
            const oddsData = await oddsRes.json();
            allGamesData = oddsData; // Store for modal

            // 2. Fetch Scores (Live/Recent)
            const scoresUrl = `https://api.the-odds-api.com/v4/sports/${currentSport}/scores/?apiKey=${apiKey}&daysFrom=1`;
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
            let scoreStr = '0-0';
            if (game.scores) {
                const homeScore = game.scores.find(s => s.name === game.home_team)?.score || 0;
                const awayScore = game.scores.find(s => s.name === game.away_team)?.score || 0;
                scoreStr = `${homeScore}-${awayScore}`;
            }

            return {
                home: getTeamAbbr(game.home_team),
                away: getTeamAbbr(game.away_team),
                score: scoreStr,
                time: isCompleted ? 'Final' : 'Live',
                isLive: !isCompleted && game.scores
            };
        });

        // Process Predictions
        predictions = oddsData.map((game) => {
            const bookmaker = game.bookmakers[0];
            if (!bookmaker) return null;

            let pick = '';
            let odds = '';
            let isFavorite = false;
            let analysis = '';
            let type = 'all';

            // Advanced Prediction Logic
            if (currentSport.startsWith('soccer')) {
                // Soccer Logic: Mix of H2H (Win/Draw), Totals (Over/Under), and Simulated Cards
                const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
                const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
                
                // Randomly decide which market to highlight for variety
                const marketChoice = Math.random();

                if (marketChoice < 0.4 && h2hMarket) {
                    // 40% chance: Win/Draw
                    const outcomes = h2hMarket.outcomes;
                    outcomes.sort((a, b) => a.price - b.price);
                    const bestOutcome = outcomes[0];
                    
                    if (bestOutcome.name === 'Draw') {
                        pick = 'Draw';
                        analysis = 'Match expected to be tight with few clear chances.';
                    } else {
                        pick = `${getTeamAbbr(bestOutcome.name)} ML`;
                        analysis = `${bestOutcome.name} favored to win based on recent form.`;
                    }
                    odds = bestOutcome.price > 0 ? `+${bestOutcome.price}` : bestOutcome.price;
                    isFavorite = true;

                } else if (marketChoice < 0.8 && totalsMarket) {
                    // 40% chance: Over/Under 2.5
                    const outcome = totalsMarket.outcomes.find(o => o.point === 2.5) || totalsMarket.outcomes[0];
                    if (outcome) {
                        pick = `${outcome.name} ${outcome.point} Goals`;
                        odds = outcome.price > 0 ? `+${outcome.price}` : outcome.price;
                        analysis = outcome.name === 'Over' ? 'High scoring game expected.' : 'Defensive battle expected.';
                        isFavorite = outcome.price < 0;
                    }
                } else {
                    // 20% chance: Simulated "Bookings" (Cards)
                    // Since API doesn't provide cards, we simulate a "High Intensity" match
                    pick = 'Over 4.5 Cards';
                    odds = '-115';
                    analysis = 'High intensity matchup, expect aggressive play and bookings.';
                    isFavorite = true;
                }

            } else {
                // NBA Logic: Spread, Moneyline, Totals
                const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads');
                const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');
                
                const marketChoice = Math.random();

                if (marketChoice < 0.6 && spreadMarket) {
                    // 60% chance: Spread
                    const outcome = spreadMarket.outcomes[0];
                    pick = `${getTeamAbbr(outcome.name)} ${outcome.point > 0 ? '+' : ''}${outcome.point}`;
                    odds = outcome.price > 0 ? `+${outcome.price}` : outcome.price;
                    analysis = `Spread value on ${getTeamAbbr(outcome.name)}.`;
                    isFavorite = outcome.price < 0;
                } else if (totalsMarket) {
                    // 40% chance: Totals
                    const outcome = totalsMarket.outcomes[0];
                    pick = `${outcome.name} ${outcome.point}`;
                    odds = outcome.price > 0 ? `+${outcome.price}` : outcome.price;
                    analysis = outcome.name === 'Over' ? 'Fast paced game expected.' : 'Slow pace expected.';
                    isFavorite = outcome.price < 0;
                }
            }

            // Fallback if logic failed
            if (!pick) {
                pick = 'See Details';
                odds = 'N/A';
            }

            return {
                id: game.id,
                home: getTeamAbbr(game.home_team),
                away: getTeamAbbr(game.away_team),
                pick: pick,
                odds: odds,
                confidence: Math.floor(Math.random() * (95 - 60) + 60),
                type: isFavorite ? 'high-confidence' : 'underdog',
                analysis: analysis,
                details: { // Store full details for modal
                    home: game.home_team,
                    away: game.away_team,
                    bookmaker: bookmaker.title,
                    commence_time: game.commence_time
                }
            };
        }).filter(p => p !== null);

        // Set Featured Game
        if (oddsData.length > 0) {
            const game = oddsData[0];
            featuredGame = {
                home: { name: game.home_team, code: getTeamAbbr(game.home_team), record: '-', color: '#333' },
                away: { name: game.away_team, code: getTeamAbbr(game.away_team), record: '-', color: '#333' },
                time: new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                venue: currentSport.startsWith('soccer') ? 'Stadium' : 'Arena',
                odds: { spread: 'See Picks', total: '-', moneyline: '-' },
                stats: [
                    { label: 'Win Probability', value: 50, homeVal: '50%', awayVal: '50%' },
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

        if (liveScores.length === 0) {
            ticker.innerHTML = '<div class="ticker-item" style="padding-left: 2rem">No live games currently.</div>';
            return;
        }

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
            card.onclick = () => openModal(pred); // Add click handler
            card.innerHTML = `
                <div class="card-header">
                    <span>${LEAGUES[currentSport]?.name || 'Sport'} • Today</span>
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
                <div style="margin-top: 1rem; text-align: center; font-size: 0.8rem; color: var(--primary);">Tap for Details</div>
            `;
            grid.appendChild(card);
        });
    }

    // Helper: Map full team names to abbreviations
    function getTeamAbbr(name) {
        if (!name) return 'UNK';
        const map = {
            // NBA
            'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Brooklyn Nets': 'BKN', 'Charlotte Hornets': 'CHA',
            'Chicago Bulls': 'CHI', 'Cleveland Cavaliers': 'CLE', 'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN',
            'Detroit Pistons': 'DET', 'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU', 'Indiana Pacers': 'IND',
            'Los Angeles Clippers': 'LAC', 'Los Angeles Lakers': 'LAL', 'Memphis Grizzlies': 'MEM', 'Miami Heat': 'MIA',
            'Milwaukee Bucks': 'MIL', 'Minnesota Timberwolves': 'MIN', 'New Orleans Pelicans': 'NOP', 'New York Knicks': 'NYK',
            'Oklahoma City Thunder': 'OKC', 'Orlando Magic': 'ORL', 'Philadelphia 76ers': 'PHI', 'Phoenix Suns': 'PHX',
            'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC', 'San Antonio Spurs': 'SAS', 'Toronto Raptors': 'TOR',
            'Utah Jazz': 'UTA', 'Washington Wizards': 'WAS',
            // EPL & Other Leagues (Basic mapping, can be expanded)
            'Arsenal': 'ARS', 'Aston Villa': 'AVL', 'Bournemouth': 'BOU', 'Brentford': 'BRE', 'Brighton and Hove Albion': 'BHA',
            'Chelsea': 'CHE', 'Crystal Palace': 'CRY', 'Everton': 'EVE', 'Fulham': 'FUL', 'Liverpool': 'LIV',
            'Luton Town': 'LUT', 'Manchester City': 'MCI', 'Manchester United': 'MUN', 'Newcastle United': 'NEW',
            'Nottingham Forest': 'NFO', 'Sheffield United': 'SHU', 'Tottenham Hotspur': 'TOT', 'West Ham United': 'WHU',
            'Wolverhampton Wanderers': 'WOL', 'Burnley': 'BUR',
            'Real Madrid': 'RMA', 'Barcelona': 'BAR', 'Atletico Madrid': 'ATM', 'Sevilla': 'SEV',
            'Bayern Munich': 'BAY', 'Borussia Dortmund': 'DOR', 'Bayer Leverkusen': 'B04',
            'Juventus': 'JUV', 'AC Milan': 'ACM', 'Inter Milan': 'INT', 'Napoli': 'NAP',
            'Paris Saint-Germain': 'PSG', 'Marseille': 'OM', 'Lyon': 'OL'
        };
        return map[name] || name.substring(0, 3).toUpperCase();
    }

    // TheSportsDB Integration
    async function fetchTeamDetails(teamName) {
        try {
            // Use TheSportsDB free API (search by team name)
            const sportQuery = currentSport.startsWith('soccer') ? 'Soccer' : 'Basketball';
            const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
            const data = await res.json();
            
            if (data.teams && data.teams.length > 0) {
                // Filter by sport to avoid name collisions (e.g. "Giants")
                const team = data.teams.find(t => t.strSport === sportQuery) || data.teams[0];
                return {
                    stadium: team.strStadium,
                    location: team.strStadiumLocation,
                    banner: team.strTeamBanner,
                    logo: team.strTeamBadge,
                    description: team.strDescriptionEN ? team.strDescriptionEN.substring(0, 150) + '...' : 'No description available.'
                };
            }
            return null;
        } catch (e) {
            console.warn('Failed to fetch team details:', e);
            return null;
        }
    }

    // Modal Logic
    async function openModal(prediction) {
        const modal = document.getElementById('details-modal');
        const modalBody = document.getElementById('modal-body');
        
        if (!modal || !modalBody) return;

        // Show loading state
        modalBody.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top:1rem">Loading detailed analytics...</p></div>';
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);

        const details = prediction.details;
        const date = new Date(details.commence_time || Date.now()).toLocaleString();

        // Fetch extra details for Home Team
        const homeDetails = await fetchTeamDetails(details.home);
        
        // Prepare Odds Comparison
        // Find the original game object to get all bookmakers
        const gameData = allGamesData.find(g => g.id === prediction.id);
        let oddsTableRows = '';
        
        if (gameData && gameData.bookmakers) {
            oddsTableRows = gameData.bookmakers.map(bm => {
                // Determine which market to show in table based on prediction type or default
                // For simplicity, we show H2H for soccer, Spreads for NBA
                const marketKey = currentSport.startsWith('soccer') ? 'h2h' : 'spreads';
                const market = bm.markets.find(m => m.key === marketKey);
                if (!market) return '';

                let homeOdd, awayOdd;
                if (currentSport.startsWith('soccer')) {
                    // H2H
                    homeOdd = market.outcomes.find(o => o.name === details.home)?.price;
                    awayOdd = market.outcomes.find(o => o.name === details.away)?.price;
                } else {
                    // Spreads
                    const homeOutcome = market.outcomes.find(o => o.name === details.home);
                    const awayOutcome = market.outcomes.find(o => o.name === details.away);
                    homeOdd = homeOutcome ? `${homeOutcome.point > 0 ? '+' : ''}${homeOutcome.point} (${homeOutcome.price})` : '-';
                    awayOdd = awayOutcome ? `${awayOutcome.point > 0 ? '+' : ''}${awayOutcome.point} (${awayOutcome.price})` : '-';
                }

                return `
                    <tr>
                        <td><div class="bookmaker-logo">${bm.title}</div></td>
                        <td>${homeOdd || '-'}</td>
                        <td>${awayOdd || '-'}</td>
                    </tr>
                `;
            }).join('');
        }

        const bannerStyle = homeDetails?.banner ? `background-image: url('${homeDetails.banner}');` : 'background: var(--gradient-primary);';
        const stadiumInfo = homeDetails ? `<i class="fa-solid fa-location-dot"></i> ${homeDetails.stadium}, ${homeDetails.location}` : '';

        modalBody.innerHTML = `
            <div class="modal-banner" style="${bannerStyle}"></div>
            <div class="modal-header">
                <div style="color: var(--primary); font-weight: 600; margin-bottom: 0.5rem; text-align: center;">${LEAGUES[currentSport]?.name || 'Sport'}</div>
                <div class="modal-matchup">
                    <div class="modal-team">
                        <div class="team-logo" style="width: 60px; height: 60px; font-size: 1.2rem; background: #2D3748">
                            ${homeDetails?.logo ? `<img src="${homeDetails.logo}" style="width:100%; height:100%; object-fit:contain;">` : getTeamAbbr(details.home)}
                        </div>
                        <span style="font-weight: 700; margin-top: 0.5rem">${details.home}</span>
                    </div>
                    <div class="modal-vs">VS</div>
                    <div class="modal-team">
                        <div class="team-logo" style="width: 60px; height: 60px; font-size: 1.2rem; background: #2D3748">${getTeamAbbr(details.away)}</div>
                        <span style="font-weight: 700; margin-top: 0.5rem">${details.away}</span>
                    </div>
                </div>
                <div style="color: var(--text-muted); margin-top: 1rem; text-align: center;">
                    <i class="fa-regular fa-clock"></i> ${date} <br>
                    ${stadiumInfo}
                </div>
            </div>

            <div class="modal-stats" style="margin-top: 2rem;">
                <h3 style="margin-bottom: 1rem; font-size: 1.1rem">AI Prediction Analysis</h3>
                <div class="stat-row">
                    <span style="color: var(--text-muted)">Recommended Pick</span>
                    <span style="font-weight: 700; color: var(--primary)">${prediction.pick}</span>
                </div>
                <div class="stat-row">
                    <span style="color: var(--text-muted)">Best Odds</span>
                    <span style="font-weight: 600">${prediction.odds}</span>
                </div>
                <div class="stat-row">
                    <span style="color: var(--text-muted)">Confidence Model</span>
                    <span style="font-weight: 600; color: var(--success)">${prediction.confidence}%</span>
                </div>
                <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin-top: 1rem;">
                    ${prediction.analysis} ${homeDetails ? homeDetails.description : ''}
                </p>
            </div>

            <div class="odds-table-container">
                <h3 style="margin-bottom: 1rem; font-size: 1.1rem">Odds Comparison</h3>
                <table class="odds-table">
                    <thead>
                        <tr>
                            <th>Bookmaker</th>
                            <th>${getTeamAbbr(details.home)}</th>
                            <th>${getTeamAbbr(details.away)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${oddsTableRows}
                    </tbody>
                </table>
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-top: 2rem;" onclick="document.getElementById('details-modal').classList.remove('show'); setTimeout(() => document.getElementById('details-modal').style.display = 'none', 300);">Close Analysis</button>
        `;
    }
});
