from django.db import models
from django.db import connection

from django.utils import timezone
from django.utils.http import urlquote
from django.utils.translation import ugettext_lazy as _
from django.core.mail import send_mail
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.contrib.auth.hashers import make_password

import sys

import datetime

class Tag(models.Model):
	""" 
	Tag model. Each tag can be associated with any number of Users or Actions. 
	"""
	tag_id = models.CharField("tag", max_length=100, primary_key=True)

	class Meta:
		ordering = ["tag_id"]

	def __unicode__(self):
		return '%s' % self.tag_id


class SkvallraUserManager(BaseUserManager):

	def _create_user(self, username, password, is_staff, is_superuser, **extra_fields):
		"""
		Creates and saves a User with the given email and password.
		"""
		now = timezone.now()
		user = self.model(username=username, password=password, is_staff=is_staff, is_active=True, is_superuser=is_superuser, last_login=now, date_joined=now, **extra_fields)
		user.save(using=self._db)
		return user

	def create_user(self, username, password, **extra_fields):
		return self._create_user(username, password, False, False, **extra_fields)

	def create_superuser(self, username, password, **extra_fields):
		return self._create_user(username, password, True, True, **extra_fields)

class SkvallraUser(AbstractBaseUser, PermissionsMixin):
	"""
	A fully featured User model with admin-compliant permissions.
	Username and password are required. Other fields are optional.
	"""
	username = models.CharField('username', max_length=30, unique=True, db_index=True)
	email = models.EmailField(_('email address'), max_length=256, blank=True)
	first_name = models.CharField(_('first name'), max_length=30, blank=True)
	last_name = models.CharField(_('last name'), max_length=30, blank=True)
	birthday = models.DateTimeField(_('birthday'), default=timezone.now)
	gender = models.BooleanField(_('user gender'), default=True) 
	activities = models.ManyToManyField(Tag, related_name='activities', blank=True, null=True)
	interests = models.ManyToManyField(Tag, related_name='interests', blank=True, null=True)
	friends = models.ManyToManyField('self', related_name='friends', blank=True, null=True)
	address = models.CharField('address', max_length=200, blank=True, null=True)
	coordinates = models.CharField('coordinates', max_length=50, blank=True)
	image = models.ForeignKey('Image', blank=True, null=True, related_name='userpic')
	thumbnail = models.ForeignKey('Image', blank=True, null=True, related_name='userpic_thumbnail')
	is_staff = models.BooleanField(_('staff status'), default=False,
		help_text=_('Designates whether the user can log into this admin '
					'site.'))
	is_active = models.BooleanField(_('active'), default=True,
		help_text=_('Designates whether this user should be treated as '
					'active. Unselect this instead of deleting accounts.'))
	date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

	objects = SkvallraUserManager()

	USERNAME_FIELD = 'username'
	REQUIRED_FIELDS = []

	def save(self, *args, **kwargs):
		if self.pk:
			orig = SkvallraUser.objects.get(pk=self.pk)
			if orig.password != self.password:
				self.password = make_password(self.password)
		else:
			self.password = make_password(self.password)
		super(SkvallraUser, self).save(*args, **kwargs)

	class Meta:
		verbose_name = _('user')
		verbose_name_plural = _('users')

	def get_full_name(self):
		"""
		Returns the first_name plus the last_name, with a space in between.
		"""
		full_name = '%s %s' % (self.first_name, self.last_name)
		return full_name.strip()

	def get_short_name(self):
		"Returns the short name for the user."
		return self.first_name

	def get_rating(self):
		actions = UserAction.objects.filter(user=self, role=1).values_list('action', flat=True)

		total = 0
		count = 0
		for a in actions:
			usractions = UserAction.objects.filter(action=a)
			for u in usractions:
				if u.rating != None:
					total += u.rating
					count += 1
		if count != 0:
			total = total / count
		return total

class Setting(models.Model):
	""" Admin settings. Supported settings include: 
			default userpic (based on user's gender)
			userpic dimensions
			default action picture  
			minimum number of participants
			maximum number of participants
			number of successive invalid login attempts after which the user gets blocked
	"""

	setting_id = models.CharField('setting_name', max_length=100, primary_key=True)
	min_participants = models.IntegerField(default=1)
	max_participants = models.IntegerField(default=1)

	def save(self, *args, **kwargs):
		if(self.min_participants <= self.max_participants):
			super(Setting, self).save()
		else:
			raise Exception, "Maximum number of participants should be greater than minimum number of participants."

class Action(models.Model):
	""" Action model. """

	action_id = models.AutoField("action_id", primary_key=True)
	title = models.CharField(_('action title'), max_length=256)
	description = models.TextField("action description")
	start_date = models.DateTimeField(blank=True, null=True)
	end_date = models.DateTimeField(blank=True, null=True)
	public = models.BooleanField(default=True)
	min_participants = models.IntegerField(default=1)
	max_participants = models.IntegerField(default=1)
	address = models.CharField('address', max_length=200, blank=True, null=True)
	coordinates = models.CharField('coordinates', max_length=50, blank=True, null=True)
	image = models.ForeignKey('Image', blank=True, null=True)
	thumbnail = models.ForeignKey('Image', blank=True, null=True, related_name="event_thumbnail")
	tags = models.ManyToManyField(Tag, related_name='action_tags', blank=True, null=True)

	def save(self, *args, **kwargs):
		if (self.min_participants <= self.max_participants):
			global_settings = Setting.objects.all()
			if global_settings.count() != 0:
				global_settings = global_settings[0]
				if (self.min_participants < global_settings.min_participants):
					raise Exception, "Minimum number of participants is set to at least " + str(global_settings.min_participants) + "."
				elif (self.max_participants > global_settings.max_participants):
					raise Exception, "Maximum number of participants is set to at most " + str(global_settings.max_participants) + "."
				else:
					super(Action, self).save()			
			else:
				super(Action, self).save()
		else:
			raise Exception, "Maximum number of participants should be greater than minimum number of participants."


	def __unicode__(self):
		return u'%s' % self.action_id

	def is_current(self):
		current = datetime.datetime.now(self.start_date.tzinfo)
		print(current, self.start_date, self.end_date)
		if (self.start_date <= current and current <= self.end_date) or current <= self.start_date:
			return True
		else:
			return False


class Image(models.Model):
	""" Image model """

	image_hash = models.CharField('hash', max_length=150)

class UserAction(models.Model):
	""" UserActions """

	user = models.ForeignKey(SkvallraUser)
	action = models.ForeignKey(Action)
	role = models.IntegerField()
	rating = models.IntegerField(blank=True, null=True)

	def save(self, *args, **kwargs):
		action_id = self.action
		user_id = self.user
		all_participants = UserAction.objects.filter(action=action_id)
		number_of_participants = all_participants.count()
		action_max_participants = Action.objects.get(pk=action_id.pk).max_participants
		new_user = all_participants.filter(user=user_id).count() == 0
		if (new_user and (number_of_participants >= action_max_participants)):
			raise Exception, "Unfortunately, no more users can participate in this action."
		else:
			super(UserAction, self).save()

class Comment(models.Model):
	""" User comments on Action wall """

	comment_id = models.AutoField("comment_id", primary_key=True)
	action_id = models.ForeignKey(Action)
	user_id = models.ForeignKey(SkvallraUser)
	comment_time = models.DateTimeField(_('comment time'), default=timezone.now)
	comment =  models.TextField('user_comment')

class PageView(models.Model):

	page = models.CharField(max_length=30)
	date = models.DateTimeField(default=timezone.now)

	def __unicode__(self):
		return self.page + " " + str(self.date)