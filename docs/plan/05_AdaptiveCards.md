# Step 5: Adaptive Card Builder

Building a specialized tool for creating and sending Microsoft Adaptive Cards.

## 5.1 Three-Pane Builder Interface
1.  **Left Panel (Palette)**: A list of draggable Adaptive Card elements (TextBlocks, Images, FactSets, Action.Submit buttons).
2.  **Center Panel (Canvas)**: A drag-and-drop target that renders the card in real-time using the `adaptivecards` JavaScript SDK.
3.  **Right Panel (Code Editor)**: A Monaco Editor (VS Code core) showing the live JSON representation of the card.

## 5.2 Two-Way Binding
- Changes in the **Canvas** (dragging/editing properties) update the **JSON**.
- Manual edits in the **JSON** panel reflect immediately in the **Canvas**.
- JSON validation error overlay to prevent sending malformed cards.

## 5.3 Template System
- Allow users to save cards as templates in MongoDB.
- Gallery modal with pre-built templates (e.g., "Weekly Report", "Project Update").

## 5.4 Integration with Graph API
- Convert the JSON card into a Graph API message attachment.
- Wrap the card in the required `chatMessage` schema:
  ```json
  {
    "attachments": [{
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": "{...}"
    }]
  }
  ```
