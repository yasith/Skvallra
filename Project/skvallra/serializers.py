from skvallra.models import SkvallraUser, Action, Tag, Image, UserAction, Setting, Comment
from rest_framework import serializers

class SkvallraUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkvallraUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'activities', 'interests', 'friends', 'address', 'coordinates', 'image', 'is_staff', 'is_active', 'date_joined')

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