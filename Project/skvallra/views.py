from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response

from skvallra.models import SkvallraUser, Tag, Action, UserAction, Image, Setting, Comment
from skvallra.serializers import SkvallraUserSerializer, TagSerializer, ActionSerializer, UserActionSerializer, ImageSerializer, SettingSerializer, CommentSerializer


class SkvallraUserViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = SkvallraUser.objects.all()
	serializer_class = SkvallraUserSerializer

class meViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	serializer_class = SkvallraUserSerializer
	model = SkvallraUser

	def list(self, request):
		user = request.user
		if not user.is_anonymous():
			serializer = SkvallraUserSerializer(user)
			return Response(serializer.data)
		return Response({})

	def retrieve(self, request, pk=None):
		user = request.user
		if not user.is_anonymous():
			serializer = SkvallraUserSerializer(user)
			return Response(serializer.data)
		return Response({})

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

def index(request):
	return render(request, "skvallra/index.html", {})