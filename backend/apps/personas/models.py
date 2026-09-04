import uuid
from django.db import models
from django.conf import settings

class Persona(models.Model):
    slug = models.SlugField(max_length=60, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='personas')
    name = models.CharField(max_length=100)
    prompt = models.TextField()
    description = models.CharField(max_length=500, default='')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base = self.name.lower().strip().replace(' ', '-')
            base = ''.join(c for c in base if c.isalnum() or c == '-')
            base = base[:40].strip('-')
            suffix = uuid.uuid4().hex[:6]
            self.slug = f'{base}-{suffix}'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
