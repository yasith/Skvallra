from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response

from rest_framework.permissions import TokenHasReadWriteScope

from skvallra.models import SkvallraUser, Tag, Action, UserAction, Image, Setting, Comment
from skvallra.serializers import SkvallraUserSerializer, TagSerializer, ActionSerializer, UserActionSerializer, ImageSerializer, SettingSerializer, CommentSerializer


class SkvallraUserViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = SkvallraUser.objects.all()
	serializer_class = SkvallraUserSerializer

	permission_classes = (TokenHasReadWriteScope,)

class meViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	serializer_class = SkvallraUserSerializer
	model = SkvallraUser
	permission_classes = (TokenHasReadWriteScope,)

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
	API endpoint that allows tags to be viewed or edited.
	"""
	queryset = Tag.objects.all()
	serializer_class = TagSerializer
	# permission_classes = (TokenHasReadWriteScope, )

class ActionViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows actions to be viewed or edited.
	"""
	queryset = Action.objects.all()
	serializer_class = ActionSerializer
	# permission_classes = (TokenHasReadWriteScope, )

class UserActionViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = UserAction.objects.all()
	serializer_class = UserActionSerializer
	# permission_classes = (TokenHasReadWriteScope, )


class UserActionsView(viewsets.ModelViewSet):   
    serializer_class = UserActionSerializer
    model = UserAction
    # permission_classes = (TokenHasReadWriteScope, )

    def list(self, request):
        user = request.user
        temp = UserAction.objects.filter(user_id=user.id)
        actions = []
        for t in temp:
            actions.append(Action.objects.get(pk=t.action_id))
        serializer = ActionSerializer(actions, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        temp = UserAction.objects.filter(user_id=pk)
        actions = []
        for t in temp:
            actions.append(Action.objects.get(pk=t.action_id))
        serializer = ActionSerializer(actions, many=True)
        return Response(serializer.data)


class ActionUsersView(viewsets.ModelViewSet):   
    serializer_class = SkvallraUserSerializer
    model = SkvallraUser
    # permission_classes = (TokenHasReadWriteScope, )

    def list(self, request):
        return Response({})

    def retrieve(self, request, pk=None):
        temp = UserAction.objects.filter(action_id=pk)
        users = []
        for t in temp:
            users.append(SkvallraUser.objects.get(pk=t.user_id))
        serializer = SkvallraUserSerializer(users, many=True)
        return Response(serializer.data)

class ImageViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows a relationship between users and actions to be viewed or edited.
	"""
	queryset = Image.objects.all()
	serializer_class = ImageSerializer
	# permission_classes = (TokenHasReadWriteScope, )

class SettingViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows settings to be viewed or edited.
	"""
	queryset = Setting.objects.all()
	serializer_class = SettingSerializer
	# permission_classes = (TokenHasReadWriteScope, )

class CommentViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users' comments to be viewed or edited.
	"""
	queryset = Comment.objects.all()
	serializer_class = CommentSerializer
	# permission_classes = (TokenHasReadWriteScope, )

def index(request):
	return render(request, "skvallra/index.html", {})