from rest_framework import serializers
from .models import ChatSession, ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def to_representation(self, instance):
        return {
            'id': str(instance.id),
            'role': instance.role,
            'content': instance.content,
            'created_at': instance.created_at.isoformat(),
        }

class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'persona', 'title', 'persona_prompt', 'session_type', 'metadata', 'created_at', 'updated_at', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            'id': str(instance.id),
            'persona_id': str(instance.persona_id) if instance.persona_id else None,
            'title': instance.title,
            'persona_prompt': instance.persona_prompt,
            'type': instance.session_type,
            'metadata': instance.metadata,
            'created_at': instance.created_at.isoformat(),
            'updated_at': instance.updated_at.isoformat(),
            'message_count': self.get_message_count(instance),
        }

class ChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'persona', 'title', 'persona_prompt', 'session_type', 'metadata', 'created_at', 'updated_at', 'messages', 'message_count']
    
    def get_messages(self, obj):
        messages = obj.messages.all().order_by('created_at')
        return [
            {
                'id': str(m.id),
                'role': m.role,
                'content': m.content,
                'created_at': m.created_at.isoformat(),
            }
            for m in messages
        ]
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def to_representation(self, instance):
        return {
            'session': {
                'id': str(instance.id),
                'persona_id': str(instance.persona_id) if instance.persona_id else None,
                'title': instance.title,
                'persona_prompt': instance.persona_prompt,
                'type': instance.session_type,
                'metadata': instance.metadata,
                'created_at': instance.created_at.isoformat(),
                'updated_at': instance.updated_at.isoformat(),
            },
            'messages': [
                {
                    'id': str(m.id),
                    'role': m.role,
                    'content': m.content,
                    'created_at': m.created_at.isoformat(),
                }
                for m in instance.messages.all().order_by('created_at')
            ],
        }

class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['role', 'content']
    
    def validate_role(self, value):
        if value not in ['user', 'assistant', 'system']:
            raise serializers.ValidationError('Valid role and content are required')
        return value
    
    def validate_content(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError('Valid role and content are required')
        return str(value).strip()
    
    def create(self, validated_data):
        session = self.context['session']
        message = ChatMessage.objects.create(session=session, **validated_data)
        session.updated_at = message.created_at
        session.save(update_fields=['updated_at'])
        return message
    
    def to_representation(self, instance):
        return {
            'message': {
                'id': str(instance.id),
                'role': instance.role,
                'content': instance.content,
                'created_at': instance.created_at.isoformat(),
            }
        }
