from skvallra.models import SkvallraUser, SkvallraUserManager, Action, Tag, Image, UserAction, Setting, Comment

from rest_framework import serializers

from django.contrib.auth.hashers import make_password

import sys

class SkvallraUserSerializer(serializers.ModelSerializer):
    rating = serializers.IntegerField(source='get_rating', read_only=True)
    password = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = SkvallraUser

        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name', 'rating', 'birthday', 'activities', 'interests', 'friends', 'address', 'coordinates', 'image')

    def restore_object(self, attrs, instance=None):
        """
        Given a dictionary of deserialized field values, either update
        an existing model instance, or create a new model instance.
        """
        if instance is not None:
            instance.username = attrs.get('username', instance.username)
            instance.password = attrs.get('password', instance.password)
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
            return instance

        activities = attrs['activities']
        del attrs['activities']
        interests = attrs['interests']
        del attrs['interests']
        friends = attrs['friends']
        del attrs['friends']
        if attrs['image'] == None:
            attrs['image'] = Image.objects.get(pk=1)
        try: 
            if attrs['address'] == None:
                attrs['address'] = "Default address"
        except KeyError:
            attrs['address'] = "Default address"

        instance = SkvallraUser(**attrs)

        return instance

class MeSerializer(serializers.ModelSerializer):

    class Meta:
        model = SkvallraUser
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name', 'birthday', 'activities', 'interests', 'friends', 'address', 'coordinates', 'image', 'is_staff', 'is_active', 'date_joined')

    def restore_object(self, attrs, instance=None):
        """
        Given a dictionary of deserialized field values, either update
        an existing model instance, or create a new model instance.
        """
        print >>sys.stderr, "this got called"
        if instance is not None:
            instance.username = attrs.get('username', instance.username)
            instance.password = instance.password if attrs.get('password', None) == None else make_password(attrs.get('password', None))
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
            instance.date_joined = attrs.get('date_joined', instance.date_joined)
            return instance

        SUM = SkvallraUserManager()
        instance = SUM.create_user(**attrs)
        instance.password = make_password(instance.password)
        return instance

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['tag_id']

class ActionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Action
        fields = ('action_id', 'title', 'description', 'start_date', 'end_date', 'public', 'min_participants', 'max_participants', 'address', 'coordinates', 'image', 'tags')

    def restore_object(self, attrs, instance=None):
            """
            Given a dictionary of deserialized field values, either update
            an existing model instance, or create a new model instance.
            """
            if instance is not None:
                instance.action_id = attrs.get('action_id', instance.action_id)
                instance.title = attrs.get('title', instance.title)
                instance.description = attrs.get('description', instance.description)
                instance.start_date = attrs.get('start_date', instance.start_date)
                instance.end_date = attrs.get('end_date', instance.end_date)
                instance.public = attrs.get('public', instance.public)
                instance.min_participants = attrs.get('min_participants', instance.min_participants)
                instance.max_participants = attrs.get('max_participants', instance.max_participants)
                instance.address = attrs.get('address', instance.address)
                instance.coordinates = attrs.get('coordinates', instance.coordinates)
                instance.image = attrs.get('image', instance.image)
                instance.tags = attrs.get('tags', instance.tags)
                return instance
            tags = attrs['tags']
            del attrs['tags']
            if attrs['image'] == None:
                attrs['image'] = Image.objects.get(pk=2)
            try: 
                if attrs['address'] == None:
                    attrs['address'] = "Default address"
            except KeyError:
                attrs['address'] = "Default address"

            try: 
                if attrs['description'] == None:
                    attrs['description'] = "Start writing your action description here!"
            except KeyError:
                attrs['description'] = "Start writing your action description here!"


            instance = Action(**attrs)
            return instance


class UserActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAction
        fields = ('id', 'user', 'action', 'role', 'rating')

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['image_hash']

class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = ('setting_id', 'min_participants', 'max_participants')

class UserInfoSerializer(serializers.ModelSerializer):
    image = ImageSerializer()

    class Meta:
        model = SkvallraUser
        fields = ('first_name', 'last_name', 'image')
   
class CommentInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('comment_id', 'action_id', 'user_id', 'comment_time', 'comment')

class CommentSerializer(serializers.ModelSerializer):
    user_id = UserInfoSerializer()
    comment_time = serializers.DateTimeField(format='%b %d, %Y %H:%M:%S')

    class Meta:
        model = Comment
        fields = ('comment_id', 'action_id', 'user_id', 'comment_time', 'comment')
