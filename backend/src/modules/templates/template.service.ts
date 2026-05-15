import { templateRepository } from './template.repository';

export class TemplateService {
  async saveTemplate(userId: string, name: string, content: any, description?: string, type: string = 'adaptive') {
    return templateRepository.create({
      userId,
      name,
      content,
      description,
      type
    } as any);
  }

  async listTemplates(userId: string) {
    const targetUserId = userId || 'default_tenant_user';
    
    // Step 1: Ensure system-wide prebuilt templates exist persistently in MongoDB
    let systemRecords = await templateRepository.findByUserId('system');
    const isPremiumSeeded = await templateRepository.findOne({ name: '📢 Enterprise Broadcast' });
    
    if (!isPremiumSeeded) {
      const PREBUILT_TEMPLATES = [
        {
          name: '📢 Enterprise Broadcast',
          description: 'Vibrant, high-impact card for organization-wide announcements with premium headers.',
          type: 'adaptive_card',
          content: {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "Container",
                style: "accent",
                bleed: true,
                items: [
                  {
                    type: "ColumnSet",
                    columns: [
                      {
                        type: "Column",
                        width: "stretch",
                        items: [
                          { type: "TextBlock", text: "GLOBAL BROADCAST", size: "Small", weight: "Bolder", color: "Light" },
                          { type: "TextBlock", text: "Core Operations Center", size: "ExtraLarge", weight: "Bolder", color: "Light", spacing: "None" }
                        ]
                      },
                      {
                        type: "Column",
                        width: "auto",
                        items: [{ type: "Image", url: "https://adaptivecards.io/content/cats/1.png", size: "Small", style: "Person" }]
                      }
                    ]
                  }
                ]
              },
              { type: "TextBlock", text: "Next-Gen Infrastructure Rolled Out", size: "Large", weight: "Bolder", color: "Default", spacing: "Medium" },
              { type: "TextBlock", text: "Our core messaging hub nodes have been successfully updated to maintain 99.99% broadcast SLA across all integrated Microsoft Teams channels.", wrap: true, size: "Medium" },
              { type: "FactSet", facts: [{ title: "Priority:", value: "⚡ Immediate / Executive" }, { title: "Target Audience:", value: "All Organization Hubs" }] }
            ],
            actions: [{ type: "Action.OpenUrl", title: "View Mission Telemetry", url: "https://teams.microsoft.com" }],
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
          }
        },
        {
          name: '⚠️ Mission Alert (Critical)',
          description: 'Attention-grabbing layout with full warning headers and incident summary.',
          type: 'adaptive_card',
          content: {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "Container",
                style: "attention",
                bleed: true,
                items: [{ type: "TextBlock", text: "🚨 CRITICAL SYSTEM ANOMALY", weight: "Bolder", size: "Medium", color: "Attention" }]
              },
              { type: "TextBlock", text: "Telemetry Relays Experiencing High Latency", size: "Large", weight: "Bolder", wrap: true, spacing: "Medium" },
              { type: "TextBlock", text: "Automated routing daemons are mitigating an ongoing surge in inbound webhook payloads. Action is advised if latency persists.", wrap: true, isSubtle: true },
              { type: "FactSet", facts: [{ title: "Node ID:", value: "msh-cluster-us-east" }, { title: "SLA Risk:", value: "Elevated" }] }
            ],
            actions: [{ type: "Action.Submit", title: "Acknowledge Incident", style: "destructive", data: { action: "ack_alert" } }],
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
          }
        },
        {
          name: '✅ Premium Clearance Request',
          description: 'A beautiful executive sign-off layout with success borders and binary actions.',
          type: 'adaptive_card',
          content: {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "Container",
                style: "good",
                bleed: true,
                items: [{ type: "TextBlock", text: "🔒 CLEARANCE REQUIRED", weight: "Bolder", size: "Small", color: "Good" }]
              },
              { type: "TextBlock", text: "Authorization for Multi-Tenant Gateway", size: "Large", weight: "Bolder", wrap: true, spacing: "Medium" },
              { type: "FactSet", facts: [{ title: "Requester:", value: "SecOps Service Principal" }, { title: "Permissions:", value: "Teamwork.Migrate.All" }, { title: "Risk Scope:", value: "Global Directory Tenant" }] }
            ],
            actions: [
              { type: "Action.Submit", title: "Grant Consent", style: "positive", data: { auth: "approved" } },
              { type: "Action.Submit", title: "Deny Access", style: "destructive", data: { auth: "denied" } }
            ],
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
          }
        },
        {
          name: '📊 Pulse Metric Insights',
          description: 'Sleek multi-column card presenting live operational gauges and metrics.',
          type: 'adaptive_card',
          content: {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              { type: "TextBlock", text: "NODE OPERATIONAL DASHBOARD", isSubtle: true, weight: "Bolder", size: "Small" },
              { type: "TextBlock", text: "Live Health Telemetry", weight: "Bolder", size: "ExtraLarge", color: "Accent", spacing: "None" },
              {
                type: "ColumnSet",
                spacing: "Medium",
                columns: [
                  {
                    type: "Column",
                    width: "stretch",
                    items: [{ type: "Container", style: "emphasis", items: [{ type: "TextBlock", text: "Throughput", size: "Small", isSubtle: true }, { type: "TextBlock", text: "4,210", size: "Large", weight: "Bolder", color: "Good" }] }]
                  },
                  {
                    type: "Column",
                    width: "stretch",
                    items: [{ type: "Container", style: "emphasis", items: [{ type: "TextBlock", text: "API Health", size: "Small", isSubtle: true }, { type: "TextBlock", text: "99.9%", size: "Large", weight: "Bolder", color: "Accent" }] }]
                  }
                ]
              }
            ],
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
          }
        },
        {
          name: '🗳️ Live Cadence Survey',
          description: 'Interactive choice card with sleek container forms to capture feedback.',
          type: 'adaptive_card',
          content: {
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "Container",
                style: "emphasis",
                bleed: true,
                items: [
                  { type: "TextBlock", text: "⚡ INSTANT FEEDBACK NODE", weight: "Bolder", size: "Small", color: "Accent" },
                  { type: "TextBlock", text: "Select Optimal Broadcast Cadence", size: "Large", weight: "Bolder", wrap: true }
                ]
              },
              {
                type: "Input.ChoiceSet",
                id: "cadenceVote",
                style: "expanded",
                choices: [
                  { title: "Continuous Delivery Pipeline", value: "cd_pipeline" },
                  { title: "Daily Scheduled Window", value: "daily_window" },
                  { title: "On-Demand Relay Only", value: "on_demand" }
                ],
                spacing: "Medium"
              }
            ],
            actions: [{ type: "Action.Submit", title: "Register Telemetry Preference", style: "positive" }],
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
          }
        }
      ];

      for (const t of PREBUILT_TEMPLATES) {
        await templateRepository.create({
          userId: 'system',
          name: t.name,
          content: t.content,
          description: t.description,
          type: t.type
        } as any);
      }
      systemRecords = await templateRepository.findByUserId('system');
    }

    // Step 2: Retrieve current logged-in user's custom templates
    const userRecords = targetUserId !== 'system' ? await templateRepository.findByUserId(targetUserId) : [];

    // Combine systemic defaults alongside user customizations unconditionally
    return [...(systemRecords || []), ...(userRecords || [])];
  }

  async updateTemplate(userId: string, id: string, data: any) {
    return templateRepository.update({ _id: id, userId }, data);
  }

  async deleteTemplate(userId: string, id: string) {
    return templateRepository.delete({ _id: id, userId });
  }
}

export const templateService = new TemplateService();
