# MCP Server for RSS3

An MCP server implementation that integrates the RSS3 API. Query the Open Web like a charm.

## Features

Anything in <https://docs.rss3.io/guide/developer/api>.

For example,

- query data on decentralized chains and platforms;
- query data on social media platforms;
- query data on RSS3 network (about staking, nodes, etc.);
- query ai intels.
- ...

### Examples

> What did vitalik do recently?

![example response](https://github.com/user-attachments/assets/072b812a-42ea-41ad-ac49-2e271b9d02ff)

> Tell me about recent AI intels?

![example response](https://github.com/user-attachments/assets/e85a79ee-891f-4c19-aadb-d2c89cf76796)

> show me the rss3 chip with id 2048

![example response](https://github.com/user-attachments/assets/19eace63-7ae4-4599-81ca-10516ca0e8e6)

> what is the best rss3 node to stake?

![example response](https://github.com/user-attachments/assets/c014cacf-b284-491a-b1b4-fd1a61767133)

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
