import os
import redis

redis_url = os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/0')
print("Testing connection to:", redis_url)
try:
    r = redis.Redis.from_url(redis_url)
    print("Ping result:", r.ping())
except Exception as e:
    print("Failed connecting to Redis:", e)
