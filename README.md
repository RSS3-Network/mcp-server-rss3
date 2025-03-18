# MCP Server for RSS3

An MCP server implementation that integrates the RSS3 API. Query the Open Web like a charm.

## Features

Anything in <https://docs.rss3.io/guide/developer/api>.

## Usage

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rss3": {
      "command": "npx",
      "args": [
        "mcp-server-rss3"
      ]
    }
  }
}
```

### Usage with Cursor

1. Open Settings -> Cursor Settings
2. Click on "MCP"
3. Add new MCP Server with this:

```json
{
  "mcpServers": {
    "rss3": {
      "command": "npx",
      "args": [
        "mcp-server-rss3"
      ]
    }
  }
}
```

### Usage with ChatWise

1. Open Settings -> Tools
2. Add new tool with this command:

```
npx mcp-server-rss3
```
