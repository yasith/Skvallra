from skvallra.models import SkvallraUser, Tag, Action, UserAction, Image, Setting, Comment
from rest_framework import viewsets
from skvallra.serializers import SkvallraUserSerializer, TagSerializer, ActionSerializer, UserActionSerializer, ImageSerializer, SettingSerializer, CommentSerializer


class SkvallraUserViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = SkvallraUser.objects.all()
	serializer_class = SkvallraUserSerializer

class TagViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = Tag.objects.all()
	serializer_class = TagSerializer

class ActionViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = Action.objects.all()
	serializer_class = ActionSerializer

class UserActionViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = UserAction.objects.all()
	serializer_class = UserActionSerializer

class ImageViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = Image.objects.all()
	serializer_class = ImageSerializer

class SettingViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = Setting.objects.all()
	serializer_class = SettingSerializer

class CommentViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = Comment.objects.all()
	serializer_class = CommentSerializer