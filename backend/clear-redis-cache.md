# Clear Redis Cache - Fix Deserialization Error

## Problem
You're seeing this error:
```
Cannot deserialize
```

This happens because Redis cache contains data serialized with the old format that can't be read by the new serializer.

## Solution

### Option 1: Restart Backend (Recommended)
The cache will be automatically cleared on startup.

1. **Stop the backend** (Ctrl+C in terminal)
2. **Restart the backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

The cache will be automatically cleared on startup.

### Option 2: Clear Redis Cache Manually

**Using Redis CLI:**
```bash
# Connect to Redis
redis-cli

# Clear all cache
FLUSHALL

# Or clear only menu cache
DEL menu::all

# Exit
exit
```

**Using Docker (if Redis is in Docker):**
```bash
docker exec -it <redis-container-name> redis-cli FLUSHALL
```

**Using PowerShell (Windows):**
```powershell
# If Redis is installed locally
redis-cli FLUSHALL
```

### Option 3: Clear Cache via API (if admin endpoint exists)

You can also wait for the cache to expire (1 hour TTL) or restart the backend.

## After Clearing Cache

1. ✅ Restart backend
2. ✅ Cache will be automatically cleared on startup
3. ✅ Menu endpoint should work without errors

## Prevention

The cache is now configured with:
- ✅ Proper JSON serialization (`GenericJackson2JsonRedisSerializer`)
- ✅ 1-hour TTL (cache expires automatically)
- ✅ Automatic cache clear on startup

This error should not occur again after clearing the cache once.





