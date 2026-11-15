# Builds cdn/webui/components.json, the list of components webui-components shows, from the docs pages in
# cdn/d/content/components. Each page's file name is the component's name, so a component without a docs page
# is not listed.
Set-Location $PSScriptRoot
Set-Location ../cdn

# Documented, but kept off the list. webui-fa was removed from it in 71f83fff5.
$exclude = @('webui-fa')

$names = Get-ChildItem -Path ./d/content/components -File -Filter *.md |
Select-Object -ExpandProperty BaseName |
Where-Object { $exclude -notcontains $_ } |
Sort-Object -Unique

$names |
ConvertTo-Json -Depth 3 |
Set-Content -Path ./webui/components.json -Encoding UTF8
