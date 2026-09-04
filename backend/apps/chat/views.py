from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageCreateSerializer

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def chat_sessions_list_create(request):
    if request.method == 'GET':
        query = {'user': request.user}
        session_type = request.query_params.get('type')
        if session_type:
            query['session_type'] = session_type
        
        sessions = ChatSession.objects.filter(**query).order_by('-updated_at')
        return Response({
            'sessions': [
                {
                    'id': str(s.id),
                    'persona_id': str(s.persona_id) if s.persona_id else None,
                    'title': s.title,
                    'persona_prompt': s.persona_prompt,
                    'type': s.session_type,
                    'metadata': s.metadata,
                    'created_at': s.created_at.isoformat(),
                    'updated_at': s.updated_at.isoformat(),
                    'message_count': s.messages.count(),
                }
                for s in sessions
            ]
        })
    
    if request.method == 'POST':
        title = request.data.get('title', 'New session')
        persona_prompt = request.data.get('personaPrompt', '')
        persona_id = request.data.get('personaId')
        session_type = request.data.get('type', 'chat')
        metadata = request.data.get('metadata', {})
        
        if not persona_prompt and session_type != 'debate':
            return Response({'error': 'Persona prompt is required for chat sessions'}, status=status.HTTP_400_BAD_REQUEST)
        
        linked_persona_id = None
        if persona_id:
            from apps.personas.models import Persona
            persona = Persona.objects.filter(pk=persona_id, user=request.user).first()
            if persona:
                linked_persona_id = persona.id
        
        session = ChatSession.objects.create(
            user=request.user,
            persona_id=linked_persona_id,
            title=str(title)[:120] or 'New session',
            persona_prompt=str(persona_prompt or ''),
            session_type=session_type if session_type in ['chat', 'debate'] else 'chat',
            metadata=metadata if isinstance(metadata, dict) else {},
        )
        
        return Response({
            'session': {
                'id': str(session.id),
                'persona_id': str(session.persona_id) if session.persona_id else None,
                'title': session.title,
                'persona_prompt': session.persona_prompt,
                'type': session.session_type,
                'metadata': session.metadata,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            },
            'messages': []
        }, status=status.HTTP_201_CREATED)

@api_view(['GET', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def chat_sessions_detail(request, id):
    if request.method == 'GET':
        session = get_object_or_404(ChatSession, pk=id, user=request.user)
        messages = session.messages.all().order_by('created_at')
        return Response({
            'session': {
                'id': str(session.id),
                'persona_id': str(session.persona_id) if session.persona_id else None,
                'title': session.title,
                'persona_prompt': session.persona_prompt,
                'type': session.session_type,
                'metadata': session.metadata,
                'created_at': session.created_at.isoformat(),
                'updated_at': session.updated_at.isoformat(),
            },
            'messages': [
                {
                    'id': str(m.id),
                    'role': m.role,
                    'content': m.content,
                    'created_at': m.created_at.isoformat(),
                }
                for m in messages
            ]
        })
    
    if request.method == 'DELETE':
        session = get_object_or_404(ChatSession, pk=id, user=request.user)
        ChatMessage.objects.filter(session=session).delete()
        session.delete()
        return Response({'ok': True})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_chat_message(request, id):
    session = get_object_or_404(ChatSession, pk=id, user=request.user)
    serializer = ChatMessageCreateSerializer(data=request.data, context={'session': session})
    if serializer.is_valid():
        message = serializer.save()
        return Response({'message': {
            'id': str(message.id),
            'role': message.role,
            'content': message.content,
            'created_at': message.created_at.isoformat(),
        }})
    return Response({'error': 'Valid role and content are required'}, status=status.HTTP_400_BAD_REQUEST)
