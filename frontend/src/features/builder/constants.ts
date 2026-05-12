export const INITIAL_CARD_JSON = {
    type: "AdaptiveCard",
    version: "1.5",
    body: [
        {
            type: "Container",
            style: "accent",
            bleed: true,
            items: [
                {
                    type: "TextBlock",
                    text: "✨ SYSTEM DESIGN HUB",
                    size: "Small",
                    weight: "Bolder",
                    color: "Light"
                },
                {
                    type: "TextBlock",
                    text: "Premium Layout Workspace",
                    size: "ExtraLarge",
                    weight: "Bolder",
                    color: "Light",
                    spacing: "None"
                }
            ]
        },
        {
            type: "TextBlock",
            text: "Design Excellence Ready",
            size: "Large",
            weight: "Bolder",
            color: "Default",
            spacing: "Medium"
        },
        {
            type: "TextBlock",
            text: "Drag elements from the left inventory palette to build dynamic layouts. Customize container styling tokens directly to generate WOW visual experiences.",
            wrap: true,
            size: "Medium"
        },
        {
            type: "FactSet",
            facts: [
                { title: "Status:", value: "🟢 Fully Operational" },
                { title: "Target Version:", value: "v1.5 Enterprise Standard" }
            ]
        }
    ],
    actions: [
        {
            type: "Action.Submit",
            title: "Engage Relay Flow",
            style: "positive"
        }
    ],
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
};

export const ELEMENT_PALETTE = [
    {
        category: "Content",
        items: [
            {
                type: "TextBlock",
                label: "Text Block",
                icon: "T",
                description: "Paragraph or heading text",
                default: { type: "TextBlock", text: "New text block", wrap: true },
            },
            {
                type: "Image",
                label: "Image",
                icon: "🖼",
                description: "Display an image",
                default: {
                    type: "Image",
                    url: "https://adaptivecards.io/content/adaptive-card-50.png",
                    size: "Medium",
                    altText: "Image",
                },
            },
            {
                type: "FactSet",
                label: "Fact Set",
                icon: "≡",
                description: "Key-value pairs",
                default: {
                    type: "FactSet",
                    facts: [
                        { title: "Label", value: "Value" },
                        { title: "Label 2", value: "Value 2" },
                    ],
                },
            },
            {
                type: "ColumnSet",
                label: "Column Set",
                icon: "⊞",
                description: "Side-by-side columns",
                default: {
                    type: "ColumnSet",
                    columns: [
                        { type: "Column", width: "stretch", items: [{ type: "TextBlock", text: "Column 1", wrap: true }] },
                        { type: "Column", width: "stretch", items: [{ type: "TextBlock", text: "Column 2", wrap: true }] },
                    ],
                },
            },
            {
                type: "Container",
                label: "Container",
                icon: "□",
                description: "Group elements together",
                default: {
                    type: "Container",
                    style: "emphasis",
                    items: [{ type: "TextBlock", text: "Container content", wrap: true }],
                },
            },
        ],
    },
    {
        category: "Input",
        items: [
            {
                type: "Input.Text",
                label: "Text Input",
                icon: "✎",
                description: "Single or multi-line text",
                default: { type: "Input.Text", id: "textInput", placeholder: "Enter text...", label: "Text Field" },
            },
            {
                type: "Input.ChoiceSet",
                label: "Dropdown",
                icon: "▾",
                description: "Select from options",
                default: {
                    type: "Input.ChoiceSet",
                    id: "choiceInput",
                    label: "Choose an option",
                    choices: [
                        { title: "Option 1", value: "1" },
                        { title: "Option 2", value: "2" },
                    ],
                },
            },
            {
                type: "Input.Toggle",
                label: "Toggle",
                icon: "⊙",
                description: "On/off switch",
                default: { type: "Input.Toggle", id: "toggleInput", title: "Enable feature", label: "Toggle" },
            },
        ],
    },
    {
        category: "Actions",
        items: [
            {
                type: "Action.Submit",
                label: "Submit Button",
                icon: "↑",
                description: "Submit form data",
                default: { type: "Action.Submit", title: "Submit", data: { action: "submit" } },
            },
            {
                type: "Action.OpenUrl",
                label: "Open URL",
                icon: "↗",
                description: "Open a link",
                default: { type: "Action.OpenUrl", title: "Learn More", url: "https://example.com" },
            },
            {
                type: "Action.ShowCard",
                label: "Show Card",
                icon: "⊕",
                description: "Expand inline card",
                default: {
                    type: "Action.ShowCard",
                    title: "Show Details",
                    card: {
                        type: "AdaptiveCard",
                        body: [{ type: "TextBlock", text: "Hidden content revealed!", wrap: true }],
                    },
                },
            },
        ],
    },
];
