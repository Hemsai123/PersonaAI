from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health, name='health'),
    path('ping', views.ping, name='ping'),
    path('ask', views.ask, name='ask'),
    path('memorial-video', views.memorial_video, name='memorial_video'),
    path('generate-video', views.generate_video, name='generate_video'),
    path('generate-video-status', views.generate_video_status, name='generate_video_status'),
    path('cancel-video', views.cancel_video, name='cancel_video'),
]
