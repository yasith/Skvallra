from flask import Flask, request, Response, abort, session, redirect, url_for
from sqlalchemy import or_, and_, not_

from skvallra import app, db
from utils import login_required
from oauth2.utils import check_oauth
from models import *
from serializers import UserSerializer, TagSerializer, ActionSerializer, ImageSerializer, UserActionSerializer, CommentSerializer, CommentInputSerializer, PageViewSerializer, SettingSerializer
from suggestions import get_suggestion

from datetime import datetime, timedelta

from flask import json

from collections import OrderedDict

from hashlib import md5

import os

from PIL import Image as pilImage
from StringIO import StringIO

api_version = 'v1.0'
MAX_SUGGESTIONS = 5

@app.route('/api/' + api_version + '/me/', methods=['GET'])
# @login_required
@check_oauth
def me():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		user = User.query.filter_by(id=session['id']).first_or_404()
		pv = PageView(page='Profile')
		db.session.add(pv)
		db.session.commit()
		return Response(UserSerializer().serialize(user, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/me/<int:id>/', methods=['PUT'])
def me_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'PUT':
		user = User.query.filter_by(id=session['id']).first_or_404()
		pv = PageView(page='Profile')
		db.session.add(pv)
		db.session.commit()
		user.save(**(request.json))
		db.session.commit()
		return Response(UserSerializer().serialize(user, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/users/', methods=['GET', 'POST'])
# @login_required
def user():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		pv = PageView(page='User')
		db.session.add(pv)
		db.session.commit()
		return Response(UserSerializer().serialize(User.query.all(), many=True, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'POST':
		user = User(**(request.json))
		pv = PageView(page='User')
		db.session.add(pv)
		db.session.add(user)
		db.session.commit()
		return Response(UserSerializer().serialize(user, pretty=pretty), status=201, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/users/<int:id>/', methods=['GET', 'PUT', 'DELETE'])
def user_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		user = User.query.filter_by(id=id).first_or_404()
		pv = PageView(page='User')
		db.session.add(pv)
		db.session.commit()
		return Response(UserSerializer().serialize(user, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'DELETE':
		user = User.query.filter_by(id=id).first_or_404()
		pv = PageView(page='User')
		db.session.add(pv)
		db.session.delete(user)
		db.session.commit()
		return '', 204
	elif request.method == 'PUT':
		user = User.query.filter_by(id=id).first_or_404()
		user.save(**(request.json))
		pv = PageView(page='User')
		db.session.add(pv)
		db.session.commit()
		return Response(UserSerializer().serialize(user, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/users/<int:id>/isfriend/', methods=['GET'])
def isfriend(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		user1 = User.query.filter_by(id=id).first_or_404()
		user2 = User.query.filter_by(id=session['id']).first()
		pv = PageView(page='User')
		db.session.add(pv)
		db.session.commit()
		if user1 in user2.friends or user2 in user1.friends:
			return Response(json.dumps({'status': True}), mimetype='application/json')
		else:
			return Response(json.dumps({'status': False}), mimetype='application/json')


@app.route('/api/' + api_version + '/tags/', methods=['GET', 'POST'])
def tag():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		pv = PageView(page='Tag')
		db.session.add(pv)
		db.session.commit()
		return Response(TagSerializer().serialize(Tag.query.all(), many=True), mimetype='application/json')
	elif request.method == 'POST':
		tag = Tag(**(request.json))
		pv = PageView(page='Tag')
		db.session.add(pv)
		db.session.add(tag)
		db.session.commit()
		return Response(TagSerializer().serialize(tag, pretty=pretty), status=201, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/tags/<id>/', methods=['GET', 'PUT', 'DELETE'])
def tag_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		tag = Tag.query.filter_by(id=id).first_or_404()
		pv = PageView(page='Tag')
		db.session.add(pv)
		db.session.commit()
		return Response(TagSerializer().serialize(tag), mimetype='application/json')
	elif request.method == 'DELETE':
		tag = Tag.query.filter_by(id=id).first_or_404()
		pv = PageView(page='Tag')
		db.session.add(pv)
		db.session.delete(tag)
		db.session.commit()
		return '', 204
	elif request.method == 'PUT':
		tag = Tag.query.filter_by(id=id).first_or_404()
		tag.save(**(request.json))
		pv = PageView(page='Tag')
		db.session.add(pv)
		db.session.commit()
		return Response(TagSerializer().serialize(tag, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/actions/', methods=['GET', 'POST'])
def action():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		pv = PageView(page='Action')
		db.session.add(pv)
		db.session.commit()
		return Response(ActionSerializer().serialize(Action.query.all(), many=True, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'POST':
		action = Action(**(request.json))
		db.session.add(action)
		pv = PageView(page='Action')
		db.session.add(pv)
		db.session.commit()
		return Response(ActionSerializer().serialize(action, pretty=pretty), status=201, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/actions/<int:id>/', methods=['GET', 'PUT', 'DELETE'])
def action_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		action = Action.query.filter_by(id=id).first_or_404()
		pv = PageView(page='Action')
		db.session.add(pv)
		db.session.commit()
		return Response(ActionSerializer().serialize(action, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'DELETE':
		action = Action.query.filter_by(id=id).first_or_404()
		db.session.delete(action)
		pv = PageView(page='Action')
		db.session.add(pv)
		db.session.commit()
		return '', 204
	elif request.method == 'PUT':
		action = Action.query.filter_by(id=id).first_or_404()
		action.save(**(request.json))
		pv = PageView(page='Action')
		db.session.add(pv)
		db.session.commit()
		return Response(ActionSerializer().serialize(action, pretty=pretty), status=200, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/images/', methods=['GET', 'POST'])
def image():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		pv = PageView(page='Image')
		db.session.add(pv)
		db.session.commit()
		return Response(ImageSerializer().serialize(Image.query.all(), many=True), mimetype='application/json')
	elif request.method == 'POST':
		image = Image(**(request.json))
		db.session.add(image)
		pv = PageView(page='Image')
		db.session.add(pv)
		db.session.commit()
		return Response(ImageSerializer().serialize(image, pretty=pretty), status=201, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/images/<int:id>/', methods=['GET', 'PUT', 'DELETE'])
def image_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		image = Image.query.filter_by(id=id).first_or_404()
		pv = PageView(page='Image')
		db.session.add(pv)
		db.session.commit()
		return Response(ImageSerializer().serialize(image), mimetype='application/json')
	elif request.method == 'DELETE':
		image = Image.query.filter_by(id=id).first_or_404()
		db.session.delete(image)
		pv = PageView(page='Image')
		db.session.add(pv)
		db.session.commit()
		return '', 204
	elif request.method == 'PUT':
		image = Image.query.filter_by(id=id).first_or_404()
		image.save(**(request.json))
		pv = PageView(page='Image')
		db.session.add(pv)
		db.session.commit()
		return Response(ImageSerializer().serialize(image, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/useractions/', methods=['GET', 'POST'])
def useraction():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		return Response(UserActionSerializer().serialize(UserAction.query.all(), many=True), mimetype='application/json')
	elif request.method == 'POST':
		useraction = UserAction(**(request.json))
		db.session.add(useraction)
		db.session.commit()
		return Response(UserActionSerializer().serialize(useraction, pretty=pretty), status=201, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/useractions/<int:id>/', methods=['GET', 'PUT', 'DELETE'])
def useraction_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		useraction = UserAction.query.filter_by(id=id).first_or_404()
		return Response(UserActionSerializer().serialize(useraction), mimetype='application/json')
	elif request.method == 'DELETE':
		useraction = UserAction.query.filter_by(id=id).first_or_404()
		db.session.delete(useraction)
		db.session.commit()
		return '', 204
	elif request.method == 'PUT':
		useraction = UserAction.query.filter_by(id=id).first_or_404()
		useraction.save(**(request.json))
		db.session.commit()
		return Response(UserActionSerializer().serialize(useraction, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/user_actions/', methods=['GET'])
def user_actions():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		if 'id' in session:
			user = User.query.filter_by(id=session['id']).first()
			temp = UserAction.query.filter_by(user_id=user.id)
			actions = []
			for t in temp:
				actions.append(Action.query.filter_by(id=t.action_id).first())
			# serializer = ActionSerializer(actions, many=True)
		else:
			actions = []
		pv = PageView(page='User_Action')
		db.session.add(pv)
		db.session.commit()
		return Response(ActionSerializer().serialize(actions, many=True), mimetype='application/json')

@app.route('/api/' + api_version + '/user_actions/<int:id>/', methods=['GET'])
def user_actions_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		temp = UserAction.query.filter_by(user_id=id)
		actions = []
		for t in temp:
			actions.append(Action.query.filter_by(id=t.action_id).first())
		# serializer = ActionSerializer(actions, many=True)
		pv = PageView(page='User_Action')
		db.session.add(pv)
		db.session.commit()
		return Response(ActionSerializer().serialize(actions, many=True), mimetype='application/json')

@app.route('/api/' + api_version + '/user_actions/<int:id>/get_useraction/', methods=['GET'])
def get_useraction(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		useraction = UserAction.query.filter_by(user_id = session['id'], action_id=id).first()
		data = UserActionSerializer().serialize(useraction)
		
		pv = PageView(page='User_Action')
		db.session.add(pv)
		db.session.commit()
		return Response(data, mimetype='application/json')

@app.route('/api/' + api_version + '/action_users/<int:id>/', methods=['GET'])
def action_users_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	temp = UserAction.query.filter_by(action_id=id)
	users = []
	for t in temp:
		users.append(User.query.filter_by(id=t.user_id).first())
	pv = PageView(page='Action_User')
	db.session.add(pv)
	db.session.commit()
	return Response(UserSerializer().serialize(users, many=True))

@app.route('/api/' + api_version + '/comments/', methods=['GET', 'POST'])
def comment():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		pv = PageView(page='Comment')
		db.session.add(pv)
		db.session.commit()
		return Response(CommentSerializer().serialize(Comment.query.all(), many=True, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'POST':
		comment = Comment(**(request.json))
		db.session.add(comment)
		pv = PageView(page='Comment')
		db.session.add(pv)
		db.session.commit()
		return Response(CommentInputSerializer().serialize(comment, pretty=pretty), status=201, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/comments/<int:id>/', methods=['GET', 'PUT', 'DELETE'])
def comment_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	comment = Comment.query.filter_by(id=id).first_or_404()
	if request.method == 'GET':
		pv = PageView(page='Comment')
		db.session.add(pv)
		db.session.commit()
		return Response(CommentSerializer().serialize(comment, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'PUT':
		comment.save(**(request.json))
		pv = PageView(page='Comment')
		db.session.add(pv)
		db.session.commit()
		return Response(CommentInputSerializer().serialize(comment, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'DELETE':
		db.session.delete(comment)
		pv = PageView(page='Comment')
		db.session.add(pv)
		db.session.commit()
		return '', 204

@app.route('/api/' + api_version + '/pageviews/', methods=['GET', 'POST'])
def pageview():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		return Response(PageViewSerializer().serialize(PageView.query.all(), many=True), mimetype='application/json')
	elif request.method == 'POST':
		pageview = PageView(**(request.json))
		db.session.add(pageview)
		db.session.commit()
		return Response(PageViewSerializer().serialize(pageview, pretty=pretty), status=201, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/pageviews/<int:id>/', methods=['GET', 'PUT', 'DELETE'])
def pageview_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	pageview = PageView.query.filter_by(id=id).first_or_404()
	if request.method == 'GET':
		return Response(PageViewSerializer().serialize(pageview), mimetype='application/json')
	elif request.method == 'PUT':
		pageview.save(**(request.json))
		db.session.commit()
		return Response(PageViewSerializer().serialize(pageview, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'DELETE':
		db.session.delete(pageview)
		db.session.commit()
		return '', 204

@app.route('/api/' + api_version + '/settings/', methods=['GET', 'POST'])
def setting():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		pv = PageView(page='Setting')
		db.session.add(pv)
		db.session.commit()
		return Response(SettingSerializer().serialize(Setting.query.all(), many=True), mimetype='application/json')
	elif request.method == 'POST':
		setting = Setting(**(request.json))
		db.session.add(setting)
		pv = PageView(page='Setting')
		db.session.add(pv)
		db.session.commit()
		return Response(SettingSerializer().serialize(setting, pretty=pretty), status=201, mimetype='application/json' if not pretty else 'text/html')

@app.route('/api/' + api_version + '/settings/<int:id>/', methods=['GET', 'PUT', 'DELETE'])
def setting_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		setting = Setting.query.filter_by(id=id).first_or_404()
		pv = PageView(page='Setting')
		db.session.add(pv)
		db.session.commit()
		return Response(SettingSerializer().serialize(setting), mimetype='application/json')
	elif request.method == 'PUT':
		setting = Setting.query.filter_by(id=id).first_or_404()
		setting.save(**(request.json))
		pv = PageView(page='Setting')
		db.session.add(pv)
		db.session.commit()
		return Response(SettingSerializer().serialize(setting, pretty=pretty), mimetype='application/json' if not pretty else 'text/html')
	elif request.method == 'DELETE':
		setting = Setting.query.filter_by(id=id).first_or_404()
		db.session.delete(setting)
		pv = PageView(page='Setting')
		db.session.add(pv)
		db.session.commit()
		return '', 204

@app.route('/api/' + api_version + '/action_comments/<int:id>/', methods=['GET'])
def action_comment_with_id(id):
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if request.method == 'GET':
		pv = PageView(page='Action_Comment')
		db.session.add(pv)
		db.session.commit()
		comments = Comment.query.filter_by(action_id=id).all()
		return Response(CommentSerializer().serialize(comments, many=True), mimetype='application/json')

@app.route('/api/' + api_version + '/suggested/', methods=['GET'])
def suggested():
	pretty = True
	if 'X-Requested-With' in request.headers:
		pretty = False
	print pretty

	if 'id' not in session:
		abort(404)

	user_id = session['id']
	
	people = []
	friends = {}

	for u in User.query.all():
		# Add each users id into the people list
		people.append(u.id)
		# Add each users friends into the friends dictionary
		friend_list = []
		for friend in u.friends:
			friend_list.append(friend.id)
		friends[u.id] = friend_list 

	print("DEBUG SUGGESTIONS")
	print("User: " + str(user_id))
	print("People: " + str(people))
	print("Friends: " + str(friends))

	friends = get_suggestion(user_id, people, friends)	

	print("Suggested Friends: " + str(friends[:MAX_SUGGESTIONS]))

	friend_objs = []
	for friend in friends[:MAX_SUGGESTIONS]:
		if friend == user_id:
			continue
		friend_obj = User.query.filter_by(id=friend).first()
		friend_objs.append(friend_obj)

	return Response(UserSerializer().serialize(friend_objs, many=True), mimetype='application/json')

@app.route('/api/' + api_version + '/change_password/', methods=['POST'])
def change_password():
	if 'id' not in session:
		abort(404)
	new_password = request.form['new_password']
	user = User.query.filter_by(id=session['id']).first_or_404()
	user.save(password=new_password)
	db.session.commit()
	print(new_password)
	return '', 204

@app.route('/api/' + api_version + '/upload_image/', methods=['POST'])
def upload_image():
	file_obj = request.files['0']
	m = md5()
	
	f = file_obj.read()
	m.update(f)

	original_hex = m.hexdigest()

	im = pilImage.open(StringIO(f))
	output = StringIO()
	im.save(output, format='PNG')


	data = output.getvalue()
	m = md5()
	m.update(data)
	new_hex = m.hexdigest()
	image = Image.query.filter_by(hash=new_hex).first()
	if not image:
		f = open(os.path.dirname(os.path.realpath(__file__)) + '/../../static/images/' + new_hex + '.png', 'wb')
		f.write(data)
		f.close()
		new_image = Image(hash=new_hex)
		db.session.add(new_image)
		db.session.commit()
	else:
		new_image = image
	# os.remove(os.path.dirname(os.path.realpath(__file__)) + '/../../static/temp/' + original_hex + '.png')
	return Response(json.dumps({'id' : new_image.id}), mimetype='application/json')
	# for chunk in file_obj.chunks():
	# 	m.update(chunk)
	# data = ""
	# for chunk in file_obj.chunks():
	# 	data += chunk

	# original_hex = m.hexdigest()
	# im = pilImage.open(StringIO(data))
	# im.save(os.path.dirname(os.path.realpath(__file__)) + '/static/skvallra/temp/' + original_hex + '.png')

	# data = open(os.path.dirname(os.path.realpath(__file__)) + '/static/skvallra/temp/' + original_hex + '.png', 'r').read()
	# m = md5()
	# m.update(data)
	# new_hex = m.hexdigest()
	# images = Image.objects.filter(image_hash=new_hex)
	# if len(images) == 0:
	# 	f = open(os.path.dirname(os.path.realpath(__file__)) + '/static/skvallra/images/' + new_hex + '.png', 'wb')
	# 	f.write(data)
	# 	f.close()
	# 	new_image = Image(image_hash=new_hex)
	# 	new_image.save()
	# else:
	# 	new_image = images[0]
	# os.remove(os.path.dirname(os.path.realpath(__file__)) + '/static/skvallra/temp/' + original_hex + '.png')
	# return Response({'id': new_image.pk}, status=200)

@app.route('/api/' + api_version + '/number_of_users/', methods=['GET'])
def number_of_users():
	output = {}
	output['headers'] = ["Number of Users", len(User.query.all())]
	output['elements'] = []
	return Response(json.dumps(output), mimetype='application/json')

@app.route('/api/' + api_version + '/actions_per_user/', methods=['GET'])
def actions_per_user():
	number_of_buckets = 10

	useractions = UserAction.query.filter_by(role=1)

	users = {}
	for ua in useractions:
		try:
			users[User.query.filter_by(id=ua.user_id).first()] += 1
		except KeyError:
			users[User.query.filter_by(id=ua.user_id).first()] = 1
	
	temp = OrderedDict()
	try:
		largest_amount = max(users.values())
	except ValueError, e:
		largest_amount = 0
	
	smallest_amount = 0

	if largest_amount - smallest_amount < 10:
		number_of_buckets = largest_amount - smallest_amount + 1

	number_of_counts_per_bucket = (largest_amount + 1) / number_of_buckets

	for i in range(number_of_buckets):
		if i * number_of_counts_per_bucket == (i * number_of_counts_per_bucket) + number_of_counts_per_bucket - 1:
			key = str(i * number_of_counts_per_bucket)
		else:
			key = str(i * number_of_counts_per_bucket) + "-" + str((i * number_of_counts_per_bucket) + number_of_counts_per_bucket - 1)
		temp[key] = 0


	for k,v in users.iteritems():
		for i in range(number_of_buckets):
			if (i * number_of_counts_per_bucket <= v and (i * number_of_counts_per_bucket) + number_of_counts_per_bucket - 1 > v) or (i * number_of_counts_per_bucket == (i * number_of_counts_per_bucket) + number_of_counts_per_bucket - 1 and v == i * number_of_counts_per_bucket):
				if i * number_of_counts_per_bucket == (i * number_of_counts_per_bucket) + number_of_counts_per_bucket - 1:
					temp[str(i * number_of_counts_per_bucket)] += 1
				else:
					temp[str(i * number_of_counts_per_bucket) + "-" + str((i * number_of_counts_per_bucket) + number_of_counts_per_bucket - 1)] += 1
				break

	output = {}
	output['headers'] = ["Number of Actions", "Number of Users"]
	output['elements'] = temp.items()

	return Response(json.dumps(output), mimetype='application/json')

@app.route('/api/' + api_version + '/search/<id>/users/', methods=['GET'])
def users_search(id):
	print id
	users = User.query.filter(and_(or_(User.first_name.like('%' + str(id) + '%'), User.last_name.like('%' + str(id) + '%')), User.id != session['id'])).all()
	print users
	users = list(users)[:5]

	return Response(UserSerializer().serialize(users, many=True), mimetype='application/json')

@app.route('/api/' + api_version + '/search/<id>/actions/', methods=['GET'])
def actions_search(id):
	actions = Action.query.filter(and_(or_(Action.title.like('%' + str(id) + '%'), Action.description.like('%' + str(id) + '%')), Action.public==True)).all()
	actions = list(actions)[:5]

	return Response(ActionSerializer().serialize(actions, many=True), mimetype='application/json')

@app.route('/api/' + api_version + '/search/<id>/invite_users/', methods=['GET'])
def invite_users(id):
	users_in_action = UserAction.query.filter_by(action_id=id).all()
	users = []
	for u in users_in_action:
		users.append(int(u.user_id))

	potential_members = User.query.filter(~User.id.in_(users)).all()

	return Response(UserSerializer().serialize(potential_members, many=True), mimetype='application/json')

@app.route('/api/' + api_version + '/page_views/<type>/', defaults={'number': 7, 'offset': 0}, methods=['GET'])
@app.route('/api/' + api_version + '/page_views/<type>/<int:number>/', defaults={'offset': 0}, methods=['GET'])
@app.route('/api/' + api_version + '/page_views/<type>/<int:number>/<int:offset>/', methods=['GET'])
def page_views(type, number, offset):
	current = datetime.utcnow()
	td = timedelta(days=offset)
	end_date = current - td + timedelta(days=1)
	start_date = end_date - timedelta(days=number)

	pageViews = PageView.query.filter(and_(PageView.date.between(start_date, end_date), PageView.page.like(type)))
	count = {}
	for i in range((end_date - start_date).days):
		count[str((start_date + timedelta(days=i)).date())] = 0

	for pv in pageViews:
		count[str(pv.date.date())] += 1

	srt = sorted(count.items(), key=lambda x : x)
	output = []

	while len(srt) > 0:
		top = srt.pop(0)
		output.append([top[0], top[1]])

	return Response(json.dumps(output), mimetype='application/json')

@app.route('/api/' + api_version + '/top_actions/', defaults={'number': 5, 'offset': 0}, methods=['GET'])
@app.route('/api/' + api_version + '/top_actions/<int:number>/', defaults={'offset': 0}, methods=['GET'])
@app.route('/api/' + api_version + '/top_actions/<int:number>/<int:offset>/', methods=['GET'])
def top_actions(number, offset):
	current = datetime.utcnow()

	actions = Action.query.filter(or_(and_(Action.start_date <= current, Action.end_date > current), Action.start_date >= current)).all()
	useractions = UserAction.query.filter(UserAction.action_id.in_(actions)).all()

	acts = {}
	for u in useractions:
		try:
			acts[Action.query.filter_by(id=u.action_id).first()] += 1
		except KeyError:
			acts[Action.query.filter_by(id=u.action_id).first()] = 1

	srt = sorted(acts.items(), key=lambda x : x[1], reverse=True)
	output = {}
	output['headers'] = ["Title", "Number of Users"]
	output['elements'] = []
	while len(output['elements']) < number and len(srt) > 0:
		top = srt.pop(0)
		if offset <= 0:
			output['elements'].append([top[0].title, top[1]])
		offset -= 1
		offset = max(offset, 0)

	return Response(json.dumps(output), mimetype='application/json')

@app.route('/api/' + api_version + '/top_tags/', defaults={'number': 5, 'offset': 0}, methods=['GET'])
@app.route('/api/' + api_version + '/top_tags/<int:number>/', defaults={'offset': 0}, methods=['GET'])
@app.route('/api/' + api_version + '/top_tags/<int:number>/<int:offset>/', methods=['GET'])
def top_tags(number, offset):
	tags = {}
	users = User.query.all()
	actions = Action.query.all()
	for u in users:
		for t in u.activities:
			try:
				tags[t] += 1
			except KeyError:
				tags[t] = 1
		for t in u.interests:
			try:
				tags[t] += 1
			except KeyError:
				tags[t] = 1
	for a in actions:
		for t in a.tags:
			try:
				tags[t] += 1
			except KeyError:
				tags[t] = 1

	srt = sorted(tags.items(), key=lambda x : x[1], reverse=True)
	output = {}
	output['headers'] = ["Tag", "Count"]
	output['elements'] = []
	while len(output['elements']) < number and len(srt) > 0:
		top = srt.pop(0)
		if offset <= 0:
			output['elements'].append([top[0].id, top[1]])
		offset -= 1
		offset = max(offset, 0)


	return Response(json.dumps(output), mimetype='application/json')

@app.route('/api/' + api_version + '/top_organizers/', defaults={'number': 5, 'offset': 0}, methods=['GET'])
@app.route('/api/' + api_version + '/top_organizers/<int:number>/', defaults={'offset': 0}, methods=['GET'])
@app.route('/api/' + api_version + '/top_organizers/<int:number>/<int:offset>/', methods=['GET'])
def top_organizers(number, offset):
	ranks = {}
	for u in User.query.all():
		try:
			ranks[u.get_rating()].append(u)
		except KeyError:
			ranks[u.get_rating()] = [u]

	srt = sorted(ranks.items(), reverse=True)
	output = {}
	output['headers'] = ["Username", "Rank"]
	output['elements'] = []
	while len(output['elements']) < number and len(srt) > 0:
		top = srt.pop(0)
		rank = top[0]
		users = top[1]
		while len(output['elements']) < number and len(users) > 0:
			usr = users.pop(0)
			if offset <= 0:
				output['elements'].append([usr.username, rank])
			offset -= 1
			offset = max(offset, 0)
	
	return Response(json.dumps(output), mimetype='application/json')
