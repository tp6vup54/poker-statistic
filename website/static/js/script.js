var socket = new WebSocket('ws://' + location.host + '/socket');
var count = 1;
var myHash = '6ff67167cdf5f3734d43497f6d7bd779';
var hashMap = {};

socket.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    console.log(msg);
    var parent = document.querySelector('body');
    var detail = document.createElement('details');
    var summary = document.createElement('summary');
    detail.open = true;
    detail.setAttribute('class', 'round');
    summary.innerHTML = count++;
    var handCards = getRenderedHandCards(msg.cards);
    detail.appendChild(summary);
    detail.appendChild(handCards);
    parent.appendChild(detail);
}

function getRenderedHandCards(cards) {
    var frame = document.createElement('div');
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
        var pair = document.createElement('div');
        pair.setAttribute('class', 'card-pair');
        var imgSet = document.createElement('div');
        imgSet.setAttribute('class', 'img-set');
        var j = 0;
        for (; j < cards[i][hash].length; j++) {
            var img = document.createElement('img');
            img.setAttribute('src', getCardImgName(cards[i][hash][j]));
            imgSet.appendChild(img);
        }
        var nameLabel = document.createElement('label');
        nameLabel.innerHTML = hashMap[hash]
        pair.appendChild(imgSet);
        pair.appendChild(nameLabel);
        frame.appendChild(pair);
    }
    return frame;
}

function getCardImgName(s) {
    var charMap = {
        'J': 'jack',
        'Q': 'queen',
        'K': 'king',
        'A': 'ace',
    };
    var suitMap = {
        'S': 'spades',
        'H': 'hearts',
        'D': 'diamonds',
        'C': 'clubs',
    };
    var name = '/static/img/';
    if (s[0] in charMap) {
        name += charMap[s[0]];
    } else {
        name += s[0];
    }
    name += '_of_' + suitMap[s[1]] + '.png';
    return name
}
