/**
 * Adaptive Cards Utility
 * Provides helpers for validating and manipulating Adaptive Card schemas.
 */
export class AdaptiveCardUtils {
    /**
     * Basic validation of an Adaptive Card JSON.
     * Enforces version ≤ 1.4 (Graph API limit).
     */
    static validateSchema(cardJson: any): { valid: boolean; error?: string } {
        if (!cardJson) return { valid: false, error: 'Empty card JSON' };

        if (cardJson.type !== 'AdaptiveCard') {
            return { valid: false, error: 'Missing root type: AdaptiveCard' };
        }

        if (!cardJson.version) {
            return { valid: false, error: 'Missing version' };
        }

        // Graph API only supports Adaptive Cards up to version 1.4
        if (parseFloat(cardJson.version) > 1.4) {
            return {
                valid: false,
                error: `Adaptive Card version ${cardJson.version} is not supported by Graph API. Maximum supported version is 1.4.`,
            };
        }

        if (!Array.isArray(cardJson.body)) {
            return { valid: false, error: 'Body must be an array' };
        }

        return { valid: true };
    }

    /**
     * Wraps content into a standard Adaptive Card envelope
     */
    static wrapInEnvelope(elements: any[]): any {
        return {
            type: "AdaptiveCard",
            version: "1.5",
            body: elements,
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
        };
    }
}
