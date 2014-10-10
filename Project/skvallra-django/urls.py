from django.conf.urls import patterns, url, include

from rest_framework import routers
from skvallra import views

# router = routers.DefaultRouter()
# router.register(r'users', views.SkvallraUserViewSet)
# router.register(r'tags', views.TagViewSet)
# router.register(r'actions', views.ActionViewSet)
# router.register(r'useractions', views.UserActionViewSet)
# router.register(r'images', views.ImageViewSet)
# router.register(r'settings', views.SettingViewSet)
# router.register(r'comments', views.CommentViewSet)
# router.register(r'me', views.meViewSet)

urlpatterns = patterns('',
	# url(r'^api/', include(router.urls)),
	url(r'^', views.index, name="index"),
)

