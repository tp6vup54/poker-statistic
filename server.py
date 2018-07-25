import os
import json
from tornado import ioloop, web, websocket, concurrent
from concurrent.futures import ThreadPoolExecutor


content = None
meta_logs_map = {}


class Index(web.RequestHandler):
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


class Meta(websocket.WebSocketHandler):
    def open(self):
        print('Open a meta socket.')
        parse_meta_data()
        if meta_logs_map:
            self.write_message(meta_logs_map)

    def on_close(self):
        print('Close a meta socket.')

    def on_message(self, message):
        print(message)


class Socket(websocket.WebSocketHandler):
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


class GetNewLogUploaded(websocket.WebSocketHandler):
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


class UploadLog(web.RequestHandler):
    executor = ThreadPoolExecutor(os.cpu_count())

    async def post(self):
        print(self.request.files)
        try:
            file_list = list(self.request.files.values())[0]
            for f in file_list:
                await self.write_log_file(f)
                GetNewLogUploaded.update_log_message(f['filename'])
        except Exception as e:
            print('Get exception: %s' % e)

    @concurrent.run_on_executor
    def write_log_file(self, f):
        print('Get %s.' % f['filename'])
        with open('battle-log/%s' % f['filename'], 'wb') as fh:
            fh.write(f['body'])


def parse_meta_data():
    meta_logs_map.clear()
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
    app = web.Application([
        (r'/', Index),
        (r'/socket', Socket),
        (r'/meta', Meta),
        (r'/upload_log', UploadLog),
        (r'/get_log_updated', GetNewLogUploaded)
    ], **settings)
    app.listen(5000)
    ioloop.IOLoop.current().start()
