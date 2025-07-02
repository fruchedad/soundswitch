# API Guide

With SoundCloud API you can build applications that take music to the next level. With this guide we explain and provide code examples for a lot of common integration use cases like playing and uploading tracks, liking a playlist or discovering new music.

## Authentication

### Authorization Code Flow

1. Redirect User to Authorization URL:
```
https://secure.soundcloud.com/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &response_type=code
  &code_challenge=CODE_CHALLENGE
  &code_challenge_method=S256
  &state=STATE
```

2. Obtain Access Token:
```bash
curl -X POST "https://secure.soundcloud.com/oauth/token" \
  -H "accept: application/json; charset=utf-8" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "client_id=YOUR_CLIENT_ID" \
  --data-urlencode "client_secret=YOUR_CLIENT_SECRET" \
  --data-urlencode "redirect_uri=YOUR_REDIRECT_URI" \
  --data-urlencode "code_verifier=YOUR_PKCE_GENERATED_CODE_VERIFIER" \
  --data-urlencode "code=YOUR_CODE"
```

### Client Credentials Flow

```bash
curl -X POST "https://secure.soundcloud.com/oauth/token" \
  -H "accept: application/json; charset=utf-8" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic Base64(client_id:client_secret)" \
  --data-urlencode "grant_type=client_credentials"
```

### Accessing Resources

All requests require an Authorization header:
```
-H "Authorization: OAuth ACCESS_TOKEN"
```

### Getting Authenticated User Info

```bash
curl "https://api.soundcloud.com/me" \
  -H "accept: application/json; charset=utf-8" \
  -H "Authorization: OAuth ACCESS_TOKEN"
```

## Playing Tracks

### Streaming Tracks

1. Request track info:
```bash
curl -X GET "https://api.soundcloud.com/tracks/TRACK_ID" \
  -H "accept: application/json; charset=utf-8" \
  -H "Authorization: OAuth ACCESS_TOKEN"
```

2. Get stream URL:
```bash
curl -X GET "https://api.soundcloud.com/tracks/TRACK_ID/stream" \
  -H "accept: application/json; charset=utf-8" \
  -H "Authorization: OAuth ACCESS_TOKEN"
```

### Track Access Levels

- `playable` - track is fully streamable
- `preview` - track preview is available
- `blocked` - track is not streamable, only metadata

## Search

```bash
curl -X GET "https://api.soundcloud.com/tracks?q=hello&access=playable&limit=10" \
  -H "accept: application/json; charset=utf-8" \
  -H "Authorization: OAuth ACCESS_TOKEN"
```

## Users

### Get User Info

```bash
curl -X GET "https://api.soundcloud.com/users/USER_ID" \
  -H "accept: application/json; charset=utf-8" \
  -H "Authorization: OAuth ACCESS_TOKEN"
```

### Get User's Tracks

```bash
curl -X GET "https://api.soundcloud.com/users/USER_ID/tracks" \
  -H "accept: application/json; charset=utf-8" \
  -H "Authorization: OAuth ACCESS_TOKEN"
```

### Get User's Followers

```bash
curl -X GET "https://api.soundcloud.com/users/USER_ID/followers" \
  -H "accept: application/json; charset=utf-8" \
  -H "Authorization: OAuth ACCESS_TOKEN"
```

## Error Handling

- 400 Bad Request - Programming error
- 401 Unauthorized - Missing/invalid auth
- 403 Forbidden - No access
- 404 Not Found - Resource doesn't exist
- 429 Too Many Requests - Rate limited
- 500 Internal Server Error - Server issue 