# 🏆 Bonus Challenges Testing Guide

This guide provides specific steps to verify and demonstrate the completed bonus challenges.

---

### 1. 🏢 Multi-tenant Onboarding (+5 Marks)
*App works for any M365 tenant and triggers admin consent for new organizations.*

**How to Test:**
1.  **Preparation**: Ensure your Azure App Registration is set to **"Accounts in any organizational directory (Any Azure AD directory - Multitenant)"**.
2.  **Action**: Log in with a user from a **different M365 tenant** (not your own).
3.  **Step**: Navigate to the **Admin Panel > Command Center**.
4.  **Interaction**: Click the **"Grant Organization Access"** button.
5.  **Result**: This triggers the Microsoft Admin Consent flow (`prompt=admin_consent`). Once accepted, the new `tenantId` is registered in our database.
6.  **Verify**: The app now functions for this new tenant, allowing them to browse their own Teams and Channels.

---

### 2. 🤖 Outgoing Webhook / Bot Integration (+4 Marks)
*Responds to user commands typed directly in Teams via a secure webhook.*

**How to Test:**
1.  **Setup**: In Microsoft Teams, go to "Manage Team" > "Apps" > "Create an Outgoing Webhook".
2.  **Config**: 
    - **Name**: `Hub`
    - **Callback URL**: `https://your-public-url.ngrok.app/api/bot/command`
3.  **Action**: In any channel, type `@Hub status`.
4.  **Verification**: The bot responds with a real-time health report:
    - 🟢 MongoDB: Connected
    - 🟢 Redis: Operational
    - 🔒 Security: HMAC Signature Validated
5.  **Proof of Security**: The backend validates the `x-microsoft-signature` using the security token provided by Teams. If the signature is missing or incorrect, the request is rejected with a 401.

---

### 3. 🖱️ Adaptive Cards Action.Submit Handling (+4 Marks)
*Receives and processes button-click data from Adaptive Cards.*

**How to Test:**
1.  **Action**: Open **Templates** and dispatch the "Approval Request" card to a Teams channel.
2.  **Interaction**: In Teams, click the **"Approve"** button on the card.
3.  **Bot Response**: The bot automatically replies: *"Interaction received: Approve. Processing request..."*
4.  **Verification**: Check backend logs to see the `Action.Submit` payload being processed by `BotController.handleCardAction`.

---

### 4. 📁 OneDrive File Picker Integration (+3 Marks)
*Integrates Microsoft File Picker SDK for direct OneDrive attachments.*

**How to Test:**
1.  **Action**: In **Message Composer**, click **"Attach from OneDrive"** (the dark icon).
2.  **Step**: Select a file from the Microsoft popup.
3.  **Result**: Filename and size appear as a rich document card in the composer.
4.  **Verify**: Send the message and verify the styled link appears in the Teams channel.

---

### 🎭 Playwright End-to-End Tests (+4 Marks)
*Automated flow: Login -> Compose -> Send -> History Verification.*

**How to Test:**
1.  **Run**: `npx playwright test`
2.  **Validation**: The test `messaging.spec.ts` will automate the full browser flow and verify the "Success" toast and history logs.

---

### 👤 Dynamic User Management (Final Polish)
*Admin promotion system with safety safeguards.*

**How to Test:**
1.  **Action**: In **Admin Panel > Users**, try to demote the **last admin**.
2.  **Result**: A pop-up appears, but the backend blocks the action with: *"Action Blocked: You cannot demote the last administrator."*
3.  **Proof**: This confirms the database-driven RBAC system is secure and fail-safe.
