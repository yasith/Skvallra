from django.contrib import admin
from skvallra.models import *

from django.contrib.auth.hashers import make_password


admin.site.register(Tag)
admin.site.register(Action)
admin.site.register(UserAction)
admin.site.register(Image)
admin.site.register(Comment)
admin.site.register(Setting)
admin.site.register(SkvallraUser)
admin.site.register(PageView)
