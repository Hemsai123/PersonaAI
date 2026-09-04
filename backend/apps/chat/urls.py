from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_sessions_list_create, name='list_create'),
    path('<int:id>', views.chat_sessions_detail, name='detail'),
    path('<int:id>/messages', views.add_chat_message, name='add_message'),
]
