from flask import Flask, g
from flask.ext.sqlalchemy import SQLAlchemy

app = Flask(__name__)
username = 'skvallra'
password = 'skvallra'
database = 'skvallra'

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://'+username+':'+password+'@localhost/'+database
db = SQLAlchemy(app)

if __name__ == '__main__':
	from models import *
	from oauth2.o_models import *
	from views import *
	from oauth2.views import *
	from oauth2.utils import *
	app.debug = True
	app.secret_key = '\xa7\xdd\xebbe\xc1\xafL\xab\\\xc9I\x03\xbb\xbd\x92/\x0e\xdb}\xf6\xc0\x9cu'
	app.run(host='0.0.0.0', port=8002)
