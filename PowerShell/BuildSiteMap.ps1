$domain = "https://cdn.myfi.ws"

$urls = [System.Collections.ArrayList]@();

$appsettings = Get-Content "cdn/nav.json" -Raw | ConvertFrom-Json

if ($appsettings.Length -eq 0) {
	throw "cdn/nav.json file not found";
}

function ProcessNode {
	param (
		[Parameter(Mandatory = $true)]
		[PSObject]$Node
	)

	$role = 0;

	if ($Node.role) {
		$role = $Node.role
	}

	if ($role -gt 0) { return; }

	if ($Node.url) {
		$item = @{url = $Node.url }
		$urls.Add($item) | Out-Null
	}

	# Check if the node has children
	if ($Node.children) {
		# Recursively process each child node
		foreach ($child in $Node.children) {
			ProcessNode -Node $child
		}
	}
}

foreach ($node in $appsettings) {
	ProcessNode -Node $node
}

function buildSitemap {
	begin {
		'<?xml version="1.0" encoding="utf-8" ?>'
		'<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">'
	}

	process {
		'	<url>'
		"		<loc>$($domain)$($_.url)</loc>"
		"		<lastmod>{0:yyyy-MM-dd}</lastmod>" -f (Get-Date).Date
		'	</url>'
	}

	end {
		"</urlset>"
	}
}


$urls | buildSitemap | Out-File cdn/sitemap.xml -Encoding ascii
Write-Host "Sitemap Updated!"
