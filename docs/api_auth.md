# SoundCloud API Authentication

SoundCloud uses OAuth 2.1 for authentication. PKCE is required for secure code exchange.

## Authorization Flows

### 1. Authorization Code Flow (User Resources)
- Access user's private data
- Upload tracks, create playlists
- Act on user's behalf

### 2. Client Credentials Flow (Public Resources Only)
- Search tracks/playlists
- Playback public content
- URL resolution

## Authorization Code Flow Steps

1. **Redirect to Authorization URL:**
```
https://secure.soundcloud.com/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &response_type=code
  &code_challenge=CODE_CHALLENGE
  &code_challenge_method=S256
  &state=STATE
```

2. **User authorizes in SoundCloud Connect screen**

3. **Exchange code for token:**
```bash
curl -X POST "https://secure.soundcloud.com/oauth/token" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "client_id=YOUR_CLIENT_ID" \
  --data-urlencode "client_secret=YOUR_CLIENT_SECRET" \
  --data-urlencode "code=YOUR_CODE"
```

## Token Usage

Include in all API requests:
```
Authorization: OAuth ACCESS_TOKEN
```

## Token Refresh

Tokens expire after ~1 hour. Refresh using:
```bash
curl -X POST "https://secure.soundcloud.com/oauth/token" \
  --data-urlencode "grant_type=refresh_token" \
  --data-urlencode "refresh_token=YOUR_REFRESH_TOKEN"
``` 