from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Persona
from .serializers import PersonaSerializer, PersonaCreateSerializer

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def personas_list_create(request):
    if request.method == 'GET':
        personas = Persona.objects.filter(user=request.user).order_by('-created_at')
        return Response({
            'personas': [
                {
                    'id': str(p.id),
                    'slug': p.slug,
                    'name': p.name,
                    'description': p.description,
                    'created_at': p.created_at.isoformat(),
                }
                for p in personas
            ]
        })
    
    if request.method == 'POST':
        serializer = PersonaCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            persona = serializer.save()
            return Response({'persona': serializer.to_representation(persona)}, status=status.HTTP_201_CREATED)
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def personas_detail(request, slug):
    persona = get_object_or_404(Persona, slug=slug, is_public=True)
    serializer = PersonaCreateSerializer(persona)
    return Response({'persona': {
        'id': str(persona.id),
        'slug': persona.slug,
        'name': persona.name,
        'prompt': persona.prompt,
        'description': persona.description,
        'created_at': persona.created_at.isoformat(),
        'creator_name': persona.user.name,
    }})

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def personas_delete(request, id):
    persona = get_object_or_404(Persona, pk=id, user=request.user)
    persona.delete()
    return Response({'ok': True})
