Set-Location $PSScriptRoot
Set-Location ../cdn/apps/task-proxy

$appsJsonPath = "apps.json"
$apps = @{
    "versions" = @{}
    "win" = @()
    "mac" = @()
    "ubu" = @()
}
$domain = "https://cdn.myfi.ws/apps/task-proxy/"

$recordTemplate = @{"name" = "task-proxy_0.1.0_x64-setup.exe";"file" = "https://cdn.myfi.ws/apps/win/0.1.0/nsis/task-proxy_0.1.0_x64-setup.exe";"version" = "0.1.0"}

function GetAppVersionFromFolderName {
    param(
        [string]$folderPath
    )
    $version = ""
    $folderName = (Split-Path -Path $folderPath -Leaf)
    if ($folderName -match "^\d+\.\d+\.\d+$") {
        $version = $folderName
    }
    return $version
}

function AddAppRecord {
    param(
        [ref]$apps,
        [string]$os,
        [string]$file,
        [string]$name,
        [string]$version
    )

    # If version is empty, exit
    if([string]::IsNullOrEmpty($version)){
        return
    }
    $relativeFilePath = $file.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    $fileUrl = "$domain$relativeFilePath"
    $record = $recordTemplate.Clone()
    $record.name = $name
    $record.file = $fileUrl
    $record.version = $version
    $apps.Value[$os] += $record
}

function ProcessAppDirectory {
    param(
        [ref]$apps,
        [string]$os,
        [string]$path,
        [string[]]$fileFilters
    )

    if (Test-Path $path) {
        Get-ChildItem -Path $path -Directory | Sort-Object @{Expression = {[version]$_.Name}} | ForEach-Object {
            $version = GetAppVersionFromFolderName -folderPath $_.FullName
            if([string]::IsNullOrEmpty($version)){
                Write-Warning "Could not get version from folder name $($_.FullName)"
                return
            }
            foreach ($filter in $fileFilters) {
                Get-ChildItem -Path $_.FullName -Recurse -File -Filter $filter | ForEach-Object {
                    $file = $_.FullName
                    $name = $_.Name

                    $fileVersion = $version
                    AddAppRecord -apps $apps -os $os -file $file -name $name -version $fileVersion
                }
            }
        }
    } else {
        Write-Warning "$($os) directory not found at $path"
    }
}

function CreateVersionNotes {
    param(
        [ref]$apps,
        [string]$compare,
        [string]$path
    )
    $headers = @{
        "User-Agent" = "PowerShell"
    }
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/StoicDreams/TaskProxyApp/compare/$compare" -Headers $headers -Method Get

    if ($response) {
        $markdown = "## Release Notes`n`n"
        $copy = ""
        foreach ($commit in $response.commits) {
            $messageLines = $commit.commit.message -split "`n"
            foreach ($line in $messageLines) {
                if ($line -match "^(feat|fix|feature|Feature|Fix):") {
                    $line = $line.Trim().
                        Replace("Feature:", "**Feature:**").
                        Replace("feature:", "**Feature:**").
                        Replace("feat:", "**Feature:**").
                        Replace("Fix:", "**Fix:**").
                        Replace("fix:", "**Fix:**")
                    $copy = "$($copy)$line`n`n"
                }
            }
        }
        if ($copy -eq "") {
            $markdown = "$($markdown)General App Development`n`nNo notable features, enhancements, or modifications were made for this release."
        } else {
            $markdown = "$($markdown)$copy"
        }
        $markdown | Out-File -FilePath $path -Encoding UTF8
        $version = $compare.Split('v')[2]
        Write-Host "Version $version saved to $path"
        $apps.Value.versions.$version = $path
    }
}

# Process Windows apps
ProcessAppDirectory -apps ([ref]$apps) -os "win" -path "win" -fileFilters @("*.exe", "*.msi")

# Process macOS apps
ProcessAppDirectory -apps ([ref]$apps) -os "mac" -path "mac" -fileFilters "*.dmg"

# Process Ubuntu apps
ProcessAppDirectory -apps ([ref]$apps) -os "ubu" -path "ubu" -fileFilters @("*.deb", "*.AppImage")

# Build Version files
$headers = @{
    "User-Agent" = "PowerShell"
}
$response = Invoke-RestMethod -Uri "https://api.github.com/repos/StoicDreams/TaskProxyApp/tags" -Headers $headers -Method Get

if ($response) {
    $prev = "";
    $next = "";
    # Note, latest releases are first
    $releases = @()
    $isFirst = $true
    [array]::Reverse($response)
    foreach ($tag in $response) {
        $prev = $next
        $next = $tag.name
        if ($isFirst) {
            $releases += $next
            $isFirst = $false
            continue
        } else {
            if (Test-Path "win/$($next.Substring(1))") {
                $releases += $next
            }
            elseif (Test-Path "mac/$($next.Substring(1))") {
                $releases += $next
            }
            elseif (Test-Path "ubu/$($next.Substring(1))") {
                $releases += $next
            }
        }
    }
    $isFirst = $true
    foreach ($tag in $releases) {
        $prev = $next
        $next = $tag
        if ($isFirst) {
            $isFirst = $false
            continue;
        }
        if ($prev -ne "") {
            $fileName = "release-$($next.Substring(1)).md"
            if (!(Test-Path $fileName)) {
                CreateVersionNotes -apps ([ref]$apps) -compare "$prev...$next" -path $fileName
            } else {
                $version = $next.Substring(1)
                $apps.versions.$version = $fileName
            }
        }
    }
} else {
    Write-Host "Failed to fetch tags or no tags available."
}

$allAvailableVersions = @()
if ($apps.win) { $allAvailableVersions += $apps.win.version }
if ($apps.mac) { $allAvailableVersions += $apps.mac.version }
if ($apps.ubu) { $allAvailableVersions += $apps.ubu.version }
$latestVersion = ($allAvailableVersions | Select-Object -Unique | Sort-Object { [version]$_ } | Select-Object -Last 1)
if ($latestVersion) {
    $updateJsonPath = "update.json"
    $updateManifest = @{
        version = $latestVersion
        notes = "Update to version $latestVersion"
        pub_date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        platforms = @{}
    }
    if ($apps.versions.$latestVersion -and (Test-Path $apps.versions.$latestVersion)) {
        $updateManifest.notes = (Get-Content -Path $apps.versions.$latestVersion -Raw).Trim()
    }
    function Get-UpdateAsset {
        param([string]$searchPath, [string]$sigFilter)
        if (Test-Path $searchPath) {
            $sigFile = Get-ChildItem -Path $searchPath -Recurse -File -Filter $sigFilter | Select-Object -First 1
            if ($sigFile) {
                $archiveFile = $sigFile.FullName.Substring(0, $sigFile.FullName.Length - 4)
                if (Test-Path $archiveFile) {
                    $basePath = (Get-Location).Path
                    $relPath = $archiveFile.Replace("$basePath\", "").Replace("$basePath/", "").Replace("\", "/")
                    return @{
                        signature = (Get-Content -Path $sigFile.FullName -Raw).Trim()
                        url = "$domain$relPath"
                    }
                }
            }
        }
        return $null
    }
    $winAsset = Get-UpdateAsset -searchPath "win/$latestVersion" -sigFilter "*.zip.sig"
    if ($winAsset) { $updateManifest.platforms["windows-x86_64"] = $winAsset }
    $macAsset = Get-UpdateAsset -searchPath "mac/$latestVersion" -sigFilter "*.tar.gz.sig"
    if ($macAsset) {
        if ($macAsset.url -match "aarch64") {
            $updateManifest.platforms["darwin-aarch64"] = $macAsset
        } elseif ($macAsset.url -match "x64" -or $macAsset.url -match "x86_64") {
            $updateManifest.platforms["darwin-x86_64"] = $macAsset
        } else {
            $updateManifest.platforms["darwin-aarch64"] = $macAsset
            $updateManifest.platforms["darwin-x86_64"] = $macAsset
        }
    }
    $ubuAsset = Get-UpdateAsset -searchPath "ubu/$latestVersion" -sigFilter "*.tar.gz.sig"
    if ($ubuAsset) { $updateManifest.platforms["linux-x86_64"] = $ubuAsset }
    $updateManifest | ConvertTo-Json -Depth 5 | Out-File -FilePath $updateJsonPath -Encoding UTF8
    Write-Host "Created update.json for version $latestVersion"
}

$apps | ConvertTo-Json -Depth 5 | Out-File -FilePath $appsJsonPath -Encoding UTF8
Set-Location $PSScriptRoot
