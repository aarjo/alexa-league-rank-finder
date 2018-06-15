const rp = require('request-promise');

const API_KEY = require('./secret.js').API_KEY;

function romanToNum(rom) {
    switch (rom) {
        case 'I':
            return 1;
        case 'II':
            return 2;
        case 'III':
            return 3;
        case 'IV':
            return 4;
        case 'V':
            return 5;
    }
}

async function getId(region, name) {
    let url = `https://${region}.api.riotgames.com/lol/summoner/v3/summoners/by-name/${name}?api_key=${API_KEY}`;
    let id = null;
    await rp(url).then(res => {
        id = JSON.parse(res).id;
    },
        err => {
            id = err;
        });
    return id;
}

async function getMatchObj(region, id) {
    let url = `https://${region}.api.riotgames.com/lol/spectator/v3/active-games/by-summoner/${id}?api_key=${API_KEY}`;
    return rp(url);
}

async function getMatch(region, name) {
    let id = await getId(region, name);
    return getMatchObj(region, id);
}

async function getRankById(region, id, ladder) {
    let url = `https://${region}.api.riotgames.com/lol/league/v3/positions/by-summoner/${id}?api_key=${API_KEY}`
    let rank = {};
    await rp(url).then(res => {
        data = JSON.parse(res);
        for (queue in data) {
            if (data[queue].queueType === ladder) {
                rank.tier = data[queue].tier;
                rank.rank = romanToNum(data[queue].rank);
                rank.lp = data[queue].leaguePoints;
            }
        }
    });

    return rank;
}

const leagueRequest = {};

leagueRequest.getRank = async function(region, championId, name, ladder) {
    let matchData = await getMatch(region, name);
    if (matchData) {
        let match = JSON.parse(matchData);
        let participants = match.participants;
        for (var player in participants) {
            if (participants[player].championId === championId) {
                return await getRankById(region, participants[player].summonerId, ladder);
            }
        }
    }
    return {};
}



module.exports = leagueRequest;