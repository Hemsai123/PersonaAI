import uuid
from django.db import models
from django.conf import settings
from apps.personas.models import Persona

class ChatSession(models.Model):
    SESSION_TYPES = (
        ('chat', 'chat'),
        ('debate', 'debate'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_sessions')
    persona = models.ForeignKey(Persona, on_delete=models.SET_NULL, null=True, blank=True, related_name='chat_sessions')
    title = models.CharField(max_length=120, default='New session')
    persona_prompt = models.TextField(default='')
    session_type = models.CharField(max_length=10, choices=SESSION_TYPES, default='chat')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'session_type', '-updated_at']),
        ]
    
    def __str__(self):
        return f'{self.title} ({self.session_type})'

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=[('user', 'user'), ('assistant', 'assistant'), ('system', 'system')])
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]
    
    def __str__(self):
        return f'{self.role}: {self.content[:50]}'
