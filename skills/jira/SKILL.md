# Jira CLI Integration

This skill provides access to Jira via the Jira CLI tool.

## Prerequisites

Install the Jira CLI:
```bash
# macOS
brew install ankitpokhrel/jira-cli/jira-cli

# Or via go
go install github.com/ankitpokhrel/jira-cli/cmd/jira@latest
```

Configure with:
```bash
jira init
```

## Available Commands

### View Issues
```bash
# List issues assigned to me
jira issue list -a$(jira me)

# View a specific issue
jira issue view PROJ-123

# List issues in a sprint
jira sprint list --current
```

### Create Issues
```bash
# Create an issue interactively
jira issue create

# Create with parameters
jira issue create -tTask -s"Summary" -b"Description" -pPROJ
```

### Update Issues
```bash
# Move issue to status
jira issue move PROJ-123 "In Progress"

# Add a comment
jira issue comment add PROJ-123 "Comment text"

# Assign to me
jira issue assign PROJ-123 $(jira me)
```

## Usage in Workflow

When kermintor or context-gather needs Jira context, use these commands to:
- Pull task descriptions and acceptance criteria
- Check related issues and blockers
- Update issue status as work progresses
- Add implementation notes as comments
