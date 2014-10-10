from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.bcrypt import generate_password_hash, check_password_hash
from sqlalchemy import event

from skvallra import app, db

from datetime import datetime

class Tag(db.Model):
	""" 
	Tag model. Each tag can be associated with any number of Users or Actions. 
	"""
	id = db.Column(db.String(30), primary_key=True)

	def __init__(self, id):
		self.id =  id

	def save(self, **kwargs):
		pass

	def __repr__(self):
		return '%s' % self.id



class Friends(db.Model):
	__tablename__ = 'friends'
	user1_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
	user2_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)

class User(db.Model):
	"""
	A fully featured User model with admin-compliant permissions.
	Username and password are required. Other fields are optional.
	"""
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(30))
	password = db.Column(db.String(70))
	email = db.Column(db.String(256))
	first_name = db.Column(db.String(30))
	last_name = db.Column(db.String(30))
	birthday = db.Column(db.DateTime)
	gender = db.Column(db.Boolean)
	activities = db.relationship('Tag', secondary='user_tag')
	interests = db.relationship('Tag', secondary='user_tag')
	friends = db.relationship('User', secondary='friends', primaryjoin='User.id==friends.c.user1_id', secondaryjoin='User.id==friends.c.user2_id')
	address = db.Column(db.String(200))
	coordinates = db.Column(db.String(50))
	image = db.Column(db.Integer, db.ForeignKey('image.id'))
	thumbnail = db.Column(db.Integer, db.ForeignKey('image.id'))
	is_staff = db.Column(db.Boolean)
	is_active = db.Column(db.Boolean)
	date_joined = db.Column(db.DateTime)

	def __init__(self, username, password, email, first_name, last_name, image=1, birthday=None, gender=True, address="Default Address", coordinates="", is_staff=False, is_active=True, date_joined=None, **kwargs):
		self.username = username
		self.password = generate_password_hash(password)
		self.email = email
		self.first_name = first_name
		self.last_name = last_name
		self.image = image
		if birthday is None:
			birthday = datetime.utcnow()
		if type(birthday) == type(unicode(birthday)):
			birthday = datetime.strptime(birthday, '%Y-%m-%dT%H:%M:%S.%fZ')
		self.birthday = birthday
		self.gender = gender
		self.address = address
		self.coordinates = coordinates
		self.is_staff = is_staff
		self.is_active = is_active
		if date_joined is None:
			date_joined = datetime.utcnow()
		if type(date_joined) == type(unicode(date_joined)):
			date_joined = datetime.strptime(date_joined, '%Y-%m-%dT%H:%M:%S.%fZ')
		self.date_joined = date_joined
		self.image = 1

	def save(self, **kwargs):
		print kwargs.get('username')
		self.username = kwargs.get('username', self.username)
		password = kwargs.get('password', self.password)
		self.password = generate_password_hash(password) if password != self.password else password
		self.email = kwargs.get('email', self.email)
		self.first_name = kwargs.get('first_name', self.first_name)
		self.last_name = kwargs.get('last_name', self.last_name)
		birthday = kwargs.get('birthday', self.birthday)
		self.birthday = datetime.strptime(birthday, '%Y-%m-%dT%H:%M:%S.%fZ') if type(birthday) == type(unicode('')) else birthday
		self.gender = kwargs.get('gender', self.gender)
		self.address = kwargs.get('address', self.address)
		self.coordinates = kwargs.get('coordinates', self.coordinates)
		self.is_staff = kwargs.get('is_staff', self.is_staff)
		self.is_active = kwargs.get('is_active', self.is_active)
		date_joined = kwargs.get('date_joined', self.date_joined)
		self.date_joined = datetime.strptime(date_joined, '%Y-%m-%dT%H:%M:%S.%fZ') if type(date_joined) == type(unicode('')) else date_joined
		friends = kwargs.get('friends', self.friends)
		new_friends = []
		for f in friends:
			if isinstance(f, int):
				new_friends.append(User.query.filter_by(id=f).first())
			else:
				new_friends.append(f)
		self.friends = new_friends
		
		self.image = kwargs.get('image', self.image)

	def __repr__(self):
		return '%s' % str(self.id)

	def get_rating(self, field):
		print field
		actions = UserAction.query.filter_by(user_id=self.id, role=1).all()

		total = 0
		count = 0
		for a in actions:
			usractions = UserAction.query.filter_by(action_id=a.action_id)
			for u in usractions:
				if u.rating != None:
					total += u.rating
					count += 1
		if count != 0:
			total = total / count
		return total

	def format_date(self, field):
		return "\"" + str(self.__getattribute__(field).strftime('%Y-%m-%dT%H:%M:%S.%fZ')) + "\""

@event.listens_for(User.friends, 'append')
def make_symmetrical(target, value, initiator):
	if value in target.friends:
		raise ValueError

	if target not in value.friends:
		event.remove(User.friends, 'append', make_symmetrical)
		value.friends.append(target)
		event.listen(User.friends, 'append', make_symmetrical)


@event.listens_for(User.friends, 'remove')
def keep_symmetrical(target, value, initiator):
	if target in value.friends:
		event.remove(User.friends, 'remove', keep_symmetrical)
		value.friends.remove(target)
		event.listen(User.friends, 'remove', keep_symmetrical)


class Setting(db.Model):
	""" Admin settings. Supported settings include: 
			default userpic (based on user's gender)
			userpic dimensions
			default action picture  
			minimum number of participants
			maximum number of participants
			number of successive invalid login attempts after which the user gets blocked
	"""
	id = db.Column(db.String(100), primary_key=True)
	min_participants = db.Column(db.Integer)
	max_participants = db.Column(db.Integer)

	def __init__(self, min_participants, max_participants, **kwargs):
		self.min_participants = min_participants
		self.max_participants = max_participants

	def save(self, **kwargs):
		self.min_participants = kwargs.get('min_participants', self.min_participants)
		self.max_participants = kwargs.get('max_participants', self.max_participants)


class ActionTag(db.Model):
	__tablename__ = 'action_tag'
	action_id = db.Column(db.Integer, db.ForeignKey('action.id'), primary_key=True)
	tag_id = db.Column(db.String(30), db.ForeignKey('tag.id'), primary_key=True)

class UserTag(db.Model):
	__tablename__ = 'user_tag'
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
	tag_id = db.Column(db.String(30), db.ForeignKey('tag.id'), primary_key=True)

class Action(db.Model):
	""" Action model. """

	id = db.Column(db.Integer, primary_key=True)
	title = db.Column(db.String(256))
	description = db.Column(db.Text)
	start_date = db.Column(db.DateTime)
	end_date = db.Column(db.DateTime)
	public = db.Column(db.Boolean)
	min_participants = db.Column(db.Integer)
	max_participants = db.Column(db.Integer)
	address = db.Column(db.String(200))
	coordinates = db.Column(db.String(50))
	image = db.Column(db.Integer, db.ForeignKey('image.id'))
	thumbnail = db.Column(db.Integer, db.ForeignKey('image.id'))
	tags = db.relationship('Tag', secondary='action_tag')

	def __init__(self, title, description="Start writing your action description here!", start_date=None, end_date=None, public=True, min_participants=None, max_participants=None, address="Default Address", coordinates="", **kwargs):
		self.title = title
		self.description = description
		if start_date is None:
			start_date = datetime.utcnow()
		if type(start_date) == type(unicode(start_date)):
			start_date = datetime.strptime(start_date, '%Y-%m-%dT%H:%M:%S.%fZ')
		self.start_date = start_date
		if end_date is None:
			end_date = datetime.utcnow()
		if type(end_date) == type(unicode(end_date)):
			end_date = datetime.strptime(end_date, '%Y-%m-%dT%H:%M:%S.%fZ')
		self.end_date = end_date
		self.public = public
		if min_participants == None:
			min_participants = Setting.query.filter_by(id=1).first().min_participants
		self.min_participants = min_participants
		if max_participants == None:
			max_participants = Setting.query.filter_by(id=1).first().max_participants
		self.max_participants = max_participants
		self.address = address
		self.coordinates = coordinates
		self.image = 2

	def save(self, **kwargs):
		self.title = kwargs.get('title', self.title)
		self.description = kwargs.get('description', self.description)
		start_date = kwargs.get('start_date', self.start_date)
		self.start_date = datetime.strptime(start_date, '%Y-%m-%dT%H:%M:%S.%fZ') if type(start_date) == type(unicode('')) else start_date
		
		end_date = kwargs.get('end_date', self.end_date)
		self.end_date = datetime.strptime(end_date, '%Y-%m-%dT%H:%M:%S.%fZ') if type(end_date) == type(unicode('')) else end_date

		self.public = kwargs.get('public', self.public)
		self.min_participants = kwargs.get('min_participants', self.min_participants)
		self.max_participants = kwargs.get('max_participants', self.max_participants)
		self.address = kwargs.get('address', self.address)
		self.coordinates = kwargs.get('coordinates', self.coordinates)
		self.image = kwargs.get('image', self.image)

	def __repr__(self):
		return '%s' % self.id

	def format_date(self, field):
		return "\"" + str(self.__getattribute__(field).strftime('%Y-%m-%dT%H:%M:%S.%fZ')) + "\""

class Image(db.Model):
	""" Image model """
	__tablename__ = 'image'
	id = db.Column(db.Integer, primary_key=True)
	hash = db.Column(db.String(150))

	def __init__(self, hash, **kwargs):
		self.hash = hash

	def save(self, **kwargs):
		self.hash = kwargs.get('hash', self.hash)

	def __repr__(self):
		return '%r' % self.id

class UserAction(db.Model):
	""" UserActions """
	id = db.Column(db.Integer, primary_key=True)
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
	action_id = db.Column(db.Integer, db.ForeignKey('action.id'))

	role = db.Column(db.Integer)
	rating = db.Column(db.Integer)

	def __init__(self, user_id, action_id, role=2, rating=None, **kwargs):
		self.user_id = user_id
		self.action_id = action_id
		self.role = role

	def save(self, **kwargs):
		self.user_id = kwargs.get('user_id', self.user_id)
		self.action_id = kwargs.get('action_id', self.action_id)
		self.role = kwargs.get('role', self.role)
		self.rating = kwargs.get('rating', self.rating)

class Comment(db.Model):
	""" User comments on Action wall """
	id = db.Column(db.Integer, primary_key=True)
	
	action_id = db.Column(db.Integer, db.ForeignKey('action.id'))
	action = db.relationship('Action', backref=db.backref('actions', lazy='dynamic'))
	
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
	user = db.relationship('User', backref=db.backref('users', lazy='dynamic'))
	
	comment_time = db.Column(db.DateTime)
	comment =  db.Column(db.Text)

	def __init__(self, action_id, user_id, comment, comment_time=None):
		self.action_id = action_id
		self.user_id = user_id
		self.comment = comment
		if comment_time is None:
			comment_time = datetime.utcnow()
		self.comment_time = comment_time

	def save(self, **kwargs):
		self.action_id = kwargs.get('action_id', self.action_id)
		self.user_id = kwargs.get('user_id', self.user_id)
		comment_time = kwargs.get('comment_time', self.comment_time)
		self.comment_time = datetime.strptime(comment_time, '%Y-%m-%dT%H:%M:%S.%fZ') if type(comment_time) == type(unicode('')) else comment_time
		self.comment = kwargs.get('comment', self.comment)

	def format_date(self, field):
		return "\"" + str(self.__getattribute__(field).strftime('%Y-%m-%dT%H:%M:%S.%fZ')) + "\""

class PageView(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	page = db.Column(db.String(30))
	date = db.Column(db.DateTime)

	def __init__(self, page, date=None):
		self.page = page
		if date is None:
			date = datetime.utcnow()
		self.date = date

	def save(self, **kwargs):
		self.page = kwargs.get('page', self.page)
		date = kwargs.get('date', self.date)
		self.date = datetime.strptime(date, '%Y-%m-%dT%H:%M:%S.%fZ') if type(date) == type(unicode('')) else date

	def __repr__(self):
		return '%r %r' % self.page, str(self.date)

	def format_date(self, field):
		return "\"" + str(self.__getattribute__(field).strftime('%Y-%m-%dT%H:%M:%S.%fZ')) + "\""