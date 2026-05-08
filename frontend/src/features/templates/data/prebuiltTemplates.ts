export const PREBUILT_TEMPLATES = [
  {
    _id: 'pb-1',
    name: '📢 Announcement',
    description: 'A stylish card for organization-wide announcements with a header image.',
    type: 'adaptive_card',
    content: {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "Image",
          url: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800",
          size: "stretch",
          aspectRatio: "16:9"
        },
        {
          type: "TextBlock",
          text: "Important Announcement",
          weight: "Bolder",
          size: "ExtraLarge",
          wrap: true
        },
        {
          type: "TextBlock",
          text: "We are excited to share some major updates regarding our upcoming project phase. Please review the details below.",
          wrap: true
        }
      ]
    },
    createdAt: new Date().toISOString()
  },
  {
    _id: 'pb-2',
    name: '⚠️ Critical Alert',
    description: 'Red-themed card for urgent system alerts or incident reports.',
    type: 'adaptive_card',
    content: {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "Container",
          style: "attention",
          items: [
            {
              type: "TextBlock",
              text: "SYSTEM ALERT: CRITICAL",
              weight: "Bolder",
              color: "Attention"
            }
          ]
        },
        {
          type: "TextBlock",
          text: "Service Interruption Detected",
          size: "Large",
          weight: "Bolder",
          wrap: true
        },
        {
          type: "TextBlock",
          text: "We are currently experiencing issues with the production database. Our engineers are investigating.",
          wrap: true
        }
      ]
    },
    createdAt: new Date().toISOString()
  },
  {
    _id: 'pb-3',
    name: '✅ Approval Request',
    description: 'A professional approval workflow card with action buttons.',
    type: 'adaptive_card',
    content: {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Approval Required: Budget Increase",
          weight: "Bolder",
          size: "Large"
        },
        {
          type: "FactSet",
          facts: [
            { title: "Requested By:", value: "John Doe" },
            { title: "Amount:", value: "$5,000" },
            { title: "Project:", value: "Hub Integration" }
          ]
        }
      ],
      actions: [
        { type: "Action.Submit", title: "Approve", style: "positive", data: { action: "approve" } },
        { type: "Action.Submit", title: "Reject", style: "destructive", data: { action: "reject" } }
      ]
    },
    createdAt: new Date().toISOString()
  },
  {
    _id: 'pb-4',
    name: '📊 Status Update',
    description: 'Weekly status report template using FactSets.',
    type: 'adaptive_card',
    content: {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Weekly Progress Update",
          weight: "Bolder",
          size: "Large"
        },
        {
          type: "FactSet",
          facts: [
            { title: "Backend:", value: "95% Complete" },
            { title: "Frontend:", value: "80% Complete" },
            { title: "Testing:", value: "In Progress" }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString()
  },
  {
    _id: 'pb-5',
    name: '🗳️ Quick Poll',
    description: 'Interactive poll card to gather team feedback.',
    type: 'adaptive_card',
    content: {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Next Team Meeting Time?",
          weight: "Bolder",
          size: "Large"
        },
        {
          type: "Input.ChoiceSet",
          id: "meetingTime",
          style: "expanded",
          choices: [
            { title: "Monday 10 AM", value: "mon_10" },
            { title: "Tuesday 2 PM", value: "tue_2" },
            { title: "Wednesday 11 AM", value: "wed_11" }
          ]
        }
      ],
      actions: [
        { type: "Action.Submit", title: "Vote", style: "positive" }
      ]
    },
    createdAt: new Date().toISOString()
  }
];
