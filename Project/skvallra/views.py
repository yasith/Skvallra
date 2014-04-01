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

from django.utils import timezone

from datetime import datetime
from datetime import date
from datetime import timedelta
import pytz

from collections import OrderedDict

from skvallra.models import SkvallraUser, Tag, Action, UserAction, Image, Setting, Comment, PageView
from skvallra.serializers import SkvallraUserSerializer, TagSerializer, ActionSerializer, UserActionSerializer, ImageSerializer, SettingSerializer, CommentSerializer, CommentInputSerializer

from suggestions import get_suggestion

MAX_SUGGESTIONS = 5

class SkvallraUserViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = SkvallraUser.objects.all()
	serializer_class = SkvallraUserSerializer

	permission_classes = (TokenHasReadWriteScope,)

	def list(self, request):
		pv = PageView(page="User")
		pv.save()
		return Response(SkvallraUserSerializer(SkvallraUser.objects.all(), many=True).data)

	def retrieve(self, request, pk=None):
		pv = PageView(page="User")
		pv.save()
		return Response(SkvallraUserSerializer(SkvallraUser.objects.get(pk=pk)).data)

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

	@permission_classes((TokenHasReadWriteScope, ))
	def list(self, request):
		user = request.user
		if not user.is_anonymous():
			pv = PageView(page="Profile")
			pv.save()
			serializer = SkvallraUserSerializer(user)
			return Response(serializer.data)
		return Response(status=401)


	@permission_classes((TokenHasReadWriteScope, ))
	def retrieve(self, request, pk=None):
		user = request.user
		if not user.is_anonymous():
			pv = PageView(page="Profile")
			pv.save()
			serializer = SkvallraUserSerializer(user)
			return Response(serializer.data)
		return Response(status=401)

class TagViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows tags to be viewed or edited.
	"""
	queryset = Tag.objects.all()
	serializer_class = TagSerializer

	def list(self, request):
		pv = PageView(page="Tag")
		pv.save()
		return Response(TagSerializer(Tag.objects.all(), many=True).data)

	def retrieve(self, request, pk=None):
		pv = PageView(page="Tag")
		pv.save()
		return Response(TagSerializer(Tag.objects.get(pk=pk)).data)

class ActionViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows actions to be viewed or edited.
	"""
	queryset = Action.objects.all()
	serializer_class = ActionSerializer

	def list(self, request):
		pv = PageView(page="Action")
		pv.save()
		return Response(ActionSerializer(Action.objects.all(), many=True).data)

	def retrieve(self, request, pk=None):
		pv = PageView(page="Action")
		pv.save()
		return Response(ActionSerializer(Action.objects.get(pk=pk)).data)

class UserActionViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users to be viewed or edited.
	"""
	queryset = UserAction.objects.all()
	serializer_class = UserActionSerializer

	def list(self, request):
		pv = PageView(page="UserAction")
		pv.save()
		return Response(UserActionSerializer(UserAction.objects.all(), many=True).data)

	def retrieve(self, request, pk=None):
		pv = PageView(page="UserAction")
		pv.save()
		return Response(UserActionSerializer(UserAction.objects.get(pk=pk)).data)

class UserActionsView(viewsets.ModelViewSet):   
	serializer_class = UserActionSerializer
	model = UserAction

	def list(self, request):
		pv = PageView(page="User_Action")
		pv.save()
		user = request.user
		temp = UserAction.objects.filter(user_id=user.id)
		actions = []
		for t in temp:
			actions.append(Action.objects.get(pk=t.action_id))
		serializer = ActionSerializer(actions, many=True)
		return Response(serializer.data)

	def retrieve(self, request, pk=None):
		pv = PageView(page="User_Action")
		pv.save()
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

class ActionUsersView(viewsets.ModelViewSet):   
	serializer_class = SkvallraUserSerializer
	model = SkvallraUser

	def list(self, request):
		return Response({})

	def retrieve(self, request, pk=None):
		pv = PageView(page="Action_User")
		pv.save()
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

	def list(self, request):
		pv = PageView(page="Image")
		pv.save()
		return Response(ImageSerializer(Image.objects.all(), many=True).data)

	def retrieve(self, request, pk=None):
		pv = PageView(page="Image")
		pv.save()
		return Response(ImageSerializer(Image.objects.get(pk=pk)).data)

class SuggestedFriendsViewSet(viewsets.ModelViewSet):
	"""
	API end point that shows suggested friends for a given user
	"""

	queryset = SkvallraUser.objects.all()
	serializer_class = SkvallraUserSerializer

	def list(self, request):
		user_id = request.user.pk
		
		people = []
		friends = {}

		for u in SkvallraUser.objects.all():
			# Add each users id into the people list
			people.append(u.pk)
			# Add each users friends into the friends dictionary
			friend_list = []
			for friend in u.friends.all():
				friend_list.append(friend.pk)
			friends[u.pk] = friend_list 

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
			friend_obj = SkvallraUser.objects.get(pk=friend)
			friend_objs.append(friend_obj)

		serializer = SkvallraUserSerializer(friend_objs, many=True)
		return Response(serializer.data)

class SettingViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows settings to be viewed or edited.
	"""
	queryset = Setting.objects.all()
	serializer_class = SettingSerializer

	def list(self, request):
		pv = PageView(page="Setting")
		pv.save()
		return Response(SettingSerializer(Setting.objects.all(), many=True).data)

	def retrieve(self, request, pk=None):
		pv = PageView(page="Setting")
		pv.save()
		return Response(SettingSerializer(Setting.objects.get(pk=pk)).data)

class ActionCommentViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows users' comments to be viewed or edited.
	"""
	serializer_class = CommentSerializer
	model = Comment

	def list(self, request):
		return Response({})

	def retrieve(self, request, pk=None):
		pv = PageView(page="ActionComment")
		pv.save()
		comments = Comment.objects.filter(action_id=pk).order_by('-comment_time')
		serializer = CommentSerializer(comments, many=True)
		return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that allows user comments to be viewed or edited.
	"""
	queryset = Comment.objects.all()
	serializer_class = CommentInputSerializer

	def list(self, request):
		pv = PageView(page="Comment")
		pv.save()
		return Response(CommentSerializer(Comment.objects.all(), many=True).data)

	def retrieve(self, request, pk=None):
		pv = PageView(page="Comment")
		pv.save()
		return Response(CommentSerializer(Comment.objects.get(pk=pk)).data)

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
		users = SkvallraUser.objects.filter((Q(first_name__icontains=pk) | Q(last_name__icontains=pk)) & ~Q(pk=request.user.pk))
		users = list(users)[:5]

		serializer = SkvallraUserSerializer(users, many=True)
		return Response(serializer.data)

	@link()
	def actions(self, request, pk=None):
		actions = Action.objects.filter(Q(title__icontains=pk, public=True) | Q(description__icontains=pk, public=True))
		actions = list(actions)[:5]
		
		serializer = ActionSerializer(actions, many=True)
		return Response(serializer.data)

	@link()
	def invite_users(self, request, pk=None):
		users_in_action = UserAction.objects.filter(action_id=pk).values_list('user', flat=True)
		potential_members = SkvallraUser.objects.exclude(pk__in=users_in_action)
		serializer = SkvallraUserSerializer(potential_members, many=True)
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
		
class TopOrganizers(views.APIView):

	def get(self, request, number, offset):
		number = int(number)
		offset = int(offset)
		ranks = {}
		for u in SkvallraUser.objects.all():
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
		
		return Response(output, status=200)

class TopTags(views.APIView):
	
	def get(self, request, number, offset):
		number = int(number)
		offset = int(offset)

		tags = {}
		users = SkvallraUser.objects.all()
		actions = Action.objects.all()
		for u in users:
			for t in u.activities.all():
				try:
					tags[t] += 1
				except KeyError:
					tags[t] = 1
			for t in u.interests.all():
				try:
					tags[t] += 1
				except KeyError:
					tags[t] = 1
		for a in actions:
			for t in a.tags.all():
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
				output['elements'].append([top[0].tag_id, top[1]])
			offset -= 1
			offset = max(offset, 0)


		return Response(output, status=200)

class TopActions(views.APIView):

	def get(self, request, number, offset):
		number = int(number)
		offset = int(offset)
		current = datetime.now(pytz.utc)

		actions = Action.objects.filter(Q(start_date__lte=current, end_date__gt=current) | Q(start_date__gte=current))
		useractions = UserAction.objects.filter(action_id__in=actions)

		acts = {}
		for u in useractions:
			try:
				acts[Action.objects.get(pk=u.action_id)] += 1
			except KeyError:
				acts[Action.objects.get(pk=u.action_id)] = 1

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

		return Response(output, status=200)

class NumberOfUsers(views.APIView):

	def get(self, request):
		output = {}
		output['headers'] = ["Number of Users", len(SkvallraUser.objects.all())]
		output['elements'] = []
		return Response(output, status=200)

class NumberOfActionsPerUser(views.APIView):

	def get(self, request):
		number_of_buckets = 10

		useractions = UserAction.objects.filter(role=1)

		users = {}
		for ua in useractions:
			try:
				users[SkvallraUser.objects.get(pk=ua.user_id)] += 1
			except KeyError:
				users[SkvallraUser.objects.get(pk=ua.user_id)] = 1
		
		temp = OrderedDict()
		largest_amount = max(users.values())
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

		return Response(output, status=200)

class PageViewsByDay(views.APIView):

	def get(self, request, type, number, offset):
		number = int(number)
		offset = int(offset)
		current = timezone.now().date()
		td = timedelta(days=offset)
		end_date = current - td + timedelta(days=1)
		start_date = end_date - timedelta(days=number)

		pageViews = PageView.objects.filter(date__range=(start_date, end_date), page=type)
		count = {}
		for i in range((end_date - start_date).days):
			count[start_date + timedelta(days=i)] = 0
		for pv in pageViews:
			count[pv.date.date()] += 1

		srt = sorted(count.items(), key=lambda x : x)
		output = []

		while len(srt) > 0:
			top = srt.pop(0)
			output.append([top[0], top[1]])

		return Response(output, status=200)

class IsAdmin(views.APIView):

	def get(self, request):
		return Response(request.user.is_staff, status=200)
