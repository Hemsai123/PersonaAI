from django.urls import path
from . import views

urlpatterns = [
    path('', views.personas_list_create, name='list_create'),
    path('<int:id>', views.personas_delete, name='delete'),
    path('<slug:slug>', views.personas_detail, name='detail'),
]
