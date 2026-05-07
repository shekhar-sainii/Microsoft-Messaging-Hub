# Step 1: Environment & Authentication Setup

This phase focuses on setting up the core infrastructure and authentication flows required for Microsoft Graph integration.

## 1.1 Azure AD Configuration
You must register an application in the Azure Portal to interact with the Graph API.

1.  **Register App**: Go to Azure Portal > Microsoft Entra ID > App registrations > New registration.
2.  **Redirect URIs**:
    - SPA: `http://localhost:5173` (Vite default).
    - Web: `http://localhost:3000/api/auth/callback`.
3.  **Permissions (Delegated)**:
    - `User.Read`
    - `Team.ReadBasic.All`
    - `Channel.ReadBasic.All`
    - `Chat.ReadWrite`
    - `ChatMessage.Send`
4.  **Permissions (Application)**:
    - `ChatMessage.Read.All` (Required for webhooks).
5.  **Client Secret**: Create a new secret and save it securely.

## 1.2 RSA Key Generation
Encrypted notifications require a 2048-bit RSA key pair.
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```
The public key will be uploaded to the Graph subscription.

## 1.3 Project Initialization
Initialize the monorepo structure:
```bash
mkdir microsoft-messaging-hub
cd microsoft-messaging-hub
mkdir backend frontend
```

### Backend Setup
- Initialize Node.js with TypeScript.
- Install dependencies: `express`, `mongoose`, `redis`, `bullmq`, `socket.io`, `@azure/msal-node`, `dotenv`, `cors`, `helmet`.

### Frontend Setup
- Initialize Vite with React and TypeScript.
- Install dependencies: `@azure/msal-react`, `@azure/msal-browser`, `@tanstack/react-query`, `axios`, `tailwindcss`, `lucide-react`, `framer-motion`.

## 1.4 MSAL Implementation
- **Backend**: Create a `MsalService` to handle the **On-Behalf-Of (OBO)** flow. This allows the backend to call Graph API using the user's identity.
- **Frontend**: Configure the `PublicClientApplication` and wrap the app in `MsalProvider`.
