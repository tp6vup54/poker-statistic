# Poker Statistic
A simple game history statistic page for [Texas hold 'em](https://en.wikipedia.org/wiki/Texas_hold_%27em).
<img src="https://i.imgur.com/zDPlmwb.png"/>

### Feature Introduction
1. A [Tornado](https://www.tornadoweb.org/en/stable/) backend with pure Javascript frontend.
2. While battle is end, battle log (in Json) will be posted to backend, meanwhile, it will push a web socket message to frontend, triggering a toast, notifying users to refresh for the latest log.
