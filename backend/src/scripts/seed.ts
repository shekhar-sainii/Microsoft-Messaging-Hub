/**
 * Seed Script — Populates MongoDB with realistic test data
 * Run: npx ts-node src/scripts/seed.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { SentMessageModel } from '../models/SentMessage';
import { MessageTemplateModel } from '../models/MessageTemplate';
import { AuditLogModel } from '../models/AuditLog';
import { GraphSubscriptionModel } from '../models/GraphSubscription';
import { ScheduledMessageModel } from '../models/ScheduledMessage';
import { UserModel } from '../models/User';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoft-messaging-hub';

// Get the logged-in user's microsoftId from DB (or use a placeholder)
const DEMO_USER_ID = 'AAAAAAAAAAAAAAAAAAAAABpdfz2-AASmnXG2Qt11kd0';
const DEMO_TEAM_ID = 'demo-team-001';
const DEMO_CHANNEL_ID = 'demo-ch-001';
const DEMO_TEAM_ID_2 = 'demo-team-002';
const DEMO_CHANNEL_ID_2 = 'demo-ch-004';

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Clear existing seed data ──────────────────────────────────────────────
    await SentMessageModel.deleteMany({ userId: DEMO_USER_ID });
    await MessageTemplateModel.deleteMany({ userId: DEMO_USER_ID });
    await AuditLogModel.deleteMany({ userId: DEMO_USER_ID });
    await GraphSubscriptionModel.deleteMany({ userId: DEMO_USER_ID });
    await ScheduledMessageModel.deleteMany({ userId: DEMO_USER_ID });
    console.log('🗑️  Cleared old seed data');

    // ── Sent Messages ─────────────────────────────────────────────────────────
    const now = new Date();
    const sentMessages = [];
    const contents = [
        '<p>Hello team! Please review the <strong>Q1 report</strong> before Friday.</p>',
        '<p>Reminder: <strong>Sprint planning</strong> is tomorrow at 10 AM. Please come prepared.</p>',
        '<p>The new <strong>deployment pipeline</strong> is live. Check the docs for details.</p>',
        '<p>Welcome <at id="0">John</at> to the team! 🎉</p>',
        '<p>Bug fix deployed to production. Issue #342 is now resolved.</p>',
        '<p>Weekly standup notes are in the shared drive. Please review.</p>',
        '<p>Client demo scheduled for <strong>Thursday 3 PM</strong>. Prepare your slides.</p>',
        '<p>New API documentation is available at <a href="#">docs.internal.com</a></p>',
        '<p>Code review requested for PR #89 — needs 2 approvals.</p>',
        '<p>Server maintenance window: <strong>Sunday 2-4 AM</strong>. Plan accordingly.</p>',
        '<p>Adaptive Card template updated with new branding guidelines.</p>',
        '<p>Monthly metrics report attached. Highlights: 23% growth in active users.</p>',
    ];

    for (let i = 0; i < 12; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const sentAt = new Date(now.getTime() - (daysAgo * 86400000) - (hoursAgo * 3600000));
        const isCard = i % 4 === 0;
        const isFailed = i % 7 === 0;

        sentMessages.push({
            messageId: `graph-msg-${Date.now()}-${i}`,
            teamId: i % 3 === 0 ? DEMO_TEAM_ID_2 : DEMO_TEAM_ID,
            channelId: i % 3 === 0 ? DEMO_CHANNEL_ID_2 : DEMO_CHANNEL_ID,
            userId: DEMO_USER_ID,
            content: contents[i],
            status: isFailed ? 'failed' : 'sent',
            sentAt,
            metadata: {
                subject: i % 2 === 0 ? `Update #${i + 1}` : undefined,
                importance: i % 5 === 0 ? 'high' : 'normal',
                hasMentions: i % 3 === 0,
                type: isCard ? 'adaptive_card' : 'html',
            },
        });
    }
    await SentMessageModel.insertMany(sentMessages);
    console.log(`✅ Seeded ${sentMessages.length} sent messages`);

    // ── Message Templates ─────────────────────────────────────────────────────
    const templates = [
        {
            name: 'Weekly Status Update',
            description: 'Standard weekly team status report card',
            category: 'Reports',
            userId: DEMO_USER_ID,
            content: JSON.stringify({
                type: 'AdaptiveCard',
                version: '1.4',
                body: [
                    { type: 'TextBlock', text: '📊 Weekly Status Update', size: 'Large', weight: 'Bolder', color: 'Accent' },
                    { type: 'TextBlock', text: 'Week of {{weekDate}}', isSubtle: true, spacing: 'None' },
                    { type: 'FactSet', facts: [
                        { title: 'Completed', value: '{{completed}} tasks' },
                        { title: 'In Progress', value: '{{inProgress}} tasks' },
                        { title: 'Blockers', value: '{{blockers}}' },
                    ]},
                    { type: 'TextBlock', text: '**Highlights:**', weight: 'Bolder', spacing: 'Medium' },
                    { type: 'TextBlock', text: '{{highlights}}', wrap: true },
                ],
                actions: [
                    { type: 'Action.OpenUrl', title: 'View Full Report', url: '{{reportUrl}}' },
                ],
            }),
        },
        {
            name: 'Incident Alert',
            description: 'Critical incident notification with severity levels',
            category: 'Alerts',
            userId: DEMO_USER_ID,
            content: JSON.stringify({
                type: 'AdaptiveCard',
                version: '1.4',
                body: [
                    { type: 'TextBlock', text: '🚨 Incident Alert', size: 'Large', weight: 'Bolder', color: 'Attention' },
                    { type: 'FactSet', facts: [
                        { title: 'Severity', value: '{{severity}}' },
                        { title: 'Service', value: '{{service}}' },
                        { title: 'Impact', value: '{{impact}}' },
                        { title: 'Started', value: '{{startTime}}' },
                    ]},
                    { type: 'TextBlock', text: '{{description}}', wrap: true, spacing: 'Medium' },
                ],
                actions: [
                    { type: 'Action.Submit', title: '✅ Acknowledge', data: { action: 'acknowledge' } },
                    { type: 'Action.OpenUrl', title: 'View Dashboard', url: '{{dashboardUrl}}' },
                ],
            }),
        },
        {
            name: 'Meeting Invite',
            description: 'Team meeting invitation with agenda',
            category: 'Meetings',
            userId: DEMO_USER_ID,
            content: JSON.stringify({
                type: 'AdaptiveCard',
                version: '1.4',
                body: [
                    { type: 'TextBlock', text: '📅 Meeting Invitation', size: 'Large', weight: 'Bolder' },
                    { type: 'FactSet', facts: [
                        { title: 'Title', value: '{{meetingTitle}}' },
                        { title: 'Date', value: '{{date}}' },
                        { title: 'Time', value: '{{time}}' },
                        { title: 'Location', value: '{{location}}' },
                    ]},
                    { type: 'TextBlock', text: '**Agenda:**', weight: 'Bolder', spacing: 'Medium' },
                    { type: 'TextBlock', text: '{{agenda}}', wrap: true },
                ],
                actions: [
                    { type: 'Action.Submit', title: '✅ Accept', data: { action: 'approve' } },
                    { type: 'Action.Submit', title: '❌ Decline', data: { action: 'reject' } },
                ],
            }),
        },
        {
            name: 'Deployment Notification',
            description: 'Production deployment status card',
            category: 'DevOps',
            userId: DEMO_USER_ID,
            content: JSON.stringify({
                type: 'AdaptiveCard',
                version: '1.4',
                body: [
                    { type: 'TextBlock', text: '🚀 Deployment Complete', size: 'Large', weight: 'Bolder', color: 'Good' },
                    { type: 'FactSet', facts: [
                        { title: 'Environment', value: '{{environment}}' },
                        { title: 'Version', value: '{{version}}' },
                        { title: 'Deployed by', value: '{{deployedBy}}' },
                        { title: 'Duration', value: '{{duration}}' },
                    ]},
                    { type: 'TextBlock', text: '**Changes:**', weight: 'Bolder', spacing: 'Medium' },
                    { type: 'TextBlock', text: '{{changelog}}', wrap: true },
                ],
                actions: [
                    { type: 'Action.OpenUrl', title: 'View Logs', url: '{{logsUrl}}' },
                    { type: 'Action.OpenUrl', title: 'Rollback', url: '{{rollbackUrl}}' },
                ],
            }),
        },
        {
            name: 'Approval Request',
            description: 'Request approval from team members',
            category: 'Approvals',
            userId: DEMO_USER_ID,
            content: JSON.stringify({
                type: 'AdaptiveCard',
                version: '1.4',
                body: [
                    { type: 'TextBlock', text: '✋ Approval Required', size: 'Large', weight: 'Bolder', color: 'Warning' },
                    { type: 'TextBlock', text: 'Requested by: **{{requestedBy}}**', spacing: 'Medium' },
                    { type: 'TextBlock', text: '{{requestDetails}}', wrap: true, spacing: 'Small' },
                    { type: 'Input.Text', id: 'comments', placeholder: 'Add comments (optional)', isMultiline: true },
                ],
                actions: [
                    { type: 'Action.Submit', title: '✅ Approve', data: { action: 'approve' } },
                    { type: 'Action.Submit', title: '❌ Reject', data: { action: 'reject' } },
                ],
            }),
        },
    ];
    await MessageTemplateModel.insertMany(templates);
    console.log(`✅ Seeded ${templates.length} message templates`);

    // ── Audit Logs ────────────────────────────────────────────────────────────
    const auditLogs = [];
    const events = [
        { eventType: 'message_sent', details: 'Message sent to channel General in Dev Team', status: 'success' },
        { eventType: 'message_sent', details: 'Adaptive card sent to channel Announcements', status: 'success' },
        { eventType: 'message_failed', details: 'Failed to send message: Graph API rate limit exceeded', status: 'failure' },
        { eventType: 'message_sent', details: 'Message sent to channel Campaigns in Marketing', status: 'success' },
        { eventType: 'message_reply', details: 'Replied to message in Dev Testing channel', status: 'success' },
        { eventType: 'message_sent', details: 'Weekly status card sent to General channel', status: 'success' },
        { eventType: 'message_failed', details: 'Failed to send adaptive card: Invalid card schema version 2.0', status: 'failure' },
        { eventType: 'message_sent', details: 'Deployment notification sent to Engineering team', status: 'success' },
        { eventType: 'message_deleted', details: 'Deleted message from General channel', status: 'success' },
        { eventType: 'message_sent', details: 'Incident alert sent to all channels', status: 'success' },
        { eventType: 'message_failed', details: 'Failed to send: User not authenticated with Microsoft', status: 'failure' },
        { eventType: 'message_sent', details: 'Meeting invite card sent to Marketing team', status: 'success' },
        { eventType: 'message_sent', details: 'Approval request sent to channel Backend', status: 'success' },
        { eventType: 'message_sent', details: 'Sprint planning reminder sent to Dev Team', status: 'success' },
        { eventType: 'message_failed', details: 'Failed to send: Channel not found or access denied', status: 'failure' },
    ];

    for (let i = 0; i < events.length; i++) {
        const daysAgo = Math.floor(Math.random() * 14);
        const hoursAgo = Math.floor(Math.random() * 24);
        const createdAt = new Date(now.getTime() - (daysAgo * 86400000) - (hoursAgo * 3600000));
        auditLogs.push({
            ...events[i],
            userId: DEMO_USER_ID,
            metadata: {
                teamId: i % 2 === 0 ? DEMO_TEAM_ID : DEMO_TEAM_ID_2,
                channelId: i % 2 === 0 ? DEMO_CHANNEL_ID : DEMO_CHANNEL_ID_2,
                graphId: `graph-${Date.now()}-${i}`,
            },
            createdAt,
        });
    }
    await AuditLogModel.insertMany(auditLogs);
    console.log(`✅ Seeded ${auditLogs.length} audit logs`);

    // ── Graph Subscriptions ───────────────────────────────────────────────────
    const expiry1 = new Date(now.getTime() + 45 * 60 * 1000); // 45 min from now
    const expiry2 = new Date(now.getTime() + 20 * 60 * 1000); // 20 min from now (expiring soon)
    const expiry3 = new Date(now.getTime() - 5 * 60 * 1000);  // expired 5 min ago

    const subscriptions = [
        {
            subscriptionId: `sub-demo-001-${Date.now()}`,
            resource: `/teams/${DEMO_TEAM_ID}/channels/${DEMO_CHANNEL_ID}/messages`,
            changeType: 'created,updated',
            clientState: process.env.WEBHOOK_CLIENT_STATE || 'demo-client-state',
            expirationDateTime: expiry1,
            userId: DEMO_USER_ID,
        },
        {
            subscriptionId: `sub-demo-002-${Date.now()}`,
            resource: `/teams/${DEMO_TEAM_ID_2}/channels/${DEMO_CHANNEL_ID_2}/messages`,
            changeType: 'created,updated',
            clientState: process.env.WEBHOOK_CLIENT_STATE || 'demo-client-state',
            expirationDateTime: expiry2,
            userId: DEMO_USER_ID,
        },
        {
            subscriptionId: `sub-demo-003-${Date.now()}`,
            resource: `/teams/${DEMO_TEAM_ID}/channels/demo-ch-003/messages`,
            changeType: 'created',
            clientState: process.env.WEBHOOK_CLIENT_STATE || 'demo-client-state',
            expirationDateTime: expiry3,
            userId: DEMO_USER_ID,
        },
    ];
    await GraphSubscriptionModel.insertMany(subscriptions);
    console.log(`✅ Seeded ${subscriptions.length} graph subscriptions`);

    // ── Scheduled Messages ────────────────────────────────────────────────────
    const scheduledMessages = [
        {
            userId: DEMO_USER_ID,
            teamId: DEMO_TEAM_ID,
            channelId: DEMO_CHANNEL_ID,
            content: '<p>📅 <strong>Weekly Team Standup</strong> — Please share your updates for this week.</p>',
            scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
            status: 'pending',
            recurrence: 'weekly',
            recurrenceEndDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
        {
            userId: DEMO_USER_ID,
            teamId: DEMO_TEAM_ID_2,
            channelId: DEMO_CHANNEL_ID_2,
            content: '<p>📊 Monthly marketing metrics report is ready. Please review before the meeting.</p>',
            scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
            status: 'pending',
            recurrence: 'monthly',
        },
        {
            userId: DEMO_USER_ID,
            teamId: DEMO_TEAM_ID,
            channelId: 'demo-ch-002',
            content: '<p>🚀 <strong>Sprint Review</strong> starts in 30 minutes. Join the meeting link in calendar.</p>',
            scheduledFor: new Date(now.getTime() + 30 * 60 * 1000), // 30 min from now
            status: 'pending',
            recurrence: 'none',
        },
        {
            userId: DEMO_USER_ID,
            teamId: DEMO_TEAM_ID,
            channelId: DEMO_CHANNEL_ID,
            content: '<p>Daily reminder: Update your task status in the project board.</p>',
            scheduledFor: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
            status: 'sent',
            recurrence: 'daily',
        },
        {
            userId: DEMO_USER_ID,
            teamId: DEMO_TEAM_ID_2,
            channelId: DEMO_CHANNEL_ID_2,
            content: '<p>Campaign performance report for last week. Numbers look great! 📈</p>',
            scheduledFor: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
            status: 'failed',
            error: 'Graph API rate limit exceeded. Retry after 60 seconds.',
            recurrence: 'none',
        },
    ];
    await ScheduledMessageModel.insertMany(scheduledMessages);
    console.log(`✅ Seeded ${scheduledMessages.length} scheduled messages`);

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n🎉 Seed complete! Summary:');
    console.log(`   Sent Messages:      ${sentMessages.length}`);
    console.log(`   Templates:          ${templates.length}`);
    console.log(`   Audit Logs:         ${auditLogs.length}`);
    console.log(`   Subscriptions:      ${subscriptions.length}`);
    console.log(`   Scheduled Messages: ${scheduledMessages.length}`);
    console.log(`\n   User ID used: ${DEMO_USER_ID}`);
    console.log('   All data is linked to your logged-in account.\n');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
