# ChatGPT App Template

A template for building ChatGPT Apps (widgets) using the ChatGPT Apps SDK, served via a Cloudflare Workers MCP server.

## Overview

This project provides an extensible system for registering and serving widgets in ChatGPT. Widgets are React components that are built and bundled, then served by the MCP server with all necessary assets (JavaScript, CSS, and global styles) embedded inline.

## Project Structure

```
├── web/                           # Widget development
│   ├── widgets/
│   │   └── reservation-card.tsx   # Example widget component
│   ├── dist/                      # Built assets
│   │   ├── globals.css            # Shared Tailwind styles (auto-embedded)
│   │   ├── reservation-card.css   # Widget-specific styles
│   │   └── reservation-card.js    # Widget bundle
│   ├── globals.css                # Tailwind source
│   └── package.json               # Build configuration
│
├── server/                        # MCP server
│   ├── widgets/
│   │   ├── config.ts              # Widget registry (ADD NEW WIDGETS HERE)
│   │   ├── registry.ts            # Registration logic
│   │   └── utils.ts               # Asset loading utilities
│   └── index.ts                   # Server entry point, manual tool registration
│
└── package.json                   # Root workspace
```

## How to Register a New Widget

### Step 1: Create the Widget Component

Create a new React component in `web/widgets/`:

```tsx
// web/widgets/flight-status.tsx
import { createRoot } from 'react-dom/client';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';

export function FlightStatus() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-default bg-surface shadow-lg p-4">
      <h2 className="heading-lg">Flight AA1234</h2>
      <Badge color="success">On Time</Badge>
      {/* Your widget UI here */}
    </div>
  );
}

// Mount the component
createRoot(document.getElementById('flight-root')!).render(<FlightStatus />);
```

**Key conventions:**
- Export a named React component
- Use OpenAI Apps SDK UI components for consistency
- Use Tailwind CSS classes for styling
- Mount to a DOM element with a unique ID (e.g., `flight-root`)

### Step 2: Add Build Script

Update `web/package.json` to build your new widget:

```json
{
  "scripts": {
    "build": "npm run build:reservation-card && npm run build:flight-status && npm run build:css",
    "build:reservation-card": "esbuild widgets/reservation-card.tsx --bundle --format=esm --outfile=dist/reservation-card.js",
    "build:flight-status": "esbuild widgets/flight-status.tsx --bundle --format=esm --outfile=dist/flight-status.js",
    "build:css": "npx @tailwind/cli -i globals.css -o dist/globals.css"
  }
}
```

### Step 3: Register the Widget

Add your widget configuration to `server/widgets/config.ts`:

```typescript
export const WIDGET_CONFIGS: WidgetConfig[] = [
  {
    name: 'reservation-card',
    uri: 'ui://widget/reservation-card.html',
    title: 'Reservation Card Widget',
    description: 'Reservation card UI widget for ChatGPT',
    rootElementId: 'reservation-root',
    meta: {
      prefersBorder: true,
      domain: 'https://chatgpt.com',
      csp: {
        connect_domains: ['https://chatgpt.com'],
        resource_domains: ['https://*.oaistatic.com'],
      },
    },
  },
  // Add your new widget here:
  {
    name: 'flight-status',                        // Must match filename (flight-status.tsx -> flight-status)
    uri: 'ui://widget/flight-status.html',        // Unique widget URI
    title: 'Flight Status Widget',                // Display title
    description: 'Real-time flight status widget',
    rootElementId: 'flight-root',                 // Must match the ID in createRoot()
    meta: {
      prefersBorder: true,                        // Optional: add border in ChatGPT UI
      domain: 'https://chatgpt.com',              // Allowed domain
      csp: {                                      // Content Security Policy
        connect_domains: ['https://chatgpt.com', 'https://api.example.com'],
        resource_domains: ['https://*.oaistatic.com'],
      },
    },
  },
];
```

**That's it!** Your widget resource is now automatically registered. The system will:
- ✅ Load `globals.css` (shared Tailwind styles)
- ✅ Load `flight-status.css` (widget-specific styles)
- ✅ Load `flight-status.js` (widget bundle)
- ✅ Embed all three inline in the HTML response
- ✅ Register the resource with the MCP server

### Step 4: Register a Tool (Optional)

If your widget needs to be invoked via a tool, manually register it in `server/index.ts`:

```typescript
server.registerTool(
  'flight-status',
  {
    title: 'Show Flight Status',
    inputSchema: { flightNumber: z.string() },
    _meta: {
      'openai/outputTemplate': 'ui://widget/flight-status.html',  // Must match widget URI
      'openai/toolInvocation/invoking': 'Checking flight status...',
      'openai/toolInvocation/invoked': 'Flight status ready.',
    },
  },
  async ({ flightNumber }) => {
    return {
      content: [
        {
          type: 'text',
          text: `Showing flight status for ${flightNumber}`,
        },
      ],
    };
  },
);
```

### Step 5: Build and Deploy

```bash
# Build widgets
npm run build

# Test locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Configuration Reference

### `WidgetConfig` Interface

```typescript
interface WidgetConfig {
  name: string;           // Widget identifier, must match filename without extension
  uri: string;            // Widget URI in format 'ui://widget/{name}.html'
  title: string;          // Display title for the widget resource
  description: string;    // Description of the widget
  rootElementId: string;  // DOM element ID where React component mounts
  meta?: {
    prefersBorder?: boolean;    // Whether to show border in ChatGPT UI
    domain?: string;            // Allowed domain (usually 'https://chatgpt.com')
    csp?: {
      connect_domains?: string[];   // Domains widget can connect to (APIs, etc.)
      resource_domains?: string[];  // Domains for loading resources
    };
  };
}
```

## How It Works

1. **Module Initialization**: When the server starts, widgets are registered from `WIDGET_CONFIGS`
2. **Lazy Asset Loading**: Widget assets (CSS/JS) are loaded only when the resource is requested
3. **Inline Embedding**: All assets are embedded inline in the HTML response
4. **Globals CSS**: Every widget automatically includes `dist/globals.css` for shared Tailwind styles

### Asset Loading Flow

```
ChatGPT requests widget resource
         ↓
server/widgets/registry.ts
         ↓
Loads 3 files in parallel:
  - dist/globals.css (shared)
  - dist/{widget-name}.css (widget-specific)
  - dist/{widget-name}.js (widget bundle)
         ↓
Generates HTML with inline <style> and <script>
         ↓
Returns to ChatGPT
```

## Development Tips

- **Widget naming**: Use kebab-case for consistency (e.g., `flight-status`, not `FlightStatus`)
- **Root element ID**: Convention is `{widget-name}-root` (e.g., `flight-root`)
- **Tailwind classes**: Use OpenAI Apps SDK design tokens (`border-default`, `bg-surface`, etc.)
- **Props**: Currently, widgets don't receive props - data is hard-coded (consider extending for dynamic data)
- **Build output**: Check `web/dist/` to verify your widget built correctly

## Extending the System

### Adding Dynamic Data

To pass data from tool invocation to widgets, you'll need to:
1. Modify the widget component to accept props or read from a data attribute
2. Update the HTML generation in `server/widgets/utils.ts` to inject data
3. Pass data from the tool handler to the widget resource

### Custom Widget Metadata

Add custom metadata fields to `WidgetConfig.meta` as needed for your use case.

### Widget Validation

Consider adding validation in `server/widgets/registry.ts` to ensure:
- Required asset files exist
- Configuration is valid
- URIs follow expected patterns

## Troubleshooting

**Widget not showing up:**
- Verify widget is in `WIDGET_CONFIGS` array
- Check that `name` matches the filename (without `.tsx`)
- Ensure `rootElementId` matches the ID in `createRoot()`

**Styles not working:**
- Run `npm run build` to rebuild CSS
- Verify `globals.css` is being embedded (check network tab)
- Check Tailwind class names match OpenAI SDK tokens

**TypeScript errors:**
- Run `npm run cf-typegen` to regenerate Cloudflare types
- Check imports are correct in widget files

## Resources

- [ChatGPT Apps SDK Documentation](https://platform.openai.com/docs/guides/apps)
- [OpenAI Apps SDK UI Components](https://www.npmjs.com/package/@openai/apps-sdk-ui)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
