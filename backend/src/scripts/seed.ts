import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import SentMessage from '../models/SentMessage';
import ScheduledMessage from '../models/ScheduledMessage';
import MessageTemplate from '../models/MessageTemplate';
import { AuditLogModel } from '../models/AuditLog';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoft-messaging-hub';
const TEST_USER_ID = '3433bb31-4559-4994-bba4-acfe9578fbb8'; // User's ID from curl

async function seed() {
  try {
    console.log('🚀 Starting Database Seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Ensure User exists
    let user = await User.findOne({ microsoftId: TEST_USER_ID });
    if (!user) {
      user = await User.create({
        microsoftId: TEST_USER_ID,
        displayName: 'Shekhar Saini',
        email: 'she@example.com',
        tenantId: '150430f7-ce13-4d03-b090-b8edf08ac930',
        role: 'admin',
        avatarUrl: 'https://ui-avatars.com/api/?name=Shekhar+Saini&background=0D8ABC&color=fff'
      });
      console.log('👤 Created Test User');
    }

    // 2. Clear existing dummy data
    await SentMessage.deleteMany({ userId: TEST_USER_ID });
    await ScheduledMessage.deleteMany({ userId: TEST_USER_ID });
    await MessageTemplate.deleteMany({ userId: TEST_USER_ID });

    // 3. Seed Sent Messages (History)
    const sentMessages = [
      {
        userId: TEST_USER_ID,
        teamId: 'demo-team-001',
        channelId: 'demo-ch-001',
        content: '<p>Hello Team! This is a <strong>test message</strong> sent from the hub.</p>',
        status: 'sent',
        messageId: 'graph-msg-101',
        sentAt: new Date(Date.now() - 3600000)
      },
      {
        userId: TEST_USER_ID,
        teamId: 'demo-team-001',
        channelId: 'demo-ch-002',
        content: 'System status update: All services operational.',
        status: 'sent',
        messageId: 'graph-msg-102',
        sentAt: new Date(Date.now() - 7200000)
      },
      {
        userId: TEST_USER_ID,
        teamId: 'demo-team-002',
        channelId: 'demo-ch-102',
        status: 'sent',
        messageId: 'graph-msg-103',
        metadata: {
          type: 'adaptive_card',
          cardJson: JSON.stringify({
            type: 'AdaptiveCard',
            version: '1.4',
            body: [{ type: 'TextBlock', text: 'Quarterly Marketing Report', weight: 'Bolder', size: 'Medium' }]
          })
        },
        sentAt: new Date(Date.now() - 86400000)
      }
    ];
    await SentMessage.insertMany(sentMessages);
    console.log('✉️ Seeded Sent Messages History');

    // 4. Seed Scheduled Messages
    const scheduledMessages = [
      {
        userId: TEST_USER_ID,
        teamId: 'demo-team-001',
        channelId: 'demo-ch-001',
        content: 'Auto-scheduled standup reminder.',
        scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
        status: 'pending',
        recurrence: 'none'
      },
      {
        userId: TEST_USER_ID,
        teamId: 'demo-team-002',
        channelId: 'demo-ch-101',
        content: 'Weekly newsletter blast.',
        scheduledFor: new Date(Date.now() + 172800000), // Day after tomorrow
        status: 'pending',
        recurrence: 'weekly'
      }
    ];
    await ScheduledMessage.insertMany(scheduledMessages);
    console.log('⏰ Seeded Scheduled Messages');

    // 5. Seed Templates
    const templates = [
      {
        name: 'Urgent System Alert',
        description: 'Used for critical system failures',
        content: '<p style="color: red;"><strong>🚨 CRITICAL ALERT:</strong> {{service}} is currently down.</p>',
        type: 'html',
        userId: TEST_USER_ID
      },
      {
        name: 'Welcome Template',
        description: 'Greeting new team members',
        content: '<p>Welcome to the team, <strong>{{name}}</strong>! We are glad to have you here.</p>',
        type: 'html',
        userId: TEST_USER_ID
      }
    ];
    await MessageTemplate.insertMany(templates);
    console.log('📑 Seeded Message Templates');

    // 6. Seed Audit Logs
    const auditLogs = [
      {
        userId: TEST_USER_ID,
        eventType: 'MESSAGE_SEND',
        details: 'Sent message to General channel',
        status: 'success'
      },
      {
        userId: TEST_USER_ID,
        eventType: 'TEMPLATE_CREATE',
        details: 'Created "Urgent System Alert" template',
        status: 'success'
      }
    ];
    await AuditLogModel.insertMany(auditLogs);
    console.log('📜 Seeded Audit Logs');

    console.log('✨ Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
}

seed();
