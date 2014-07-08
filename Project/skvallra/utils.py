from flask import Flask, g, request, Response, abort, session, redirect, url_for
from sqlalchemy.orm.collections import InstrumentedList
from functools import wraps
import json

from skvallra import db
from models import User

from datetime import datetime


# class login_required(object):

# 	def __init__(self, f):
# 		self.f = f
# 		self.__name__ = f.__name__

# 	def __call__(self):
# 		print request.headers
# 		if 'id' in session:
# 			print 'pass'
# 			return self.f()
# 		else:
# 			print 'fail'
# 			abort(401)

def login_required(f):
	@wraps(f)
	def decorated_function(*args, **kwargs):
		if 'id' not in session or not User.query.filter_by(id=session['id']).first():
			abort(401)
		return f(*args, **kwargs)
	return decorated_function



class BaseSerializer(object):
	"""docstring for BaseSerializer"""
	fields = []
	model = None

	def __init__(self):
		super(BaseSerializer, self).__init__()

	def serialize(self, obj, many=False, pretty=False):
		out = ""
		if many:
			out += "["
			if len(obj) > 0:
				for o in obj[:-1]:
					out += self._serialize(o) + ", "
				else:
					out += self._serialize(obj[-1])
			out += "]"
		else:
			out += self._serialize(obj)
		if pretty:
			out = json.dumps(json.loads(out), indent=4)
			out = out.replace('\n', '<br>')
			out = out.replace(' ', '&nbsp;')
			out = '<pre style="width: 900px; margin-left: auto; margin-right: auto;">' + out + '</pre>'
		return out

	def _serialize(self, obj):
		out = "{"
		if obj != None and len(self.fields) > 0:
			for field in self.fields[:-1]:
				try:
					func = self.__getattribute__(field)
					if isinstance(func, BaseSerializer):
						value = obj.__getattribute__(field)
						value = func.model.query.filter_by(id=value).first()
						value = func.serialize(value)
					else:
						value = obj.__getattribute__(func)(field)
				except AttributeError, e:
					try:
						value = obj.__getattribute__(field)
					except AttributeError, e:
						raise e

				if isinstance(value, str):
					str_val = value
				else:
					str_val = str(value)
					str_val = str_val.replace('\r', '\\r')
					str_val = str_val.replace('\n', '\\n')
					str_val = '"' + str_val + '"'

				if isinstance(value, list):
					value = list(value)

				try:
					if not isinstance(value, str):
						str_val = json.dumps(value)
				except TypeError, e:
					if isinstance(value, list):
						new_val = []
						for v in value:
							if isinstance(v, db.Model):
								new_val.append(v.id)
							else:
								new_val.append(v)
						str_val = json.dumps(new_val)

				out += '"' + field + '":' + str_val + ', '

			else:
				try:
					func = self.__getattribute__(self.fields[-1])
					if isinstance(func, BaseSerializer):
						value = obj.__getattribute__(self.fields[-1])
						value = func.model.query.filter_by(id=value).first()
						value = func.serialize(value)
					else:
						value = obj.__getattribute__(func)(self.fields[-1])
				except AttributeError, e:
					try:
						value = obj.__getattribute__(self.fields[-1])
					except AttributeError, e:
						raise e

				if isinstance(value, str):
					str_val = value
				else:
					str_val = str(value)
					str_val = str_val.replace('\r', '\\r')
					str_val = str_val.replace('\n', '\\n')
					str_val = '"' + str_val + '"'

				if isinstance(value, list):
					value = list(value)

				try:
					if not isinstance(value, str):
						str_val = json.dumps(value)
				except TypeError, e:
					if isinstance(value, list):
						new_val = []
						for v in value:
							if isinstance(v, db.Model):
								new_val.append(v.id)
							else:
								new_val.append(v)
						str_val = json.dumps(new_val)

				out += '"' + self.fields[-1] + '":' + str_val

		out += "}"
		return out

	def load(self, string):
		d = json.loads(string)
		return model(**d)