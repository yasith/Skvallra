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
router.register(r'images', views.ImageViewSet)
router.register(r'settings', views.SettingViewSet)
router.register(r'comments', views.CommentViewSet)

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'Project.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    
    url(r'^admin/', include(admin.site.urls)),
	url(r'^', include(router.urls)),
)