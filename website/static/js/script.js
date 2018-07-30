const socket = new WebSocket('ws://' + location.host + '/socket');
const meta = new WebSocket('ws://' + location.host + '/meta');
const logUpdated = new WebSocket('ws://' + location.host + '/get_log_updated');
const myHash = [];
const myName = 'Arbeit';
var count = 1;
var hashMap = {};
var metaMap = {};
var totalRound = 0;
var winRound = 0;
const roundDetails = [];
const charMap = {
    'J': 'jack',
    'Q': 'queen',
    'K': 'king',
    'A': 'ace',
    'T': '10',
};

const suitMap = {
    'S': 'spades',
    'H': 'hearts',
    'D': 'diamonds',
    'C': 'clubs',
};

const operationClass = {
    'raise': 'raise',
    'bet': 'raise',
    'allin': 'raise',
    'call': 'call',
    'check': 'call',
    'fold': 'fold',
};

const roundSeq = [
    'deal', 'flop', 'turn', 'river',
];

socket.onmessage = function(e) {
    const msg = JSON.parse(e.data);
    console.log(msg);
    if (Object.keys(msg)[0] == 'self') {
        updateSelfHash(msg['self']);
    } else if (Object.keys(msg)[0] == 'final_chips') {
        updateFinalChips(msg['final_chips']);
    } else {
        const parent = document.querySelector('body');
        parseHash(msg.cards);
        const detail = getDetails(count++, 'detail', 'play', msg['win']);
        const handCards = getRenderedHandCards(msg.cards, msg.win);
        detail.appendChild(handCards);
        var i = 0;
        for (; i < roundSeq.length; i++) {
            var operationFrame = null;
            if (i > 0) {
                operationFrame = getOperationFrame(msg[roundSeq[i]], true);
            } else {
                operationFrame = getOperationFrame(msg[roundSeq[i]], false, [msg['bigBlind'], msg['smallBlind']]);
            }
            if (!operationFrame) {
                continue;
            }
            const subDetail = getDetails(roundSeq[i], 'operation-detail', 'round');
            subDetail.appendChild(getOperationFrame(msg[roundSeq[i]], i > 0 ? true : false));
            detail.appendChild(subDetail);
        }
        roundDetails.push(detail);
        parent.appendChild(detail);
        getWinRate();
    }
}

meta.onmessage = function(e) {
    const msg = JSON.parse(e.data);
    console.log(msg);
    metaMap = msg;
    const dateSelect = document.querySelector('.date-select');
    const options = getDataOptions(Object.keys(msg).sort());
    var i = 0;
    for (; i < options.length; i++) {
        dateSelect.add(options[i]);
    }
}

logUpdated.onmessage = function(e) {
    const msg = e.data;
    console.log(msg);
    const snackbar = document.getElementById("snackbar");
    snackbar.innerHTML = `New log ${msg} was arrived! Refresh the page to get latest log!`;
    snackbar.className = "show";
    setTimeout(function() {
        snackbar.className = snackbar.className.replace("show", "");
    }, 3000);
}

function initialize() {
    count = 1;
    hashMap = {};
    totalRound = 0;
    winRound = 0;
    while (roundDetails.length) {
        roundDetails.pop();
    }
    const chipLabel = document.querySelector('.final-chips')
    chipLabel.innerHTML = '';
    const winRateLabel = document.querySelector('.win-rate');
    winRateLabel.innerHTML = '';
}

function updateSelfHash(hash) {
    if (myHash.indexOf(hash) < 0) {
        myHash.push(hash);
    }
}

function updateFinalChips(chips) {
    const chipLabel = document.querySelector('.final-chips');
    chipLabel.innerHTML = `Chip lefts: ${chips}`;
}

function getDataOptions(dates) {
    const options = [];
    var i = 0;
    for (; i < dates.length; i++) {
        const o = document.createElement('option');
        o.setAttribute('value', dates[i]);
        o.innerHTML = dates[i];
        options.push(o);
    }
    return options;
}

document.querySelector('.date-select').addEventListener('change', (e) => {
    const roundSelect = document.querySelector('.round-select');
    if (roundSelect.options.length > 1) {
        var i = roundSelect.options.length - 1;
        for (; i > 0; i--) {
            roundSelect.remove(i);
        }
    }
    if (!e.target.value) {
        return;
    }
    const options = getRoundOptions(metaMap[e.target.value]);
    var i = 0;
    for (; i < options.length; i++) {
        roundSelect.add(options[i]);
    }
});

function getRoundOptions(rounds) {
    const options = [];
    var i = 0;
    rounds.sort();
    for (; i < rounds.length; i++) {
        const o = document.createElement('option');
        o.setAttribute('value', rounds[i]);
        o.innerHTML = `Round ${i + 1}: ${rounds[i].slice(4, 10)}`;
        options.push(o);
    }
    return options;
}

document.querySelector('.round-select').addEventListener('change', (e) => {
    var i = 0;
    for (; i < roundDetails.length; i++) {
        roundDetails[i].parentNode.removeChild(roundDetails[i]);
    }
    initialize();
    if (e.target.value) {
        socket.send(e.target.value);
    }
});

document.querySelector('.expand').addEventListener('click', (e) => {
    var i = 0;
    for (; i < roundDetails.length; i++) {
        roundDetails[i].open = true;
    }
});

document.querySelector('.collapse').addEventListener('click', (e) => {
    var i = 0;
    for (; i < roundDetails.length; i++) {
        roundDetails[i].open = false;
    }
});

function getWinRate() {
    const winRateLabel = document.querySelector('.win-rate');
    const rate = Math.round(winRound / totalRound * 100)/100;
    winRateLabel.innerHTML = `Win Rate: ${rate} (${winRound}/${totalRound})`;
}

function parseHash(cards) {
    var i = 1;
    var alias = 65;
    for (; i < cards.length; i++) {
        const k = Object.keys(cards[i]);
        if (k.indexOf('chips') >= 0) {
            k.splice(k.indexOf('chips'), 1);
        }
        const hash = k[0];
        if (!(hash in hashMap)) {
            if (myHash.indexOf(hash) >= 0) {
                hashMap[hash] = myName;
            } else {
                hashMap[hash] = String.fromCharCode(alias++);
            }
        }
    }
}

function getOperationFrame(operations, withCards, blinds = null) {
    if (operations.length == 0) {
        return null;
    }
    const frame = document.createElement('div');
    frame.setAttribute('class', 'operation-frame');
    var startIndex = 0;
    if (withCards) {
        const imgSet = getOperationCards(operations[0]);
        frame.appendChild(imgSet);
        startIndex = 1;
    }
    if (blinds) {
        const blindText = ['BB', 'SB'];
        for (var i = 0; i < blinds.length; i++) {
            operations.unshift({});
            operations[0][Object.keys(blinds[i])[0]] = [blindText[i], Object.values(blinds[i])[0]];
        }
    }
    for (; startIndex < operations.length; startIndex++) {
        const k = Object.keys(operations[startIndex])[0];
        const item = document.createElement('div');
        item.setAttribute('class', 'operation-item');
        item.appendChild(getOperationPair(operations[startIndex][k]));
        item.appendChild(getNameLabel(k));
        if (myHash.indexOf(k) >= 0) {
            item.className += ' ' + 'my';
        }
        frame.appendChild(item);
        if (startIndex < operations.length - 1) {
            const i = document.createElement('i');
            i.setAttribute('class', 'fas fa-angle-right fa-2x');
            frame.appendChild(i);
        }
    }
    return frame;
}

function getWinner(win) {
    const winnerInfo = getWinnerInfo(win);
    const winnerDiv = document.createElement('div');
    var hash = null;
    var myStatusText = null;
    winnerDiv.setAttribute('class', 'winner');
    const name = document.createElement('label');
    const chip = document.createElement('label');
    chip.setAttribute('class', 'chip');
    if (winnerInfo) {
        hash = Object.keys(winnerInfo)[0];
        name.innerHTML = hashMap[hash];
        chip.innerHTML = ' + ' + winnerInfo[hash][0] + ' = ' + winnerInfo[hash][1];
    } else {
        name.innerHTML = 'No Winner';
    }
    if (myHash.indexOf(hash) < 0) {
        myStatusText = getMyStatus(win);
    } else {
        winRound += 1;
    }
    winnerDiv.appendChild(name);
    winnerDiv.appendChild(chip);
    if (myStatusText) {
        winnerDiv.appendChild(myStatusText);
    }
    totalRound += 1;
    return winnerDiv
}

function getMyStatus(win) {
    var status = null;
    for (var i = 0; i < win.length; i++) {
        const hash = Object.keys(win[i])[0];
        if (myHash.indexOf(hash) >= 0) {
            status = win[i][hash].map(x => parseInt(x));
            break;
        }
    }
    const myStatus = document.createElement('label');
    myStatus.setAttribute('class', 'my-status');
    myStatus.innerHTML = `, ${myName}`;
    myStatus.innerHTML += (status[0] >= 0 ? ' + ' : ' - ') + Math.abs(status[0]);
    myStatus.innerHTML += ' = ' + status[1];
    return myStatus;
}

function getWinnerInfo(win) {
    for (var i = 0; i < win.length; i++) {
        const chips = Object.values(win[i]);
        if (parseInt(chips[0]) > 0) {
            return win[i];
        }
    }
    return null;
}

function getOperationCards(cards) {
    var i = 0;
    const imgSet = document.createElement('div');
    imgSet.setAttribute('class', 'img-set');
    for (; i < cards.length; i++) {
        const img = document.createElement('img');
        img.setAttribute('src', getCardImgName(cards[i]));
        imgSet.appendChild(img);
    }
    return imgSet;
}

function getOperationPair(item) {
    const operationPair = document.createElement('div');
    operationPair.setAttribute('class', 'operation-pair');
    const operationLabel = document.createElement('label');
    operationLabel.setAttribute('class', 'operation-name ' + operationClass[item[0]]);
    operationLabel.innerHTML = item[0];
    const valueLabel = document.createElement('label');
    valueLabel.setAttribute('class', 'operation-value');
    valueLabel.innerHTML = item[1];
    operationPair.appendChild(operationLabel);
    operationPair.appendChild(valueLabel);
    return operationPair;
}

function getDetails(name, detailClass, summaryClass, summaryText = null) {
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    summary.addEventListener('click', (e) => {
        console.log('toggle');
        detail.click();
        e.stopPropagation();
    }, true);
    detail.open = true;
    detail.setAttribute('class', detailClass);
    summary.setAttribute('class', summaryClass);
    summary.innerHTML = name;
    if (summaryText) {
        const winner = getWinner(summaryText);
        summary.appendChild(winner);
    }
    detail.appendChild(summary);
    return detail;
}

function getRenderedHandCards(cards, win) {
    const frame = document.createElement('div');
    frame.setAttribute('class', 'hand-cards');
    var i = 1;
    for (; i < cards.length; i++) {
        const k = Object.keys(cards[i]);
        if (k.indexOf('chips') >= 0) {
            k.splice(k.indexOf('chips'), 1);
        }
        const hash = k[0];
        const pair = document.createElement('div');
        pair.setAttribute('class', 'card-pair');
        const imgSet = document.createElement('div');
        imgSet.setAttribute('class', 'img-set');
        var j = 0;
        for (; j < cards[i][hash].length; j++) {
            const img = document.createElement('img');
            img.setAttribute('src', getCardImgName(cards[i][hash][j]));
            imgSet.appendChild(img);
        }
        pair.appendChild(imgSet);
        pair.appendChild(getNameLabel(hash));
        if (win) {
            pair.appendChild(getChipsLabel(win, hash));
        }
        if (myHash.indexOf(hash) >= 0) {
            pair.className += ' ' + 'my';
        }
        frame.appendChild(pair);
    }
    return frame;
}

function getChipsLabel(win, hash) {
    const chipLabel = document.createElement('label');
    var currentWinInfo = null;
    chipLabel.setAttribute('class', 'chip-left');
    for (var i = 0; i < win.length; i++) {
        if (hash in win[i]) {
            currentWinInfo = win[i][hash].map(x => parseInt(x));
            break;
        }
    }
    if (currentWinInfo) {
        chipLabel.innerHTML = currentWinInfo[0] >= 0 ? '+' : '-';
        chipLabel.innerHTML += Math.abs(currentWinInfo[0]) + ' = ' + currentWinInfo[1];
    }
    return chipLabel;
}

function getNameLabel(hash) {
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('class', 'player-name');
    nameLabel.innerHTML = hashMap[hash];
    return nameLabel;
}

function getCardImgName(s) {
    var name = '/static/img/';
    if (s[0] in charMap) {
        name += charMap[s[0]];
    } else {
        name += s[0];
    }
    name += '_of_' + suitMap[s[1]] + '.png';
    return name
}
