from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, ChatRoom, Message

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['name', 'avatar']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'name']

    def create(self, validated_data):
        name = validated_data.pop('name', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        if name:
            user.profile.name = name
            user.profile.save()
        return user

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'content', 'timestamp']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'created_at']
