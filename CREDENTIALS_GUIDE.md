# 🔐 Microsoft Azure App Registration & Credentials Guide

Is guide mein hum seekhenge ki kaise aap apne Microsoft Messaging Hub ke liye naye credentials le sakte hain aur Azure Portal par App ko sahi se configure kar sakte hain.

## 🚀 Step 1: Azure Portal par jaana
Sabse pehle niche diye gaye link par jayein aur apne Microsoft Admin account se login karein:
👉 **[Azure Portal (Entra ID / App Registrations)](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)**

---

## 📝 Step 2: Naya App Register karna
1.  **New Registration** par click karein.
2.  **Name**: Kuch bhi rakhein (e.g., `MessagingHub-Prod`).
3.  **Supported Account Types**: "Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant)" choose karein.
4.  **Redirect URI**:
    *   Select Platform: **Single-page application (SPA)**.
    *   URI: `http://localhost/` (Ya aapka production URL).
5.  **Register** par click karein.

---

## 🔑 Step 3: IDs aur Secrets lena
Ab aapko "Overview" page dikhega. Wahan se niche wali cheezein copy karein:
*   **Application (client) ID**: (Ise `.env` mein `VITE_AZURE_CLIENT_ID` aur `GRAPH_CLIENT_ID` mein dalein).
*   **Directory (tenant) ID**: (Ise `common` rakhein ya apna Specific ID dalein).

**Client Secret banana:**
1.  Left menu mein **Certificates & secrets** par jayein.
2.  **New client secret** par click karein.
3.  Description dalein aur "Add" karein.
4.  **Value** copy karein (Ise `.env` mein `GRAPH_CLIENT_SECRET` mein dalein). 
    > ⚠️ *Dhyan rahe, Secret ki 'Value' copy karni hai, 'Secret ID' nahi.*

---

## 🛡️ Step 4: API Permissions (Sabse Zaroori)
Dashboard smoothly chalne ke liye ye permissions zaroori hain:
1.  Left menu mein **API permissions** par jayein.
2.  **Add a permission** -> **Microsoft Graph**.
3.  **Delegated Permissions** mein ye select karein:
    *   `User.Read`
    *   `Team.ReadBasic.All`
    *   `Channel.ReadBasic.All`
    *   `ChannelMessage.Send`
    *   `offline_access`
4.  **Application Permissions** mein ye select karein (Webhooks ke liye):
    *   `Team.ReadBasic.All`
    *   `ChannelMessage.Read.All`
5.  **Grant admin consent for [Your Org Name]** par click zaroor karein.

---

## ⚙️ Step 5: Webhook Configuration
Agar aapne **Graph Webhooks** use karne hain, toh **Authentication** tab mein jaakar:
*   "Allow public client flows" ko **Yes** karein (Agar mobile/desktop app use kar rahe hon).
*   Ensure karein ki aapne **Secret** backend `.env` mein sahi dala hai.

---

## 🛠️ Step 6: Code update aur Rebuild
Jab aapke paas naye IDs aa jayein, toh:

1.  **Root `.env` file** update karein:
    ```env
    VITE_AZURE_CLIENT_ID=aapka_naya_client_id
    VITE_AZURE_TENANT_ID=common
    GRAPH_CLIENT_ID=aapka_naya_client_id
    GRAPH_CLIENT_SECRET=aapka_naya_secret_value
    ```

2.  **Docker Rebuild** karein:
    ```bash
    docker compose up --build -d
    ```

---

## 🏗️ Step 7: Dummy Data se Real Data par jaana (Teams & Channels)
Abhi dashboard par aapko dummy data dikh raha hoga. Real data dekhne ke liye aapko Microsoft Teams mein asli Teams aur Channels banane honge:

1.  **Teams App kholein**: [teams.microsoft.com](https://teams.microsoft.com) par jayein ya Desktop App kholein.
2.  **Same Account use karein**: Wahi account use karein jise aapne App Registration ke liye use kiya hai (e.g., `admin@yourorg.onmicrosoft.com`).
3.  **Create a Team**:
    *   Niche "Join or create a team" par click karein.
    *   "Create team" -> "From scratch" -> "Public" ya "Private" select karein.
    *   Team ka naam rakhein (e.g., `Sales Department`).
4.  **Add a Channel**:
    *   Apne Team ke naam ke paas teen dots (`...`) par click karein.
    *   "Add channel" par click karein.
    *   Naam rakhein (e.g., `Daily Updates`).
5.  **App par wapis aayein**:
    *   Dashboard par refresh karein.
    *   Ab aapko "Select Team" dropdown mein aapki banayi hui real Team dikhegi.
    *   Teams se real data aane lagega!

---

✅ **Done!** Aapka app naye credentials aur real Teams data ke saath ready hai.
