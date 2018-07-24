import os
import json
import tornado.ioloop
import tornado.web
import tornado.websocket
import datetime


content = None
meta_logs_map = {}


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

class Meta(tornado.websocket.WebSocketHandler):
    def open(self):
        print('Open a meta socket.')
        if meta_logs_map:
            self.write_message(meta_logs_map)

    def on_close(self):
        print('Close a meta socket.')

    def on_message(self, message):
        print(message)

class Socket(tornado.websocket.WebSocketHandler):
    exception_list = ['final_chips', 'self']

    def open(self):
        print('Open a web socket.')

    def on_close(self):
        print('Close a web socket.')

    def on_message(self, message):
        print(message)
        parse_full_json(message)
        if content:
            for e in self.exception_list:
                if e in content:
                    self.write_message({e: content[e]})
                    del content[e]
            for key in content:
                self.write_message(content.get(key))


class GetNewLogUploaded(tornado.websocket.WebSocketHandler):
    def open(self):
        print('Open a GetNewLogUploaded socket.')
        SocketManager.add_connection(self)

    def on_close(self):
        print('Close a GetNewLogUploaded socket.')
        SocketManager.remove_connection(self)

    def on_message(self, message):
        print(message)

    @classmethod
    def update_log_message(cls, log_name):
        print('Update new log message to clients.')
        for c in SocketManager.connections:
            c.write_message(log_name)


class UploadLog(tornado.web.RequestHandler):
    def post(self):
        file_list = list(self.request.files.values())[0]
        for f in file_list:
            print('Get %s.' % f['filename'])
            fh = open('battle-log/%s' % f['filename'], 'w')
            fh.write(f['body'].decode())
            self.finish(f['filename'] + ' is uploaded!!')
            GetNewLogUploaded.update_log_message(f['filename'])


def parse_meta_data():
    logs = os.listdir('battle-log')
    for l in logs:
        date = l[:4]
        if date in meta_logs_map:
            meta_logs_map[date].append(l)
        else:
            meta_logs_map[date] = [l]


def parse_full_json(file_name):
    f = open('battle-log/%s' % file_name, 'r')
    global content
    content = json.load(f)
    f.close()


settings = {
    'static_path': os.path.join(os.path.dirname(__file__), 'website/static'),
    'autoreload': True,
}


if __name__ == '__main__':
    # parse_full_json()
    parse_meta_data()
    app = tornado.web.Application([
        (r'/', Index),
        (r'/socket', Socket),
        (r'/meta', Meta),
        (r'/upload_log', UploadLog),
        (r'/get_log_updated', GetNewLogUploaded)
    ], **settings)
    app.listen(5000)
    tornado.ioloop.IOLoop.current().start()
