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

urlpatterns = patterns('',
	# Examples:
	# url(r'^$', 'Project.views.home', name='home'),
	# url(r'^blog/', include('blog.urls')),

	url(r'^oauth2/', include('provider.oauth2.urls', namespace='oauth2')),
	url(r'^admin/', include(admin.site.urls)),

	url(r'^api/top_tags/(?P<number>\d+)/(?P<offset>\d+)/', views.TopTags.as_view()),
	url(r'^api/top_tags/(?P<number>\d+)/', views.TopTags.as_view(), {'offset': 0}),
	url(r'^api/top_tags/', views.TopTags.as_view(), {'number': 5, 'offset': 0}),

	url(r'^api/top_organizers/(?P<number>\d+)/(?P<offset>\d+)/', views.TopOrganizers.as_view()),
	url(r'^api/top_organizers/(?P<number>\d+)/', views.TopOrganizers.as_view(), {'offset': 0}),
	url(r'^api/top_organizers/', views.TopOrganizers.as_view(), {'number': 5, 'offset': 0}),

	url(r'^api/upload_image/', views.UploadImage.as_view()),
	url(r'^api/change_password/', views.ChangePassword.as_view()),

	url(r'^api/', include(router.urls)),
	url(r'(^.{1,2}$|^.{3}(?<!api).*)', include("skvallra.urls")),
	# url(r'^[^api/]', include("skvallra.urls")),
	url(r'^$', include("skvallra.urls")),
)
