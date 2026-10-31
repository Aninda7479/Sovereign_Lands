# Commonwealth Agent Monitor PowerShell Script
param (
    [switch]$Watch
)

if ($Watch) {
    node "$PSScriptRoot\agent-monitor.js" --watch
} else {
    node "$PSScriptRoot\agent-monitor.js"
}
