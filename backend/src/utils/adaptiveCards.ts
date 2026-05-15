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

        if (parseFloat(cardJson.version) > 1.4) {
            return {
                valid: false,
                error: `Adaptive Card version ${cardJson.version} is not supported. Maximum supported version is 1.4.`,
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
            version: "1.4",
            body: elements,
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
        };
    }

    /**
     * Injects MS Teams specific metadata into Action.Submit to ensure
     * interactions are supported and routed correctly.
     * Prevents "That action isn't supported here" errors.
     */
    static prepareForTeams(card: any, botId?: string): any {
        if (!card) return card;
        const processed = JSON.parse(JSON.stringify(card)); // Deep clone

        const processActions = (actions: any[]) => {
            if (!Array.isArray(actions)) return;
            actions.forEach(action => {
                if (action.type === 'Action.Submit') {
                    // Inject msteams property to support messageBack logic
                    // This allows Teams to treat the submission as a bot-interactable event
                    // Crucial: botId must be present for Graph-sent cards to route back correctly
                    action.data = {
                        ...action.data,
                        msteams: {
                            type: "messageBack",
                            text: action.title || "submit",
                            ...(botId ? { botId } : {})
                        }
                    };
                }
            });
        };

        // Process top-level actions
        processActions(processed.actions);

        // Recursively find actions in the body (e.g. ActionSets)
        const findAndProcessActionSets = (items: any[]) => {
            if (!Array.isArray(items)) return;
            items.forEach(item => {
                if (item.type === 'ActionSet') {
                    processActions(item.actions);
                } else if (item.body || item.items || item.columns) {
                    findAndProcessActionSets(item.body || item.items || item.columns);
                } else if (Array.isArray(item)) {
                    findAndProcessActionSets(item);
                }
            });
        };

        findAndProcessActionSets(processed.body);

        return processed;
    }
}
