from rest_framework import serializers
from .models import Persona

class PersonaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Persona
        fields = ['id', 'slug', 'name', 'prompt', 'description', 'is_public', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            'id': str(instance.id),
            'slug': instance.slug,
            'name': instance.name,
            'description': instance.description,
            'created_at': instance.created_at.isoformat(),
        }

class PersonaDetailSerializer(serializers.ModelSerializer):
    creator_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Persona
        fields = ['id', 'slug', 'name', 'prompt', 'description', 'is_public', 'created_at', 'creator_name']
    
    def get_creator_name(self, obj):
        return obj.user.name
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            'id': str(instance.id),
            'slug': instance.slug,
            'name': instance.name,
            'prompt': instance.prompt,
            'description': instance.description,
            'created_at': instance.created_at.isoformat(),
            'creator_name': self.get_creator_name(instance),
        }

class PersonaCreateSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    class Meta:
        model = Persona
        fields = ['name', 'prompt', 'description']
    
    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError('Name is required')
        return value[:100]
    
    def validate_prompt(self, value):
        if not value:
            raise serializers.ValidationError('Prompt is required')
        return value
    
    def validate_description(self, value):
        return (value or '')[:500]
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def to_representation(self, instance):
        return {
            'id': str(instance.id),
            'slug': instance.slug,
            'name': instance.name,
            'description': instance.description,
            'created_at': instance.created_at.isoformat(),
        }
