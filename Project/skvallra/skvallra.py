from flask import Flask

app = Flask(__name__)

if __name__ == '__main__':
	from models import *
	from views import *
	app.debug = True
	app.secret_key = '\xa7\xdd\xebbe\xc1\xafL\xab\\\xc9I\x03\xbb\xbd\x92/\x0e\xdb}\xf6\xc0\x9cu'
	app.run(host='0.0.0.0', port=8002)
