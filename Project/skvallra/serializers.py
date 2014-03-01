from skvallra.models import SkvallraUser, Action, Tag, Image, UserAction, Setting, Comment
from rest_framework import serializers

import sys

class SkvallraUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkvallraUser
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name', 'birthday', 'activities', 'interests', 'friends', 'address', 'coordinates', 'image', 'is_staff', 'is_active', 'date_joined')
        # depth = 1

	def restore_object(self, attrs, instance=None):
		"""
		Given a dictionary of deserialized field values, either update
		an existing model instance, or create a new model instance.
		"""
		print >>sys.stderr, "this got called"
		if instance is not None:
			instance.username = attrs.get('username', instance.username)
			instance.password = instance.password if attrs.get('password', None) == None else make_password(attrs.get('password', None))
			print instance.password
			instance.email = attrs.get('email', instance.email)
			instance.first_name = attrs.get('first_name', instance.first_name)
			instance.last_name = attrs.get('last_name', instance.last_name)
			instance.birthday = attrs.get('birthday', instance.birthday)
			instance.activities = attrs.get('activities', instance.activities)
			instance.interests = attrs.get('interests', instance.interests)
			instance.friends = attrs.get('friends', instance.friends)
			instance.address = attrs.get('address', instance.address)
			instance.coordinates = attrs.get('coordinates', instance.coordinates)
			instance.image = attrs.get('image', instance.image)
			instance.is_staff = attrs.get('is_staff', instance.is_staff)
			instance.is_active = attrs.get('is_active', instance.is_active)
			instance.date_joined = attrs.get('date_joined', instance.date_joined)
			return instance
		instance = SkvallraUser(**attrs)
		instance.password = make_password(instance.password)
		return instance

class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkvallraUser
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name', 'birthday', 'activities', 'interests', 'friends', 'address', 'coordinates', 'image', 'is_staff', 'is_active', 'date_joined')
        # depth = 1

	def restore_object(self, attrs, instance=None):
		"""
		Given a dictionary of deserialized field values, either update
		an existing model instance, or create a new model instance.
		"""
		print >>sys.stderr, "this got called"
		if instance is not None:
			instance.username = attrs.get('username', instance.username)
			instance.password = instance.password if attrs.get('password', None) == None else make_password(attrs.get('password', None))
			print instance.password
			instance.email = attrs.get('email', instance.email)
			instance.first_name = attrs.get('first_name', instance.first_name)
			instance.last_name = attrs.get('last_name', instance.last_name)
			instance.birthday = attrs.get('birthday', instance.birthday)
			instance.activities = attrs.get('activities', instance.activities)
			instance.interests = attrs.get('interests', instance.interests)
			instance.friends = attrs.get('friends', instance.friends)
			instance.address = attrs.get('address', instance.address)
			instance.coordinates = attrs.get('coordinates', instance.coordinates)
			instance.image = attrs.get('image', instance.image)
			instance.is_staff = attrs.get('is_staff', instance.is_staff)
			instance.is_active = attrs.get('is_active', instance.is_active)
			instance.date_joined = attrs.get('date_joined', instance.date_joined)
			return instance
		instance = SkvallraUser(**attrs)
		instance.password = make_password(instance.password)
		return instance

class TagSerializer(serializers.ModelSerializer):
	class Meta:
		model = Tag
		fields = ['tag_id']

class ActionSerializer(serializers.ModelSerializer):
	class Meta:
		model = Action
		fields = ('action_id', 'description', 'start_date', 'end_date', 'public', 'min_participants', 'max_participants', 'address', 'coordinates', 'image', 'tags')

class UserActionSerializer(serializers.ModelSerializer):
	class Meta:
		model = UserAction
		fields = ('user', 'action', 'role', 'rating')

class ImageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Image
		fields = ['image_hash']

class SettingSerializer(serializers.ModelSerializer):
	class Meta:
		model = Setting
		fields = ('setting_id', 'setting_type', 'value')

class CommentSerializer(serializers.ModelSerializer):
	class Meta:
		model = Comment
		fields = ('comment_id', 'action_id', 'user_id', 'comment_time', 'comment')
