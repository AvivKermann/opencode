# Notion CLI Integration

This skill provides access to Notion via the Notion CLI or API.

## Prerequisites

### Option A: notion-cli (community tool)
```bash
npm install -g notion-cli
```

### Option B: Direct API via curl
Set your Notion API key:
```bash
export NOTION_API_KEY="your-integration-token"
```

Create an integration at: https://www.notion.so/my-integrations

## Available Commands

### Search Pages
```bash
# Search for a page
curl -X POST 'https://api.notion.com/v1/search' \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"query": "search term"}'
```

### Read Page Content
```bash
# Get page content (blocks)
curl 'https://api.notion.com/v1/blocks/{block_id}/children' \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28"
```

### Read Database
```bash
# Query a database
curl -X POST 'https://api.notion.com/v1/databases/{database_id}/query' \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json"
```

## Usage in Workflow

When context-gather needs project documentation from Notion:
- Pull PRDs and technical specs
- Read meeting notes and decisions
- Access project wikis and runbooks
