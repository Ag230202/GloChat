from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import ChatRoom, Message, Profile
from .serializers import UserSerializer, RegisterSerializer, RoomSerializer, MessageSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        profile = user.profile
        data = request.data
        if 'name' in data:
            profile.name = data['name']
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
        profile.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id)

class RoomListView(generics.ListCreateAPIView):
    queryset = ChatRoom.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RoomSerializer

    def get_queryset(self):
        # We can find or create rooms. Let's return all rooms.
        return ChatRoom.objects.all()

class RoomMessageHistoryView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_name = self.kwargs['room_name']
        room, created = ChatRoom.objects.get_or_create(name=room_name)
        return Message.objects.filter(room=room)
