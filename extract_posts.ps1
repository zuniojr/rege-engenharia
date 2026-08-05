$content = Get-Content "src\data\blogPosts.js" -Raw -Encoding UTF8

$pattern = "slug:\s*\u2018([^\u2019]+)\u2019"
$slugMatches = [regex]::Matches($content, $pattern)

$pattern2 = "title:\s*\u2018([^\u2019]+)\u2019"
$titleMatches = [regex]::Matches($content, $pattern2)

$pattern3 = "image:\s*\u2018([^\u2019]+)\u2019"
$imageMatches = [regex]::Matches($content, $pattern3)

Write-Host "Slugs: $($slugMatches.Count), Titles: $($titleMatches.Count), Images: $($imageMatches.Count)"

$csv = @()
$csv += "URL,Imagem,Titulo"

for ($i = 0; $i -lt $slugMatches.Count; $i++) {
    $slug = $slugMatches[$i].Groups[1].Value
    $url = "https://www.regeengenharia.com.br/blog/$slug"
    $title = if ($i -lt $titleMatches.Count) { $titleMatches[$i].Groups[1].Value } else { "" }
    $image = if ($i -lt $imageMatches.Count) { $imageMatches[$i].Groups[1].Value } else { "" }
    $csv += "$url,$image,$title"
}

$csv | Out-File -FilePath "artigos_blog.csv" -Encoding UTF8
Write-Host "Arquivo artigos_blog.csv gerado com sucesso!"
