# Step 6: Testing, DevOps & Deployment

Finalizing the project for production readiness and ensuring high code quality.

## 6.1 Testing Strategy
- **Unit Tests**: Test core logic (OBO flow, message formatting, HMAC validation) using Jest.
- **Integration Tests**: Use **Mock Service Worker (MSW)** to intercept and mock Microsoft Graph API responses for testing the backend services.
- **Frontend Tests**: Use React Testing Library to verify the TipTap editor output and MSAL login interactions.
- **E2E Tests**: Implement Playwright tests for the full "Login -> Compose -> Send" flow.

## 6.2 Dockerization
Create a `docker-compose.yml` that orchestrates:
- **Backend Service**: Node.js app with environment variables.
- **Frontend Service**: Nginx serving the Vite build.
- **MongoDB**: Primary database.
- **Redis**: For BullMQ and caching.
- **Ngrok (Optional)**: A containerized ngrok service to expose the webhook endpoint during development.

## 6.3 CI/CD Pipeline (GitHub Actions)
1.  **Lint**: Run ESLint on every push.
2.  **Test**: Run the test suite (Jest + Vitest).
3.  **Build**: Create Docker images for backend and frontend.
4.  **Push**: Push images to a registry (e.g., GHCR or Docker Hub).

## 6.4 Documentation
- **README.md**: Comprehensive guide with Azure AD setup screenshots.
- **API Docs**: Exported Postman/Bruno collection.
- **Ngrok Setup**: Instructions on how to point Graph subscriptions to the local dev tunnel.
