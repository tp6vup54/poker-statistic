const socket = new WebSocket('ws://' + location.host + '/socket');
const myHash = '6ff67167cdf5f3734d43497f6d7bd779';
var count = 1;
var hashMap = {};
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
    const parent = document.querySelector('body');
    const detail = getDetails(count++, 'play');
    const handCards = getRenderedHandCards(msg.cards);
    detail.appendChild(handCards);
    var i = 0;
    for (; i < roundSeq.length; i++) {
        detail.appendChild(document.createElement('br'));
        const subDetail = getDetails(roundSeq[i], 'round');
        subDetail.appendChild(getOperationFrame(msg.deal, false));
        detail.appendChild(subDetail);
    }
    parent.appendChild(detail);
}

function getOperationFrame(operations, withCards) {
    const frame = document.createElement('div');
    frame.setAttribute('class', 'operation-frame');
    var startIndex = 0;
    if (withCards) {
        startIndex = 1;
    }
    for (; startIndex < operations.length; startIndex++) {
        const k = Object.keys(operations[startIndex])[0];
        const item = document.createElement('div');
        item.setAttribute('class', 'operation-item');
        item.appendChild(getOperationPair(operations[startIndex][k]));
        item.appendChild(getNameLabel(k));
        frame.appendChild(item);
        if (startIndex < operations.length - 1) {
            const i = document.createElement('i');
            i.setAttribute('class', 'fas fa-angle-right fa-2x');
            frame.appendChild(i);
        }
    }
    return frame;
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

function getDetails(name, c) {
    const detail = document.createElement('details');
    const summary = document.createElement('summary');
    detail.open = true;
    summary.setAttribute('class', c);
    summary.innerHTML = name;
    detail.appendChild(summary);
    return detail;
}

function getRenderedHandCards(cards) {
    const frame = document.createElement('div');
    frame.setAttribute('class', 'hand-cards');
    var alias = 65;
    var i = 1;
    for (; i < cards.length; i++) {
        var hash = Object.keys(cards[i])[0]
            if (!(hash in hashMap)) {
            if (hash == myHash) {
                hashMap[hash] = 'Arbeit';
            } else {
                hashMap[hash] = String.fromCharCode(alias++);
            }
        }
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
        frame.appendChild(pair);
    }
    return frame;
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
