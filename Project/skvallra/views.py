from django.db.models import Q
from django.shortcuts import render
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import viewsets, views
from rest_framework.response import Response
from rest_framework.decorators import link, permission_classes
from rest_framework.parsers import MultiPartParser

from rest_framework.permissions import TokenHasReadWriteScope

from hashlib import md5

import os

from PIL import Image as pilImage
from StringIO import StringIO

from skvallra.models import SkvallraUser, Tag, Action, UserAction, Image, Setting, Comment
from skvallra.serializers import SkvallraUserSerializer, TagSerializer, ActionSerializer, UserActionSerializer, ImageSerializer, SettingSerializer, CommentSerializer, CommentInputSerializer


class SkvallraUserViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = SkvallraUser.objects.all()
	serializer_class = SkvallraUserSerializer

	permission_classes = (TokenHasReadWriteScope,)

	@link()
	def isfriend(self, request, pk=None):
		user = request.user
		if user.is_authenticated():
			if SkvallraUser.objects.get(pk=pk).friends.filter(pk=user.pk):
				return Response({'status': True})
			else:
				return Response({'status': False})
		else:
			return Response(status=401)

class meViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	serializer_class = SkvallraUserSerializer
	model = SkvallraUser
	# permission_classes = (TokenHasReadWriteScope,)

	@permission_classes((TokenHasReadWriteScope, ))
	def list(self, request):
		user = request.user
		if not user.is_anonymous():
			serializer = SkvallraUserSerializer(user)
			return Response(serializer.data)
		return Response(status=401)


	@permission_classes((TokenHasReadWriteScope, ))
	def retrieve(self, request, pk=None):
		user = request.user
		if not user.is_anonymous():
			serializer = SkvallraUserSerializer(user)
			return Response(serializer.data)
		return Response(status=401)

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
<<<<<<< Updated upstream
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

    @link()
    def get_useraction(self, request, pk=None):
        try:
            queryset = UserAction.objects.get(user_id = request.user.pk, action_id=pk)
            serializer = UserActionSerializer(queryset)
            data = serializer.data
        except ObjectDoesNotExist:
            data = {}
        return Response(data)
=======
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

	@link()
	def get_useraction(self, request, pk=None):
		try:
			queryset = UserAction.objects.get(user_id = request.user.pk, action_id=pk)
			print(pk)
			serializer = UserActionSerializer(queryset)
			data = serializer.data
		except ObjectDoesNotExist:
			data = {}
		return Response(data)
>>>>>>> Stashed changes

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

class ActionCommentViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users' comments to be viewed or edited.
	"""
	serializer_class = CommentSerializer
	model = Comment
	# permission_classes = (TokenHasReadWriteScope, )

	def list(self, request):
		return Response({})

	def retrieve(self, request, pk=None):
		comments = Comment.objects.filter(action_id=pk)
		serializer = CommentSerializer(comments, many=True)
		return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows user comments to be viewed or edited.
	"""
	queryset = Comment.objects.all()
	serializer_class = CommentInputSerializer
	# permission_classes = (TokenHasReadWriteScope, )

class SearchViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows to searching for users or actions.
	"""
	serializer_class = SkvallraUserSerializer
	model = SkvallraUser

	def list(self, request):
			return Response({})

	def retrieve(self, request, pk=None):
		return self.users(request, pk)

	@link()
	def users(self, request, pk=None):
		users = SkvallraUser.objects.filter((Q(first_name__contains=pk) | Q(last_name__contains=pk)) & ~Q(pk=request.user.pk))

		serializer = SkvallraUserSerializer(users, many=True)
		return Response(serializer.data)

	@link()
	def actions(self, request, pk=None):
		actions = Action.objects.filter(Q(title__contains=pk, public=True) | Q(description__contains=pk, public=True))
		
		serializer = ActionSerializer(actions, many=True)
		return Response(serializer.data)

def index(request):
	return render(request, "skvallra/index.html", {})

class ChangePassword(views.APIView):

	def post(self, request):
		new_password = request.POST['new_password']
		request.user.password = new_password
		request.user.save()
		print(new_password)
		return Response(status=204)


class UploadImage(views.APIView):
	parser_classes = (MultiPartParser, )

	def post(self, request):
		file_obj = request.FILES['0']
		# print(type(file_obj))
		m = md5()
		for chunk in file_obj.chunks():
			m.update(chunk)
		data = ""
		for chunk in file_obj.chunks():
			data += chunk

		original_hex = m.hexdigest()
		im = pilImage.open(StringIO(data))
		im.save(os.path.dirname(os.path.realpath(__file__)) + '/static/skvallra/temp/' + original_hex + '.png')

		data = open(os.path.dirname(os.path.realpath(__file__)) + '/static/skvallra/temp/' + original_hex + '.png', 'r').read()
		m = md5()
		m.update(data)
		new_hex = m.hexdigest()
		images = Image.objects.filter(image_hash=new_hex)
		if len(images) == 0:
			f = open(os.path.dirname(os.path.realpath(__file__)) + '/static/skvallra/images/' + new_hex + '.png', 'wb')
			f.write(data)
			f.close()
			new_image = Image(image_hash=new_hex)
			new_image.save()
		else:
			new_image = images[0]
		os.remove(os.path.dirname(os.path.realpath(__file__)) + '/static/skvallra/temp/' + original_hex + '.png')
		return Response({'id': new_image.pk}, status=200)
		
