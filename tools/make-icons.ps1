# DRM Check icon: a padlock with a magnifying glass, pink on dark. Writes extension/icons/icon-{16,32,48,128}.png and store/icon-512.png
param([string]$Root = (Join-Path $PSScriptRoot '..'))
Add-Type -AssemblyName System.Drawing

function RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90); $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90); $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure(); return $p
}

$S = 512
$bmp = New-Object System.Drawing.Bitmap $S, $S
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([System.Drawing.Color]::Transparent)

$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point 512, 512), ([System.Drawing.Color]::FromArgb(255, 44, 24, 52)), ([System.Drawing.Color]::FromArgb(255, 16, 18, 30))
$g.FillPath($bg, (RoundRect 16 16 480 480 104))

$pink = [System.Drawing.Color]::FromArgb(255, 224, 69, 155)
$light = [System.Drawing.Color]::FromArgb(255, 251, 227, 241)
# shackle
$pen = New-Object System.Drawing.Pen $pink, 34
$g.DrawArc($pen, 146, 92, 160, 170, 180, 180)
$g.DrawLine($pen, 146, 177, 146, 240); $g.DrawLine($pen, 306, 177, 306, 240)
# body
$g.FillPath((New-Object System.Drawing.SolidBrush $pink), (RoundRect 104 220 244 200 30))
# keyhole
$dark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 44, 24, 52))
$g.FillEllipse($dark, 204, 282, 44, 44)
$g.FillRectangle($dark, 216, 310, 20, 52)
# magnifier
$ring = New-Object System.Drawing.Pen $light, 30
$g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 18, 30))), 276, 262, 168, 168)
$g.DrawEllipse($ring, 296, 282, 128, 128)
$handle = New-Object System.Drawing.Pen $light, 40
$handle.StartCap = 'Round'; $handle.EndCap = 'Round'
$g.DrawLine($handle, 404, 392, 452, 440)
$g.Dispose()

New-Item -ItemType Directory -Force (Join-Path $Root 'extension\icons'), (Join-Path $Root 'store') | Out-Null
foreach ($size in 16, 32, 48, 128) {
  $out = New-Object System.Drawing.Bitmap $size, $size
  $gg = [System.Drawing.Graphics]::FromImage($out)
  $gg.InterpolationMode = 'HighQualityBicubic'; $gg.SmoothingMode = 'AntiAlias'; $gg.PixelOffsetMode = 'HighQuality'
  $gg.DrawImage($bmp, 0, 0, $size, $size); $gg.Dispose()
  $out.Save((Join-Path $Root "extension\icons\icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}
$bmp.Save((Join-Path $Root 'store\icon-512.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
'icons written'
