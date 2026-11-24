# Store images for Microsoft Edge Add-ons: 300x300 logo and 440x280 small promotional tile.
param([string]$Root = (Join-Path $PSScriptRoot '..'))
Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Image]::FromFile((Join-Path $Root 'store\icon-512.png'))
$out = Join-Path $Root 'store\edge'
New-Item -ItemType Directory -Force $out | Out-Null

function New-Canvas([int]$w, [int]$h) {
  $b = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.TextRenderingHint = 'AntiAliasGridFit'
  return @($b, $g)
}

# Logo 300x300
$b, $g = New-Canvas 300 300
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($icon, 0, 0, 300, 300)
$b.Save((Join-Path $out 'logo-300.png'), [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose()

# Small promotional tile 440x280
$b, $g = New-Canvas 440 280
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 440, 280), ([System.Drawing.Color]::FromArgb(255, 44, 24, 52)), ([System.Drawing.Color]::FromArgb(255, 15, 25, 38))
$g.FillRectangle($bg, 0, 0, 440, 280)
$g.DrawImage($icon, 28, 70, 140, 140)
$white = [System.Drawing.Brushes]::White
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 199, 213, 224))
$f1 = New-Object System.Drawing.Font 'Segoe UI Semibold', 24
$f2 = New-Object System.Drawing.Font 'Segoe UI', 12
$g.DrawString('DRM Check', $f1, $white, 186, 86)
$g.DrawString('Steam: DRM, anti-cheat,', $f2, $muted, 189, 130)
$g.DrawString('online, AI, GOG', $f2, $muted, 189, 152)
$b.Save((Join-Path $out 'promo-440x280.png'), [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose()
$icon.Dispose()
'store images written'
