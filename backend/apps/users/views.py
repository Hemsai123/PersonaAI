from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.utils import timezone
from .serializers import SignupSerializer, LoginSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
            },
            'token': tokens['access'],
        }, status=status.HTTP_201_CREATED)
    return Response({'error': serializer.errors.get('email', ['Signup failed'])[0]}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        return Response({
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
            },
            'token': tokens['access'],
        })
    return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        'user': {
            'id': str(user.id),
            'name': user.name,
            'email': user.email,
            'created_at': user.date_joined.isoformat(),
        }
    })
