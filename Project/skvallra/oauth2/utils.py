from flask import request, abort, session, redirect, url_for
from skvallra import app
from functools import wraps
from sqlalchemy import or_, and_, not_

from models import *
from oauth2.o_models import *

from datetime import datetime, timedelta

def check_oauth(f):
	@wraps(f)
	def decorated_function(*args, **kwargs):
		print request.headers
		if 'Authorization' in request.headers and 'id' in session:
			token = request.headers['Authorization'][7:]
			print token
			t = Token.query.filter(and_(and_(Token.user_id == session['id'], Token.expires > datetime.utcnow()), Token.access_token == token)).first()
			if t:
				return f(*args, **kwargs)
			else:
				abort(401)
		else:
			abort(401)
	return decorated_function