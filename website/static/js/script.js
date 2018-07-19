var socket = new WebSocket('ws://' + location.host + '/socket');;
socket.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    document.querySelector('#msg-box').innerHTML += msg + '<br>';
}

document.addEventListener('keydown', (event) => {
    socket.send(JSON.stringify(event.keyCode));
});