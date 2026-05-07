# Step 3: Webhooks & Real-time Notifications

Implementing secure, real-time updates from Microsoft Teams to our application.

## 3.1 Webhook Subscription Management
- **Creation**: Register a subscription for `teams/channels/messages` using the Graph API.
- **Renewal**: Create a background cron job that checks for subscriptions expiring within 5 minutes and renews them automatically.
- **RSA Integration**: Provide the public key in the subscription request to receive encrypted notification payloads.

## 3.2 Webhook Endpoint (`/webhook/graph`)
- **Handshake**: Handle the initial validation request by returning the `validationToken` as plain text.
- **HMAC Verification**: Validate the `clientState` or HMAC signature to ensure the request is truly from Microsoft.
- **Decryption**: Use the private RSA key to decrypt the notification data (resource ID, encrypted content).
- **Processing**: Emit events to the relevant Socket.IO room (e.g., `channel_{id}`) when a new reply is detected in Teams.

## 3.3 Socket.IO Integration
- **Connection**: Authenticate socket connections using the same JWT/MSAL token used for the API.
- **Rooms**: Allow users to join "rooms" based on the channel they are currently viewing.
- **Live Updates**:
  - `message:new`: Update the chat feed when a reply is posted in Teams.
  - `job:status`: Update the UI when a scheduled message is successfully sent or failed.
  - `subscription:expiring`: Show a warning in the admin panel if a subscription renewal fails.
