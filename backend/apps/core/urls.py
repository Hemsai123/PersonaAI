from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health, name='health'),
    path('health/', views.health, name='health_slash'),
    path('ping', views.ping, name='ping'),
    path('ping/', views.ping, name='ping_slash'),
    path('ask', views.ask, name='ask'),
    path('ask/', views.ask, name='ask_slash'),
    path('memorial-video', views.memorial_video, name='memorial_video'),
    path('memorial-video/', views.memorial_video, name='memorial_video_slash'),
    path('generate-video', views.generate_video, name='generate_video'),
    path('generate-video/', views.generate_video, name='generate_video_slash'),
    path('generate-video-status', views.generate_video_status, name='generate_video_status'),
    path('generate-video-status/', views.generate_video_status, name='generate_video_status_slash'),
    path('cancel-video', views.cancel_video, name='cancel_video'),
    path('cancel-video/', views.cancel_video, name='cancel_video_slash'),
]
