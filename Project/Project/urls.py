from django.conf.urls import patterns, url, include
from django.contrib import admin

from rest_framework import routers
from skvallra import views
admin.autodiscover()

router = routers.DefaultRouter()

router.register(r'users', views.SkvallraUserViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'actions', views.ActionViewSet)
router.register(r'useractions', views.UserActionViewSet)
router.register(r'action_users', views.ActionUsersView)
router.register(r'user_actions', views.UserActionsView)
router.register(r'images', views.ImageViewSet)
router.register(r'settings', views.SettingViewSet)
router.register(r'comments', views.CommentViewSet)
router.register(r'action_comments', views.ActionCommentViewSet)
router.register(r'me', views.meViewSet)
router.register(r'search', views.SearchViewSet)
router.register(r'suggested', views.SuggestedFriendsViewSet)

urlpatterns = patterns('',
	# Examples:
	# url(r'^$', 'Project.views.home', name='home'),
	# url(r'^blog/', include('blog.urls')),

	url(r'^oauth2/', include('provider.oauth2.urls', namespace='oauth2')),
	url(r'^admin/', include(admin.site.urls)),

	url(r'^api/number_of_users/', views.NumberOfUsers.as_view()),
	url(r'^api/actions_per_user/', views.NumberOfActionsPerUser.as_view()),

	url(r'^api/page_views/(?P<type>\w+)/(?P<number>\d+)/(?P<offset>\d+)/', views.PageViewsByDay.as_view()),
	url(r'^api/page_views/(?P<type>\w+)/(?P<number>\d+)/', views.PageViewsByDay.as_view(), {'offset': 0}),
	url(r'^api/page_views/(?P<type>\w+)/', views.PageViewsByDay.as_view(), {'number': 7, 'offset': 0}),

	url(r'^api/top_actions/(?P<number>\d+)/(?P<offset>\d+)/', views.TopActions.as_view()),
	url(r'^api/top_actions/(?P<number>\d+)/', views.TopActions.as_view(), {'offset': 0}),
	url(r'^api/top_actions/', views.TopActions.as_view(), {'number': 5, 'offset': 0}),

	url(r'^api/top_tags/(?P<number>\d+)/(?P<offset>\d+)/', views.TopTags.as_view()),
	url(r'^api/top_tags/(?P<number>\d+)/', views.TopTags.as_view(), {'offset': 0}),
	url(r'^api/top_tags/', views.TopTags.as_view(), {'number': 5, 'offset': 0}),

	url(r'^api/top_organizers/(?P<number>\d+)/(?P<offset>\d+)/', views.TopOrganizers.as_view()),
	url(r'^api/top_organizers/(?P<number>\d+)/', views.TopOrganizers.as_view(), {'offset': 0}),
	url(r'^api/top_organizers/', views.TopOrganizers.as_view(), {'number': 5, 'offset': 0}),

	url(r'^api/upload_image/', views.UploadImage.as_view()),
	url(r'^api/change_password/', views.ChangePassword.as_view()),
	url(r'^api/is_admin/', views.IsAdmin.as_view()),

	url(r'^api/', include(router.urls)),
	url(r'(^.{1,2}$|^.{3}(?<!api).*)', include("skvallra.urls")),
	# url(r'^[^api/]', include("skvallra.urls")),
	url(r'^$', include("skvallra.urls")),
)
