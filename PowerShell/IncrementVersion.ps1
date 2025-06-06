# This script is used to update the Patch version number
Param (
    [Switch]$major,
    [Switch]$minor
)

$cacheLoc = Get-Location
Set-Location $PSScriptRoot

$version = $null
$vmajor = 0
$vminor = 0
$vpatch = 0

$rgxTargetGetVersion = '([0-9]+)\.([0-9]+)\.([0-9]+)'
$result = Select-String -Path "../cdn/webui/version" -Pattern $rgxTargetGetVersion
if ($result.Matches.Count -gt 0) {
    $vmajor = [int]$result.Matches[0].Groups[1].Value
    $vminor = [int]$result.Matches[0].Groups[2].Value
    $vpatch = [int]$result.Matches[0].Groups[3].Value
    if ($major) {
        $vmajor = $vmajor + 1;
        $vminor = 0;
        $vpatch = 0;
    }
    elseif ($minor) {
        $vminor = $vminor + 1;
        $vpatch = 0;
    }
    else {
        $vpatch = $vpatch + 1;
    }
    $script:version = "$vmajor.$vminor.$vpatch"
}
else {
    Write-Host "Source Not Found" -ForegroundColor Red
}

Set-Location $cacheLoc

Write-Host "Found version $version";

function UpdateProjectVersion {
    Param (
        [string] $projectPath,
        [string] $version,
        [string] $rgxTargetXML,
        [string] $newXML
    )

    if (!(Test-Path -Path $projectPath)) {
        Write-Host "Not found - $projectPath" -BackgroundColor Red -ForegroundColor White
        return;
    }
    $content = Get-Content -Path $projectPath -Encoding UTF8 -Raw

    $content -match $rgxTargetXML | ForEach-Object {
        if ($_ -eq $False) { return; }
        $old = $Matches[0];
        Write-Host "Matches '$old'";
        if ($old -eq $newXML) {
            Write-Host "Already up to date - $projectPath - $old === $newXML" -ForegroundColor Cyan
            return;
        }
        $newContent = ($content).replace($old, $newXML).Trim()
        $newContent | Set-Content -Path $projectPath -Encoding UTF8
        Write-Host "Updated - $projectPath" -ForegroundColor Green
    }
}

function ApplyVersionUpdates {
    Param (
        [string] $path,
        [string] $filter,
        [string] $rgxTargetXML,
        [string] $newXML
    )
    Get-ChildItem -Path $path -Filter $filter -Recurse -File -Force | ForEach-Object {
        UpdateProjectVersion $_.FullName $version $rgxTargetXML $newXML
    }
}

if ($null -ne $version) {
    Write-Host Found Version: $version -ForegroundColor Green
    $rootpath = Get-Location
    $rootpath = $rootpath.ToString().ToLower()
    Write-Host Path: "Root Path Start: $rootpath"

    ApplyVersionUpdates .\cdn\webui poweredby.min.js '"version","([0-9\.]+)"' """version"",""$version"""
    ApplyVersionUpdates .\cdn\webui poweredby.js 'setAttribute\("version", "([0-9\.]+)"\)' "setAttribute(""version"", ""$version"")"
    ApplyVersionUpdates .\cdn\webui version '.*' "$version"
    ApplyVersionUpdates .\ README.md '\[Version: ([0-9\.]+)\]' "[Version: $version]"
}
else {
    Write-Host Current version was not found -ForegroundColor Red
}
