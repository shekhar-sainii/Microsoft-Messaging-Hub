# Step 2: Backend Core Services

This phase involves building the service layer that communicates with MongoDB, Redis, and the Microsoft Graph API.

## 2.1 Database Models
Define Mongoose schemas for:
- **User**: Store user profile and basic settings.
- **ScheduledMessage**: Store metadata for messages to be sent in the future.
- **GraphSubscription**: Track webhook subscriptions and their expiry dates.
- **AuditLog**: Record all message sending activities.

## 2.2 Graph API Client Utility
Create a robust `GraphClient` service to handle all external requests:
- **Middleware**: Intercept 429 (Too Many Requests) errors and parse the `Retry-After` header.
- **Circuit Breaker**: Prevent overloading Graph API if multiple failures occur.
- **Batching**: Use the `$batch` endpoint to combine multiple requests (e.g., fetching team members for @mentions).

## 2.3 Redis & Caching
- Use Redis to cache:
  - Access tokens (with TTL matching the token expiry).
  - Teams and Channel lists to reduce Graph API latency.
  - User session data.

## 2.4 BullMQ for Scheduling
Set up BullMQ workers and queues:
- **Queue**: `message-scheduler`.
- **Worker**: Processes delayed jobs, acquires a Client Credentials token, and posts the message to Graph API.
- **Persistence**: Update the `ScheduledMessage` status in MongoDB upon success or failure.

## 2.5 API Route Structure
- `/api/teams`: Fetch and list joined teams.
- `/api/channels`: List channels for a specific team.
- `/api/messages`: Send, schedule, and list message history.
- `/api/subscriptions`: Manage webhook subscriptions.
