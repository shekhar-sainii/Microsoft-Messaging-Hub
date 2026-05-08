/**
 * @swagger
 * components:
 *   schemas:
 *     MsalTokenRequest:
 *       type: object
 *       required: [idToken, accessToken]
 *       properties:
 *         idToken: { type: string }
 *         accessToken: { type: string }
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             displayName: { type: string }
 *             email: { type: string }
 *             microsoftId: { type: string }
 *             role: { type: string }
 */

/**
 * @swagger
 * /auth/msal-token:
 *   post:
 *     summary: Exchange MSAL token for backend JWT session
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MsalTokenRequest' }
 *     responses:
 *       200:
 *         description: Success, session cookie set
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User profile
 *
 * /auth/logout:
 *   post:
 *     summary: Invalidate current session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 *
 * /auth/admin-consent:
 *   get:
 *     summary: Trigger MS Graph Admin Consent Flow
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema: { type: string }
 *         description: Specific tenant to authorize (optional)
 *     responses:
 *       302:
 *         description: Redirect to Microsoft Login
 */
