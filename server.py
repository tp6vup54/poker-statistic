import os
import json
import tornado.ioloop
import tornado.web
import tornado.websocket


content = None


class Index(tornado.web.RequestHandler):
    def get(self):
        self.render('website/templates/index.html')


class SocketManager(object):
    connections = []

    @classmethod
    def add_connection(cls, socket):
        cls.connections.append(socket)

    @classmethod
    def remove_connection(cls, socket):
        cls.connections.remove(socket)


class Socket(tornado.websocket.WebSocketHandler):
    def open(self):
        print('Open a web socket.')
        SocketManager.add_connection(self)
        if content:
            for key in content:
                self.write_message(content.get(key))

    def on_close(self):
        print('Close a web socket.')
        SocketManager.remove_connection(self)

    def on_message(self, message):
        print(message)
        for c in SocketManager.connections:
            c.write_message(message)


def parse_full_json():
    f = open('0716181912_action.log', 'r')
    global content
    content = json.load(f)
    f.close()


settings = {
    'static_path': os.path.join(os.path.dirname(__file__), 'website/static'),
    'autoreload': True,
}


if __name__ == '__main__':
    parse_full_json()
    app = tornado.web.Application([
        (r'/', Index),
        (r'/socket', Socket),
    ], **settings)
    app.listen(5000)
    tornado.ioloop.IOLoop.current().start()
