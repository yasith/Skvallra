from flask import Flask, g, request, Response, abort, session, redirect, url_for, render_template
from skvallra import app, db
from models import *
from oauth2.o_models import Token
import json
from api.v1_0.views import *
from utils import login_required

@app.route('/login/', methods=['POST', 'GET'])
def login():
	if request.method == 'POST':
		user = User.query.filter_by(username=request.form['username']).first()
		if check_password_hash(user.password, request.form['password']):
			session['id'] = user.id
			return redirect(url_for('index'))
		abort(401)
	elif request.method == 'GET':
		user = User.query.filter_by(username=request.args.get('username', None)).first()
		if check_password_hash(user.password, request.args.get('password', None)):
			session['id'] = user.id
			return redirect(url_for('index'))
		abort(401)

@app.route('/logout/', methods=['GET'])
@login_required
def logout():
	token = Token.query.filter_by(user_id=session['id']).first()
	db.session.delete(token)
	db.session.commit()
	session.pop('id', None)
	return redirect(url_for('index'))

@app.route('/is_admin/', methods=['GET'])
def isadmin():
	user = User.query.filter_by(id=session['id']).first_or_404()
	return Response(json.dumps({'status': user.is_staff}), mimetype='application/json')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
	return render_template('index.html')