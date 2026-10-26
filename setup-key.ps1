$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $destination) {
    Write-Host 'A .env file already exists. Open it locally to update MODEL_API_KEY; this script will not overwrite it.'
    exit 1
}
$secret = Read-Host 'Paste your Meta API key (hidden)' -AsSecureString
try {
    $value = [System.Net.NetworkCredential]::new('', $secret).Password.Trim()
    if (-not $value -or $value.Contains("`n") -or $value.Contains("`r")) { throw 'Enter a single nonempty API key.' }
    $content = 'MODEL_API_KEY=' + $value + "`nMETA_MODEL=muse-spark-1.3`nMAX_STEPS=15`nMAX_OUTPUT_TOKENS=4096`n"
    [System.IO.File]::WriteAllText($destination, $content)
    Write-Host 'Saved locally to .env. The file is ignored by Git. Next: npm.cmd run check:meta'
} finally {
    Remove-Variable value, content, secret -ErrorAction SilentlyContinue
}
