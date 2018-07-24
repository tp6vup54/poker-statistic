const socket = new WebSocket('ws://' + location.host + '/socket');
const meta = new WebSocket('ws://' + location.host + '/meta');
const myHash = ['5151f1abcb8f36ec81f5911b8b39da75', 'ded7f0de5c208f5037c645cd552bd3d8'];
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
        const detail = getDetails(count++, 'play', msg[' win'][0]);
        const handCards = getRenderedHandCards(msg.cards);
        detail.appendChild(handCards);
        var i = 0;
        for (; i < roundSeq.length; i++) {
            const operationFrame = getOperationFrame(msg[roundSeq[i]], i > 0 ? true : false)
            if (!operationFrame) {
                continue;
            }
            detail.appendChild(document.createElement('br'));
            const subDetail = getDetails(roundSeq[i], 'round');
            subDetail.setAttribute('class', 'operation-detail');
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
    const rate = winRound / totalRound;
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
                hashMap[hash] = 'Arbeit';
            } else {
                hashMap[hash] = String.fromCharCode(alias++);
            }
        }
    }
}

function getOperationFrame(operations, withCards) {
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
    const hash = Object.keys(win)[0];
    const winnerDiv = document.createElement('div');
    winnerDiv.setAttribute('class', 'winner');
    const name = document.createElement('label');
    name.innerHTML = 'Winner: ' + hashMap[hash];
    const chip = document.createElement('label');
    chip.onclick  = function(e) {
        e.stopPropagation();
    }
    chip.setAttribute('class', 'chip');
    chip.innerHTML = ' + ' + win[hash];
    winnerDiv.appendChild(name);
    winnerDiv.appendChild(chip);
    totalRound += 1;
    if (myHash.indexOf(hash) >= 0) {
        winRound += 1;
    }
    return winnerDiv
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

function getDetails(name, c, summaryText = null) {
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    summary.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    detail.open = true;
    summary.setAttribute('class', c);
    summary.innerHTML = name;
    if (summaryText) {
        const winner = getWinner(summaryText);
        summary.appendChild(winner);
    }
    detail.appendChild(summary);
    return detail;
}

function getRenderedHandCards(cards) {
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
        if ('chips' in cards[i]) {
            pair.appendChild(getChipsLabel(cards[i].chips));
        }
        if (myHash.indexOf(hash) >= 0) {
            pair.className += ' ' + 'my';
        }
        frame.appendChild(pair);
    }
    return frame;
}

function getChipsLabel(chips) {
    const chipLabel = document.createElement('label');
    chipLabel.setAttribute('class', 'chip-left');
    chipLabel.innerHTML = 'Left: ' + chips;
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
