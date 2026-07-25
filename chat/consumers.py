import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import ChatRoom, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        print(f"WS Connect: {self.room_name}")

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        print(f"WS Disconnect: {self.room_name}")
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        print(f"WS Receive text: {text_data}")
        data = json.loads(text_data)
        message = data.get('message')
        username = data.get('username')

        # Save message to database
        msg_obj = await self.save_message(username, self.room_name, message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username,
                'timestamp': str(msg_obj.timestamp) if msg_obj else ""
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        timestamp = event['timestamp']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username,
            'timestamp': timestamp
        }))

    @database_sync_to_async
    def save_message(self, username, room_name, message):
        try:
            user = User.objects.get(username=username)
            room, _ = ChatRoom.objects.get_or_create(name=room_name)
            return Message.objects.create(room=room, sender=user, content=message)
        except Exception as e:
            print("ERROR saving message:", e)
            return None

