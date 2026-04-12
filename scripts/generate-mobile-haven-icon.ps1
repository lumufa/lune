param(
  [string]$OutputDir = "C:\women_period\apps\mobile\assets\images",
  [string]$DistDir = "C:\women_period\dist"
)

Add-Type -AssemblyName System.Drawing

function New-Color {
  param(
    [string]$Hex,
    [int]$Alpha = 255
  )

  $value = $Hex.TrimStart("#")
  return [System.Drawing.Color]::FromArgb(
    $Alpha,
    [Convert]::ToInt32($value.Substring(0, 2), 16),
    [Convert]::ToInt32($value.Substring(2, 2), 16),
    [Convert]::ToInt32($value.Substring(4, 2), 16)
  )
}

function New-RectF {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height
  )

  return New-Object System.Drawing.RectangleF($X, $Y, $Width, $Height)
}

function Set-HighQuality {
  param([System.Drawing.Graphics]$Graphics)

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
}

function Fill-EllipseGradient {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect,
    [System.Drawing.Color]$StartColor,
    [System.Drawing.Color]$EndColor,
    [float]$Angle
  )

  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($Rect, $StartColor, $EndColor, $Angle)
  $Graphics.FillEllipse($brush, $Rect)
  $brush.Dispose()
}

function Fill-EllipseRadial {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect,
    [System.Drawing.Color]$CenterColor,
    [System.Drawing.Color]$EdgeColor
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($Rect)
  $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
  $brush.CenterColor = $CenterColor
  $brush.SurroundColors = [System.Drawing.Color[]]@($EdgeColor)
  $Graphics.FillEllipse($brush, $Rect)
  $brush.Dispose()
  $path.Dispose()
}

function Draw-SoftEllipseShadow {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect,
    [string]$Hex,
    [float]$OffsetX,
    [float]$OffsetY,
    [float]$Spread,
    [int]$Steps,
    [int]$MaxAlpha
  )

  for ($index = $Steps; $index -ge 1; $index--) {
    $inflate = $Spread * ($index / $Steps)
    $alpha = [Math]::Max(3, [int]($MaxAlpha * [Math]::Pow($index / $Steps, 2)))
    $shadowRect = New-RectF (
      $Rect.X - $inflate + $OffsetX
    ) (
      $Rect.Y - $inflate + $OffsetY
    ) (
      $Rect.Width + ($inflate * 2)
    ) (
      $Rect.Height + ($inflate * 2)
    )

    $brush = New-Object System.Drawing.SolidBrush((New-Color $Hex $alpha))
    $Graphics.FillEllipse($brush, $shadowRect)
    $brush.Dispose()
  }
}

function Draw-LuneMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Size
  )

  $white = New-Color "#FFFFFF"
  $ringStart = New-Color "#F6B0BF"
  $ringEnd = New-Color "#EC8FA6"
  $plateCenter = New-Color "#FFFFFF"
  $plateEdge = New-Color "#FCF0F4"
  $plateShadowHex = "#EBA1B3"
  $plateStroke = New-Color "#F5CDD7" 110
  $discStart = New-Color "#F29AAE"
  $discEnd = New-Color "#EA879F"
  $symbolShadowHex = "#F09CAF"

  $outerRect = New-RectF ($X + $Size * 0.07) ($Y + $Size * 0.07) ($Size * 0.86) ($Size * 0.86)
  Fill-EllipseGradient $Graphics $outerRect $ringStart $ringEnd 22

  $plateRect = New-RectF ($X + $Size * 0.185) ($Y + $Size * 0.185) ($Size * 0.63) ($Size * 0.63)
  Draw-SoftEllipseShadow $Graphics $plateRect $plateShadowHex ($Size * 0.006) ($Size * 0.016) ($Size * 0.024) 7 16
  Fill-EllipseRadial $Graphics $plateRect $plateCenter $plateEdge

  $plateStrokePen = [System.Drawing.Pen]::new($plateStroke, [single]($Size * 0.010))
  $plateStrokePen.Alignment = [System.Drawing.Drawing2D.PenAlignment]::Inset
  $Graphics.DrawEllipse($plateStrokePen, $plateRect)
  $plateStrokePen.Dispose()

  $centerX = $X + ($Size * 0.50)
  $circleCenterY = $Y + ($Size * 0.43)
  $circleDiameter = $Size * 0.345
  $strokeWidth = $Size * 0.066
  $circleRect = New-RectF (
    $centerX - ($circleDiameter / 2)
  ) (
    $circleCenterY - ($circleDiameter / 2)
  ) (
    $circleDiameter
  ) (
    $circleDiameter
  )

  $stemTop = $circleRect.Y + $circleRect.Height - ($strokeWidth * 0.14)
  $stemBottom = $Y + ($Size * 0.90)
  $crossY = $Y + ($Size * 0.79)
  $crossLeft = $X + ($Size * 0.41)
  $crossRight = $X + ($Size * 0.59)
  $shadowOffset = $Size * 0.009

  for ($index = 6; $index -ge 1; $index--) {
    $alpha = [Math]::Max(4, [int](18 * [Math]::Pow($index / 6, 2)))
    $penWidth = $strokeWidth + ($Size * 0.010 * $index)
    $shadowPen = [System.Drawing.Pen]::new((New-Color $symbolShadowHex $alpha), [single]$penWidth)
    $shadowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $shadowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $shadowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $Graphics.DrawEllipse($shadowPen, (New-RectF ($circleRect.X) ($circleRect.Y + $shadowOffset) ($circleRect.Width) ($circleRect.Height)))
    $Graphics.DrawLine($shadowPen, $centerX, $stemTop + $shadowOffset, $centerX, $stemBottom + $shadowOffset)
    $Graphics.DrawLine($shadowPen, $crossLeft, $crossY + $shadowOffset, $crossRight, $crossY + $shadowOffset)
    $shadowPen.Dispose()
  }

  $symbolPen = [System.Drawing.Pen]::new($white, [single]$strokeWidth)
  $symbolPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $symbolPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $symbolPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $Graphics.DrawEllipse($symbolPen, $circleRect)
  $Graphics.DrawLine($symbolPen, $centerX, $stemTop, $centerX, $stemBottom)
  $Graphics.DrawLine($symbolPen, $crossLeft, $crossY, $crossRight, $crossY)
  $symbolPen.Dispose()

  $discDiameter = $Size * 0.238
  $discRect = New-RectF (
    $centerX - ($discDiameter / 2)
  ) (
    $circleCenterY - ($discDiameter / 2)
  ) (
    $discDiameter
  ) (
    $discDiameter
  )
  Draw-SoftEllipseShadow $Graphics $discRect "#E98DA4" ($Size * 0.003) ($Size * 0.008) ($Size * 0.010) 4 10
  Fill-EllipseGradient $Graphics $discRect $discStart $discEnd 32

  $crescentOuter = New-RectF (
    $discRect.X + ($discRect.Width * 0.53)
  ) (
    $discRect.Y + ($discRect.Height * 0.10)
  ) (
    $discRect.Width * 0.34
  ) (
    $discRect.Height * 0.79
  )
  $crescentCut = New-RectF (
    $discRect.X + ($discRect.Width * 0.45)
  ) (
    $discRect.Y + ($discRect.Height * 0.14)
  ) (
    $discRect.Width * 0.31
  ) (
    $discRect.Height * 0.73
  )

  $whiteBrush = New-Object System.Drawing.SolidBrush($white)
  $discBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($discRect, $discStart, $discEnd, 32)
  $Graphics.FillEllipse($whiteBrush, $crescentOuter)
  $Graphics.FillEllipse($discBrush, $crescentCut)
  $discBrush.Dispose()
  $whiteBrush.Dispose()
}

function New-AppStoreBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-HighQuality $graphics
  $graphics.Clear((New-Color "#FFFFFF"))
  Draw-LuneMark $graphics 0 0 $Size
  $graphics.Dispose()
  return $bitmap
}

function New-PureRoundBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-HighQuality $graphics
  $graphics.Clear([System.Drawing.Color]::Transparent)
  Draw-LuneMark $graphics 0 0 $Size
  $graphics.Dispose()
  return $bitmap
}

function New-AdaptiveForegroundBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-HighQuality $graphics
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $markSize = $Size * 0.76
  $offset = ($Size - $markSize) / 2
  Draw-LuneMark $graphics $offset $offset $markSize
  $graphics.Dispose()
  return $bitmap
}

function New-AdaptiveBackgroundBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-HighQuality $graphics
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.Dispose()
  return $bitmap
}

function New-MonochromeBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-HighQuality $graphics
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $black = New-Color "#111111"
  $strokeWidth = $Size * 0.064
  $centerX = $Size * 0.50
  $circleCenterY = $Size * 0.43
  $circleDiameter = $Size * 0.345
  $circleRect = New-RectF (
    $centerX - ($circleDiameter / 2)
  ) (
    $circleCenterY - ($circleDiameter / 2)
  ) (
    $circleDiameter
  ) (
    $circleDiameter
  )

  $stemTop = $circleRect.Y + $circleRect.Height - ($strokeWidth * 0.14)
  $stemBottom = $Size * 0.90
  $crossY = $Size * 0.79
  $crossLeft = $Size * 0.41
  $crossRight = $Size * 0.59

  $symbolPen = [System.Drawing.Pen]::new($black, [single]$strokeWidth)
  $symbolPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $symbolPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $symbolPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $graphics.DrawEllipse($symbolPen, $circleRect)
  $graphics.DrawLine($symbolPen, $centerX, $stemTop, $centerX, $stemBottom)
  $graphics.DrawLine($symbolPen, $crossLeft, $crossY, $crossRight, $crossY)
  $symbolPen.Dispose()

  $outerPen = [System.Drawing.Pen]::new($black, [single]($Size * 0.058))
  $outerPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $outerRect = New-RectF ($Size * 0.16) ($Size * 0.16) ($Size * 0.68) ($Size * 0.68)
  $graphics.DrawEllipse($outerPen, $outerRect)
  $outerPen.Dispose()

  $graphics.Dispose()
  return $bitmap
}

function Save-Bitmap {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Bitmap.Dispose()
}

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

if (-not (Test-Path $DistDir)) {
  New-Item -ItemType Directory -Path $DistDir | Out-Null
}

Save-Bitmap (New-AppStoreBitmap -Size 1024) (Join-Path $OutputDir "haven-icon.png")
Save-Bitmap (New-AppStoreBitmap -Size 1024) (Join-Path $OutputDir "haven-splash-icon.png")
Save-Bitmap (New-AdaptiveForegroundBitmap -Size 512) (Join-Path $OutputDir "haven-android-icon-foreground.png")
Save-Bitmap (New-AdaptiveBackgroundBitmap -Size 512) (Join-Path $OutputDir "haven-android-icon-background.png")
Save-Bitmap (New-MonochromeBitmap -Size 432) (Join-Path $OutputDir "haven-android-icon-monochrome.png")
Save-Bitmap (New-AppStoreBitmap -Size 48) (Join-Path $OutputDir "haven-favicon.png")

Save-Bitmap (New-AppStoreBitmap -Size 1024) (Join-Path $DistDir "lune-app-store-icon-1024.png")
Save-Bitmap (New-PureRoundBitmap -Size 1024) (Join-Path $DistDir "lune-round-avatar-1024.png")
