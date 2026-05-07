# Step 4: Frontend UI & Message Composer

Building a high-end, responsive dashboard for managing Teams communications.

## 4.1 Layout & Navigation
- **Sidebar**: Expandable list of Teams and Channels.
- **Header**: User profile, search bar, and logout button.
- **Main View**: Tabs for "Composer", "Scheduled", "Admin", and "Analytics".

## 4.2 TipTap Message Composer
Build a rich-text editor with:
- **Toolbar**: Standard formatting (Bold, Italic, Lists, Code).
- **@Mentions**: Integrate TipTap's mention extension. Fetch channel members via Graph API and allow users to mention them in messages.
- **File Attachments**: Drag-and-drop area for uploading files to OneDrive and attaching them to messages.
- **Payload Warning**: Live character count with a visual warning if the HTML exceeds the 28KB Graph API limit.

## 4.3 Schedule Manager
- **Input**: Date-time-local picker with timezone support.
- **Recurrence**: Options for Daily, Weekly, or Monthly scheduling (mapped to BullMQ cron).
- **Dashboard**: A table showing pending, sent, and failed jobs with the ability to "Cancel" or "Edit" pending messages.

## 4.4 Real-time Feedback
- Use `useSocket` hook to listen for `message:sent` or `subscription:expired` events.
- Implement "Toasts" for immediate user feedback on background actions.
- Skeleton loaders for teams and channel lists to improve perceived performance.
