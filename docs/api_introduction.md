# SoundCloud API Introduction

The SoundCloud API is built with REST principles, exposing resources like tracks, sets and users which can be accessed and manipulated using HTTP methods GET, POST, PUT and DELETE.

## Getting Started

1. Register an app to get your `client_id`
2. Use the `client_id` for public API calls

## Basic Request Example

```bash
curl "https://api.soundcloud.com/tracks?client_id=YOUR_CLIENT_ID&limit=10"
```

## Resource Structure

- List of resources: `/[resource_name]`
- Single resource: `/[resource_name]/[id]`
- Related subresources: `/[resource_name]/[id]/[subresource_name]`

## Authentication

All requests require either:
- `client_id` parameter for public resources
- OAuth access token for user-specific actions

## Response Format

Responses are JSON arrays or objects containing resource attributes like:
- `title`
- `duration`
- `permalink_url`
- `stream_url` (for playable tracks)
- `access` (playable/preview/blocked) 