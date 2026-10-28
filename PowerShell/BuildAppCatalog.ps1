# BuildAppCatalog.ps1
# A release is catalog-eligible only when at least one OS/version directory
# contains an installer and a nonempty .sig whose corresponding file exists.
# Only the 10 newest eligible versions are included in apps.json.

$ErrorActionPreference = 'Stop'
$catalogRoot = Join-Path $PSScriptRoot '../cdn/apps/task-proxy'
if (-not (Test-Path -LiteralPath $catalogRoot -PathType Container)) {
    throw "Catalog directory not found: $catalogRoot"
}

Push-Location -LiteralPath $catalogRoot
try {
    $script:domain = 'https://cdn.myfi.ws/apps/task-proxy/'
    $appsJsonPath = 'apps.json'
    $updateJsonPath = 'update.json'

    $apps = [ordered]@{
        versions = [ordered]@{}
        win      = @()
        mac      = @()
        ubu      = @()
    }

    function Get-FileUrl {
        param([Parameter(Mandatory)][string]$Path)

        $root = (Get-Location).ProviderPath.TrimEnd([char[]]@('\', '/'))
        $fullPath = [System.IO.Path]::GetFullPath($Path)
        $prefix = $root + [System.IO.Path]::DirectorySeparatorChar

        if (-not $fullPath.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "File is outside catalog directory: $fullPath"
        }

        $relativePath = $fullPath.Substring($prefix.Length).Replace('\', '/')
        $encodedSegments = @($relativePath -split '/' | ForEach-Object {
            [System.Uri]::EscapeDataString($_)
        })
        return $script:domain + ($encodedSegments -join '/')
    }

    function Get-SignedAssets {
        param([Parameter(Mandatory)][string]$Directory)

        $signatureFiles = @(Get-ChildItem -LiteralPath $Directory -Recurse -File -Filter '*.sig' |
            Sort-Object FullName)
        foreach ($sigFile in $signatureFiles) {
            $assetPath = $sigFile.FullName.Substring(0, $sigFile.FullName.Length - 4)
            if (-not (Test-Path -LiteralPath $assetPath -PathType Leaf)) { continue }

            try {
                $signature = (Get-Content -LiteralPath $sigFile.FullName -Raw).Trim()
                if (-not $signature) { continue }

                [pscustomobject]@{
                    Asset     = Get-Item -LiteralPath $assetPath
                    SigFile   = $sigFile
                    Signature = $signature
                }
            }
            catch {
                Write-Warning "Could not read signature $($sigFile.FullName): $_"
            }
        }
    }

    function Get-InstallerFiles {
        param(
            [Parameter(Mandatory)][string]$Directory,
            [Parameter(Mandatory)][string[]]$Filters
        )

        foreach ($filter in $Filters) {
            Get-ChildItem -LiteralPath $Directory -Recurse -File -Filter $filter
        }
    }

    function Get-RepositoryTags {
        $tags = @{}
        $headers = @{
            'User-Agent' = 'BuildAppCatalog.ps1'
            'Accept'     = 'application/vnd.github+json'
        }

        # GitHub's tags endpoint is paginated. A direct assignment is
        # important here: wrapping Invoke-RestMethod in @(...) can result
        # in a nested array. Then $tag.name is an array, not a string,
        # and -match does not populate the automatic $Matches variable.
        for ($page = 1; ; $page++) {
            $uri = "https://api.github.com/repos/StoicDreams/TaskProxyApp/tags?per_page=100&page=$page"
            try {
                $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -TimeoutSec 30
            }
            catch {
                Write-Warning "Unable to fetch GitHub tags (page $page): $_"
                break
            }

            $tagCount = 0
            foreach ($tag in $response) {
                $tagCount++
                # Only accept a single tag name; never use an array or null
                # as a hashtable key.
                if ($null -eq $tag -or $tag.name -isnot [string]) { continue }

                $tagName = $tag.name
                $match = [regex]::Match($tagName, '^v?(\d+\.\d+\.\d+)$')
                if (-not $match.Success) { continue }

                $version = $match.Groups[1].Value
                if ([string]::IsNullOrWhiteSpace($version)) { continue }

                if (-not $tags.ContainsKey($version)) {
                    $tags[$version] = $tagName
                }
            }

            if ($tagCount -lt 100) { break }
        }

        return $tags
    }

    function New-ReleaseNotes {
        param(
            [Parameter(Mandatory)][string]$Version,
            [string]$PreviousVersion,
            [Parameter(Mandatory)][hashtable]$TagLookup
        )

        if (-not $PreviousVersion) {
            return "## Release Notes`n`nInitial signed release (version $Version)."
        }

        if (-not ($TagLookup.ContainsKey($PreviousVersion) -and $TagLookup.ContainsKey($Version))) {
            return "## Release Notes`n`nRelease $Version.`n`nDetailed change notes were unavailable from GitHub."
        }

        $previousTag = [System.Uri]::EscapeDataString($TagLookup[$PreviousVersion])
        $currentTag = [System.Uri]::EscapeDataString($TagLookup[$Version])
        $uri = "https://api.github.com/repos/StoicDreams/TaskProxyApp/compare/$previousTag...$currentTag"

        try {
            $response = Invoke-RestMethod -Uri $uri -Headers @{
                'User-Agent' = 'BuildAppCatalog.ps1'
                'Accept' = 'application/vnd.github+json'
            } -Method Get -TimeoutSec 30

            $changes = @()
            foreach ($commit in $response.commits) {
                foreach ($line in ($commit.commit.message -split "`n")) {
                    $line = $line.Trim()
                    if ($line -match '^(?i:feat|feature)(?:\([^)]+\))?!?:\s*(.+)$') {
                        $changes += "**Feature:** $($Matches[1])"
                    }
                    elseif ($line -match '^(?i:fix)(?:\([^)]+\))?!?:\s*(.+)$') {
                        $changes += "**Fix:** $($Matches[1])"
                    }
                }
            }

            if ($changes.Count -gt 0) {
                return "## Release Notes`n`n$($changes -join "`n`n")"
            }
            return "## Release Notes`n`nGeneral app development. No feature or fix entries were identified in the commit messages."
        }
        catch {
            Write-Warning "Could not compare $PreviousVersion to ${Version}: $_"
            return "## Release Notes`n`nRelease $Version.`n`nDetailed change notes were unavailable from GitHub."
        }
    }

    function ConvertTo-UpdateAsset {
        param([Parameter(Mandatory)]$SignedAsset)

        return [ordered]@{
            signature = $SignedAsset.Signature
            url       = Get-FileUrl -Path $SignedAsset.Asset.FullName
        }
    }

    function Get-PreferredSignedUpdateAsset {
        param(
            [Parameter(Mandatory)][object[]]$SignedAssets,
            [Parameter(Mandatory)][string[]]$FilePatterns
        )

        # Prefer a modern Tauri v2 artifact, then the legacy v1-compatible
        # updater format. Only consider packages for which Get-SignedAssets
        # has found a nonempty .sig and its corresponding existing file.
        foreach ($pattern in $FilePatterns) {
            $matching = @($SignedAssets | Where-Object { $_.Asset.Name -match $pattern })
            if ($matching.Count -eq 0) { continue }

            $x64 = @($matching | Where-Object {
                $_.Asset.Name -match '(?i)(?:x86_64|x64|amd64)'
            })
            if ($x64.Count -gt 0) { return $x64[0] }

            # With no architecture in the filename, keep existing behavior
            # (assume x86_64), but do not map explicitly ARM or 32-bit
            # packages to an x86_64 updater target.
            $unspecifiedArch = @($matching | Where-Object {
                $_.Asset.Name -notmatch '(?i)(?:aarch64|arm64|i686|x86(?!_64))'
            })
            if ($unspecifiedArch.Count -gt 0) { return $unspecifiedArch[0] }
        }

        return $null
    }

    # Index signed releases per platform. A signature must be nonempty and
    # point to an existing file. Unsigned OS folders are never added.
    $releaseIndex = @{}
    $platformDefinitions = @(
        @{ OS = 'win'; Filters = @('*.exe', '*.msi') },
        @{ OS = 'mac'; Filters = @('*.dmg') },
        @{ OS = 'ubu'; Filters = @('*.deb', '*.AppImage') }
    )

    foreach ($platform in $platformDefinitions) {
        $os = $platform.OS
        if (-not (Test-Path -LiteralPath $os -PathType Container)) {
            Write-Warning "$os directory not found"
            continue
        }

        foreach ($directory in (Get-ChildItem -LiteralPath $os -Directory)) {
            if ($directory.Name -notmatch '^\d+\.\d+\.\d+$') { continue }

            $signedAssets = @(Get-SignedAssets -Directory $directory.FullName)
            if ($signedAssets.Count -eq 0) { continue }

            $installers = @(Get-InstallerFiles -Directory $directory.FullName -Filters $platform.Filters |
                Sort-Object FullName -Unique)
            if ($installers.Count -eq 0) { continue }

            $version = $directory.Name
            if (-not $releaseIndex.ContainsKey($version)) {
                $releaseIndex[$version] = @{}
            }

            $releaseIndex[$version][$os] = @{
                Installers   = $installers
                SignedAssets = $signedAssets
            }
        }
    }

    # Limit by distinct VERSION, not by the number of installer files.
    $signedVersionsAscending = @($releaseIndex.Keys | Sort-Object { [version]$_ })
    $selectedVersions = @($signedVersionsAscending | Sort-Object { [version]$_ } -Descending)

    # Existing Markdown is kept. Missing notes are created before including
    # a version in apps.json, so the catalog cannot reference absent notes.
    $tagLookup = @{}
    if (@($selectedVersions | Select-Object -First 10 | Where-Object {
        -not (Test-Path -LiteralPath "release-$($_).md" -PathType Leaf)
    }).Count -gt 0) {
        $tagLookup = Get-RepositoryTags
    }

    foreach ($version in $selectedVersions) {
        if ($apps.versions.Count -ge 10) { break }

        $notesFile = "release-$version.md"
        if (-not (Test-Path -LiteralPath $notesFile -PathType Leaf)) {
            $index = [array]::IndexOf($signedVersionsAscending, $version)
            $previousVersion = if ($index -gt 0) { $signedVersionsAscending[$index - 1] } else { $null }
            $notes = New-ReleaseNotes -Version $version -PreviousVersion $previousVersion -TagLookup $tagLookup

            try {
                Set-Content -LiteralPath $notesFile -Value $notes -Encoding UTF8
                Write-Host "Created $notesFile"
            }
            catch {
                Write-Warning "Unable to create $notesFile; excluding version ${version}: $_"
                continue
            }
        }

        if (-not (Test-Path -LiteralPath $notesFile -PathType Leaf)) { continue }
        $apps.versions[$version] = $notesFile

        foreach ($os in @('win', 'mac', 'ubu')) {
            if (-not $releaseIndex[$version].ContainsKey($os)) { continue }
            foreach ($file in $releaseIndex[$version][$os].Installers) {
                $apps[$os] += [ordered]@{
                    name    = $file.Name
                    file    = Get-FileUrl -Path $file.FullName
                    version = $version
                }
            }
        }
    }

    # Build the updater manifest from a CATALOGED signed version that has
    # at least one signed updater package (Tauri v2 or v1-compatible).
    # Supported architectures: Windows x86_64, macOS Apple Silicon (arm64),
    # and Linux x86_64.  Do not advertise macOS Intel updates.
    $expectedUpdatePlatforms = @('windows-x86_64', 'darwin-aarch64', 'linux-x86_64')
    $manifestWritten = $false
    foreach ($version in @($apps.versions.Keys | Sort-Object { [version]$_ } -Descending)) {
        $platforms = [ordered]@{}

        if ($releaseIndex[$version].ContainsKey('win')) {
            $asset = Get-PreferredSignedUpdateAsset -SignedAssets @($releaseIndex[$version]['win'].SignedAssets) -FilePatterns @(
                '(?i)\.exe$',       # Tauri v2 NSIS: installer.exe + installer.exe.sig
                '(?i)\.msi$',       # Tauri v2 MSI: installer.msi + installer.msi.sig
                '(?i)\.nsis\.zip$',  # Tauri v1-compatible NSIS: *.nsis.zip + .sig
                '(?i)\.msi\.zip$'    # Tauri v1-compatible MSI: *.msi.zip + .sig
            )
            if ($asset) {
                $platforms['windows-x86_64'] = ConvertTo-UpdateAsset -SignedAsset $asset
            } else {
                Write-Warning "No supported signed Windows updater package found for $version (expected .exe.sig, .msi.sig, .nsis.zip.sig, or .msi.zip.sig)."
            }
        } else {
            Write-Warning "Windows $version not indexed: expected a signed package and an .exe or .msi installer in win/$version."
        }

        if ($releaseIndex[$version].ContainsKey('mac')) {
            # macos-latest in this workflow builds for Apple Silicon only.
            # A generic 'Task Proxy.app.tar.gz' filename has no architecture
            # marker, so treat it as ARM64 only; NEVER advertise it for Intel.
            $macArchives = @($releaseIndex[$version]['mac'].SignedAssets |
                Where-Object { $_.Asset.Name -match '(?i)\.app\.tar\.gz$' })
            $armAsset = @($macArchives | Where-Object {
                $_.Asset.Name -match '(?i)(aarch64|arm64)'
            } | Select-Object -First 1)
            $genericAsset = @($macArchives | Where-Object {
                $_.Asset.Name -notmatch '(?i)(aarch64|arm64|x86_64|x64|amd64)'
            } | Select-Object -First 1)

            $selectedMacAsset = $null
            if ($armAsset.Count -gt 0) { $selectedMacAsset = $armAsset[0] }
            elseif ($genericAsset.Count -gt 0) { $selectedMacAsset = $genericAsset[0] }

            if ($selectedMacAsset) {
                $platforms['darwin-aarch64'] = ConvertTo-UpdateAsset -SignedAsset $selectedMacAsset
            } else {
                Write-Warning "No signed Apple Silicon .app.tar.gz update package found for $version."
            }
        } else {
            Write-Warning "macOS $version not indexed: expected a .dmg installer and signed updater archive in mac/$version."
        }

        if ($releaseIndex[$version].ContainsKey('ubu')) {
            $asset = Get-PreferredSignedUpdateAsset -SignedAssets @($releaseIndex[$version]['ubu'].SignedAssets) -FilePatterns @(
                '(?i)\.AppImage$',             # Tauri v2: *.AppImage + *.AppImage.sig
                '(?i)\.AppImage\.tar\.gz$'    # Tauri v1-compatible: *.AppImage.tar.gz + .sig
            )
            if ($asset) {
                $platforms['linux-x86_64'] = ConvertTo-UpdateAsset -SignedAsset $asset
            } else {
                Write-Warning "No supported signed Linux updater package found for $version (expected .AppImage.sig or .AppImage.tar.gz.sig)."
            }
        } else {
            Write-Warning "Linux $version not indexed: expected a signed package and a .deb or .AppImage installer in ubu/$version."
        }

        if ($platforms.Count -eq 0) { continue }

        $missingPlatforms = @($expectedUpdatePlatforms | Where-Object { -not $platforms.Contains($_) })
        if ($missingPlatforms.Count -gt 0) {
            Write-Warning ("Update manifest for {0} is missing: {1}. Check the CDN version folders for signed updater assets (.sig + matching package); Azure code-signing alone does not produce Tauri .sig files." -f $version, ($missingPlatforms -join ', '))
        }

        $updateManifest = [ordered]@{
            version   = $version
            notes     = (Get-Content -LiteralPath $apps.versions[$version] -Raw).Trim()
            pub_date  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
            platforms = $platforms
        }

        $updateManifest | ConvertTo-Json -Depth 6 |
            Set-Content -LiteralPath $updateJsonPath -Encoding UTF8
        Write-Host ("Created {0} for signed version {1} with platforms: {2}" -f $updateJsonPath, $version, ($platforms.Keys -join ', '))
        $manifestWritten = $true
        break
    }

    if (-not $manifestWritten) {
        # Avoid leaving an old updater manifest pointing at a release that
        # is no longer represented by the catalog.
        if (Test-Path -LiteralPath $updateJsonPath) {
            Remove-Item -LiteralPath $updateJsonPath
        }
        Write-Warning 'No cataloged release contains a signed updater package; update.json not generated.'
    }

    $apps | ConvertTo-Json -Depth 6 |
        Set-Content -LiteralPath $appsJsonPath -Encoding UTF8
    Write-Host "Created $appsJsonPath with $($apps.versions.Count) signed release(s)."
}
finally {
    Pop-Location
}
