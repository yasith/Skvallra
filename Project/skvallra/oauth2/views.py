from flask import Flask, request, Response, abort, session, redirect, url_for, render_template
from skvallra import app
from models import *
from oauth2.o_models import *

from datetime import datetime, timedelta

import os, binascii
import json


@app.route('/oauth2/access_token/', methods=['POST'])
def access_token():
	client = Client.query.filter_by(client_id=request.form['client_id'], client_secret=request.form['client_secret']).first()
	user = User.query.filter_by(username=request.form['username']).first()
	if client and request.form['grant_type'] == 'password' and check_password_hash(user.password, request.form['password']):
		session['id'] = user.id
		token = Token.query.filter_by(client_id=client.client_id, user_id=user.id).first()
		if token and token.expires > datetime.utcnow():
			return Response(json.dumps({'access_token' : token.access_token}), mimetype='application/json')

		expire_time = datetime.utcnow() + timedelta(days=1)
		token = Token(
			access_token=binascii.b2a_hex(os.urandom(20)),
			refresh_token='',
			token_type='password',
			_scopes='',
			expires=expire_time,
			client_id=client.client_id,
			user_id=user.id
		)
		db.session.add(token)
		db.session.commit()
		return Response(json.dumps({'access_token' : token.access_token}), mimetype='application/json')