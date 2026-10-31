# Concurrent Safe Git Sync Wrapper for Sovereign Lands Agents
param (
    [Parameter(Mandatory=$true, Position=0)]
    [string]$AgentId,

    [Parameter(Mandatory=$true, Position=1)]
    [string]$Message,

    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Files
)

node "$PSScriptRoot\agent-git.js" $AgentId $Message $Files
