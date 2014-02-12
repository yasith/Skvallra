from django.db import models
from django.db import connection

from django.db import models
from django.utils import timezone
from django.utils.http import urlquote
from django.utils.translation import ugettext_lazy as _
from django.core.mail import send_mail
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class Tag(models.Model):
    """ 
    Tag model. Each tag can be associated with any number of Users or Actions. 
    """
    tag_id = models.CharField("tag", max_length=100, primary_key=True)

    class Meta:
        ordering = ["tag_id"]

    def __unicode__(self):
        return '%s' % self.name


class SkvallraUserManager(BaseUserManager):

    def _create_user(self, username, password, is_staff, is_superuser, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        """
        now = timezone.now()
        user = self.model(username=username, 
                          is_staff=is_staff, is_active=True,
                          is_superuser=is_superuser, last_login=now,
                          date_joined=now, **extra_fields)
        user.set_password(password)
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
    email = models.EmailField(_('email address'), max_length=254, blank=True)
    first_name = models.CharField(_('first name'), max_length=30, blank=True)
    last_name = models.CharField(_('last name'), max_length=30, blank=True)
    activities = models.ManyToManyField(Tag, related_name='user_activities', blank=True, null=True)
    interests = models.ManyToManyField(Tag, related_name='user_interests', blank=True, null=True)
    friends = models.ManyToManyField(SkvallraUser, related_name='user_friends', blank=True, null=True)
    address = models.CharField('address', max_length=200, blank=True, null=True)
    coordinates = models.CharField('coordinates', max_length=50)
    image = models.ForeignKey('Image', blank=True, null=True)
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


class Action(models.Model):
    """ Action model. """
    
    action_id = models.AutoField("action_id", primary_key=True)
    description = models.TextField("action description", blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    public = models.BooleanField(default=True)
    min_participants = models.IntegerField(default=1)
    max_participants = models.IntegerField(default=1)
    address = models.CharField('address', max_length=200, blank=True, null=True)
    coordinates = models.CharField('coordinates', max_length=50)
    image = models.ForeignKey('Image', blank=True, null=True)
    tags = models.ManyToManyField(Tag, related_name='action_tags')



    def __unicode__(self):
        return '%s' % self.action_id

    # def clean(self, *args, **kwargs):
    #     if (start_date is not None) and (end_date is not None) and (start_date >= end_date):
    #         raise ValidationError('End date must be later than start date.')

    #     if min_participants > max_participants:
    #         raise ValidationError('Minimum number of participants must be less or equal to \
    #                                         maximum number of participants.')
    #     if min_participants > global_min_participants:
    #         raise ValidationError('Minimum number of participants must be greater or equal to ' +
    #                                          str(global_min_participants) + '.')

    #     super(Action, self).clean(*args, **kwargs)


class Image(models.Model):
    """ Image model """

    image_hash = models.CharField('coordinates', max_length=50)


class UserAction(models.Model):
    """ UserActions """

    user = models.ForeignKey(SkvallraUser)
    action = models.ForeignKey(Action)
    role = models.IntegerField()
    rating = models.IntegerField(blank=True, null=True)


class Setting(models.Model):
    """ Admin settings """

    setting_id = models.CharField('setting_name', max_length=100, primary_key=True)
    setting_type = models.CharField('type', max_length=20)
    value = models.CharField('value', max_length=20)

class Comment(models.Model):
    """ User comments on Action wall """

    comment_id = models.AutoField("comment_id", primary_key=True)
    action_id = models.ForeignKey(Action)
    user_id = models.ForeignKey(SkvallraUser)
    comment_time = models.DateTimeField(_('comment time'), default=timezone.now)
    comment =  models.TextField('user_comment')

