from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, CurrentUserView, UserListView, RoomListView, RoomMessageHistoryView

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/me/', CurrentUserView.as_view(), name='me'),
    path('api/users/', UserListView.as_view(), name='users'),
    path('api/rooms/', RoomListView.as_view(), name='rooms'),
    path('api/messages/<str:room_name>/', RoomMessageHistoryView.as_view(), name='messages'),
]
