/**
 * @swagger
 * components:
 *   schemas:
 *
 *     # ─── Auth ──────────────────────────────────────────────────────────────
 *     MsalTokenRequest:
 *       type: object
 *       required: [idToken, accessToken]
 *       properties:
 *         idToken:
 *           type: string
 *           description: The id_token returned by MSAL.js PKCE flow
 *           example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         accessToken:
 *           type: string
 *           description: The access_token for Microsoft Graph delegated scopes
 *           example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         sessionToken:
 *           type: string
 *           description: Backend-issued JWT. Use as Bearer token on all protected routes.
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         microsoftId:
 *           type: string
 *           description: Azure AD Object ID (immutable)
 *           example: "fc7007ae-70e1-4327-8e32-50f921f7847c"
 *         displayName:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john@contoso.com"
 *         tenantId:
 *           type: string
 *           example: "72f988bf-86f1-41af-91ab-2d7cd011db47"
 *         role:
 *           type: string
 *           enum: [admin, manager, member]
 *           example: "member"
 *
 *     # ─── Teams ─────────────────────────────────────────────────────────────
 *     Team:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "19:abc123..."
 *         displayName:
 *           type: string
 *           example: "Engineering Team"
 *         description:
 *           type: string
 *         webUrl:
 *           type: string
 *
 *     Channel:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "19:abc123..."
 *         displayName:
 *           type: string
 *           example: "general"
 *         membershipType:
 *           type: string
 *           enum: [standard, private, shared]
 *
 *     # ─── Messages ──────────────────────────────────────────────────────────
 *     SendMessageRequest:
 *       type: object
 *       required: [teamId, channelId, content]
 *       properties:
 *         teamId:
 *           type: string
 *           example: "19:abc123..."
 *         channelId:
 *           type: string
 *           example: "19:def456..."
 *         content:
 *           type: string
 *           description: HTML message body (Graph contentType html)
 *           example: "<p>Hello <at id=\"0\">John</at>!</p>"
 *         mentions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Mention'
 *         isAdaptiveCard:
 *           type: boolean
 *           default: false
 *         cardJson:
 *           type: object
 *           description: Adaptive Card JSON payload (schema <= 1.4). Required when isAdaptiveCard=true.
 *
 *     Mention:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         mentionText:
 *           type: string
 *         mentioned:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 displayName:
 *                   type: string
 *
 *     SentMessage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         messageId:
 *           type: string
 *           description: Graph message ID returned by Microsoft Graph after successful POST
 *         teamId:
 *           type: string
 *         channelId:
 *           type: string
 *         userId:
 *           type: string
 *         content:
 *           type: string
 *         sentAt:
 *           type: string
 *           format: date-time
 *
 *     # ─── Scheduler ─────────────────────────────────────────────────────────
 *     ScheduleMessageRequest:
 *       type: object
 *       required: [teamId, channelId, content, scheduledAt]
 *       properties:
 *         teamId:
 *           type: string
 *         channelId:
 *           type: string
 *         content:
 *           type: string
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: UTC ISO-8601 timestamp
 *           example: "2026-05-10T09:00:00Z"
 *         timezone:
 *           type: string
 *           description: IANA timezone identifier
 *           example: "Asia/Kolkata"
 *         recurrence:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [none, daily, weekly, monthly]
 *             until:
 *               type: string
 *               format: date-time
 *
 *     # ─── Templates ─────────────────────────────────────────────────────────
 *     MessageTemplate:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: "Weekly Announcement"
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           example: "Announcement"
 *         bodyHtml:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         variables:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               required:
 *                 type: boolean
 *
 *     # ─── Shared ────────────────────────────────────────────────────────────
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Unauthorized: Invalid or expired session token"
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 */

// This file is intentionally empty of runtime code.
// It only exists to house shared OpenAPI schema definitions.
export {};
