<#
.SYNOPSIS
Lists the shared images in cdn/img and cdn/v in cdn/imagedata.json.

.DESCRIPTION
Each entry has the file name, its path from the site root (such as /img/eg/me_128.webp), its type, and the date it was created.
Files that are not images, such as Paint.NET .pdn sources, are skipped.

.PARAMETER OutFile
Where to write the list. Defaults to cdn/imagedata.json.
#>
[CmdletBinding()]
param(
    [string]$OutFile
)
$ErrorActionPreference = 'Stop'

$cdnRoot = (Resolve-Path (Join-Path $PSScriptRoot '../cdn')).Path
if (-not $OutFile) {
    $OutFile = Join-Path $cdnRoot 'imagedata.json'
}

$fileTypes = @('jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif', 'ico')
$skipped = [System.Collections.Generic.SortedSet[string]]::new()

$files = foreach ($folder in @('img', 'v')) {
    Get-ChildItem -LiteralPath (Join-Path $cdnRoot $folder) -Recurse -File |
    Sort-Object FullName |
    ForEach-Object {
        $type = $_.Extension.TrimStart('.').ToLower()
        if ($fileTypes -notcontains $type) {
            [void]$skipped.Add($type)
            return
        }
        [ordered]@{
            file_name = $_.Name
            file_path = $_.FullName.Substring($cdnRoot.Length).Replace('\', '/')
            file_type = $type
            updated   = $_.CreationTime.ToString('yyyy-MM-dd')
        }
    }
}

ConvertTo-Json -InputObject @($files) -Depth 2 | Set-Content -LiteralPath $OutFile -Encoding utf8NoBOM

Write-Host "Wrote $(@($files).Count) images to $OutFile"
if ($skipped.Count -gt 0) {
    Write-Host "Skipped file types: $($skipped -join ', ')" -ForegroundColor Yellow
}
