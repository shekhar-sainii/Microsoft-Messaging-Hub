import { AdaptiveCardUtils } from './adaptiveCards';

describe('AdaptiveCardUtils', () => {
    describe('validateSchema', () => {
        it('should return valid for a correct v1.4 card', () => {
            const card = {
                type: 'AdaptiveCard',
                version: '1.4',
                body: [{ type: 'TextBlock', text: 'Hello' }],
            };
            const result = AdaptiveCardUtils.validateSchema(card);
            expect(result.valid).toBe(true);
        });

        it('should reject null/undefined card', () => {
            expect(AdaptiveCardUtils.validateSchema(null).valid).toBe(false);
            expect(AdaptiveCardUtils.validateSchema(undefined).valid).toBe(false);
        });

        it('should reject card without type: AdaptiveCard', () => {
            const card = { type: 'NotACard', version: '1.4', body: [] };
            const result = AdaptiveCardUtils.validateSchema(card);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('AdaptiveCard');
        });

        it('should reject card without version', () => {
            const card = { type: 'AdaptiveCard', body: [] };
            const result = AdaptiveCardUtils.validateSchema(card);
            expect(result.valid).toBe(false);
        });

        it('should reject card with version > 1.4 (Graph API limit)', () => {
            const card = { type: 'AdaptiveCard', version: '1.5', body: [] };
            const result = AdaptiveCardUtils.validateSchema(card);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('1.4');
        });

        it('should reject card with non-array body', () => {
            const card = { type: 'AdaptiveCard', version: '1.4', body: 'not-array' };
            const result = AdaptiveCardUtils.validateSchema(card);
            expect(result.valid).toBe(false);
        });
    });

    describe('wrapInEnvelope', () => {
        it('should wrap elements in a valid AdaptiveCard envelope', () => {
            const elements = [{ type: 'TextBlock', text: 'Test' }];
            const card = AdaptiveCardUtils.wrapInEnvelope(elements);

            expect(card.type).toBe('AdaptiveCard');
            expect(card.version).toBe('1.5');
            expect(card.body).toEqual(elements);
            expect(card.$schema).toBeDefined();
        });
    });
});
