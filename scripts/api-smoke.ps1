$ErrorActionPreference = "Stop"

function Get-EnvMap {
  param([string]$Path = ".env")

  if (-not (Test-Path $Path)) {
    throw ".env não encontrado em $Path"
  }

  $map = @{}
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^(VITE_API_URL|VITE_API_USER|VITE_API_PASSWORD)=(.*)$') {
      $map[$matches[1]] = $matches[2]
    }
  }

  foreach ($key in @("VITE_API_URL", "VITE_API_USER", "VITE_API_PASSWORD")) {
    if (-not $map[$key]) {
      throw "Variável ausente no .env: $key"
    }
  }

  return $map
}

function New-ApiContext {
  $envMap = Get-EnvMap
  $apiBase = $envMap["VITE_API_URL"].TrimEnd("/")
  if (-not $apiBase.EndsWith("/api")) {
    $apiBase = "$apiBase/api"
  }

  $tokenBytes = [Text.Encoding]::ASCII.GetBytes(
    $envMap["VITE_API_USER"] + ":" + $envMap["VITE_API_PASSWORD"]
  )

  return @{
    BaseUrl = $apiBase
    Headers = @{
      Authorization = "Basic " + [Convert]::ToBase64String($tokenBytes)
      "Content-Type" = "application/json"
    }
  }
}

function Invoke-Api {
  param(
    [hashtable]$Context,
    [string]$Path,
    [object]$Body
  )

  $json = $Body | ConvertTo-Json -Depth 20 -Compress
  return Invoke-RestMethod -Uri ($Context.BaseUrl + $Path) -Method Post -Headers $Context.Headers -Body $json
}

function Get-Collection {
  param(
    [hashtable]$Context,
    [string]$AssetType
  )

  $response = Invoke-Api $Context "/query/search" @{
    query = @{
      selector = @{
        "@assetType" = $AssetType
      }
    }
  }

  if ($response -is [System.Array]) { return $response }
  if ($response.result) { return $response.result }
  if ($response.docs) { return $response.docs }
  if ($response.items) { return $response.items }
  if ($response.data) { return $response.data }
  return @()
}

function Find-Asset {
  param(
    [System.Collections.IEnumerable]$Items,
    [string]$Key
  )

  foreach ($item in $Items) {
    if ($item."@key" -eq $Key) {
      return $item
    }
  }

  return $null
}

$ctx = New-ApiContext
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$results = @()

$tvShows = @(Get-Collection $ctx "tvShows")
if ($tvShows.Count -eq 0) {
  throw "Nenhum tvShow encontrado para vincular os testes."
}

$baseShow = $tvShows[0]
$showKey = $baseShow."@key"

$watchlistTitle = "Smoke Watchlist $stamp"
$watchlistUpdatedTitle = "Smoke Watchlist Updated $stamp"
$watchlistKey = $null

$seasonNumber = [int](6000 + ($stamp % 1000))
$seasonYear = 2099
$seasonKey = $null

$episodeNumber = [int](7000 + ($stamp % 1000))
$episodeTitle = "Smoke Episode $stamp"
$episodeUpdatedTitle = "Smoke Episode Updated $stamp"
$episodeDate = "2099-01-01T00:00:00Z"
$episodeKey = $null

try {
  $watchlistCreate = Invoke-Api $ctx "/invoke/createAsset" @{
    asset = @(
      @{
        "@assetType" = "watchlist"
        title = $watchlistTitle
      }
    )
  }
  $watchlists = @(Get-Collection $ctx "watchlist")
  $createdWatchlist = $watchlists | Where-Object { $_.title -eq $watchlistTitle -or $_.name -eq $watchlistTitle } | Select-Object -First 1
  if (-not $createdWatchlist) { throw "Watchlist criada, mas não encontrada na busca." }
  $watchlistKey = $createdWatchlist."@key"
  $results += [pscustomobject]@{ Entity = "watchlist"; Operation = "create/search"; Status = "ok"; Detail = $watchlistKey }

  Invoke-Api $ctx "/invoke/updateAsset" @{
    key = @{
      "@assetType" = "watchlist"
      "@key" = $watchlistKey
    }
    update = @{
      "@assetType" = "watchlist"
      "@key" = $watchlistKey
      title = $watchlistUpdatedTitle
    }
  } | Out-Null

  $watchlistsAfterUpdate = @(Get-Collection $ctx "watchlist")
  $updatedWatchlist = Find-Asset $watchlistsAfterUpdate $watchlistKey
  if (-not $updatedWatchlist) { throw "Watchlist atualizada não encontrada." }
  $updatedWatchlistTitle = if ($updatedWatchlist.title) { $updatedWatchlist.title } else { $updatedWatchlist.name }
  $results += [pscustomobject]@{ Entity = "watchlist"; Operation = "update"; Status = "ok"; Detail = $updatedWatchlistTitle }

  Invoke-Api $ctx "/invoke/createAsset" @{
    asset = @(
      @{
        "@assetType" = "seasons"
        number = $seasonNumber
        year = $seasonYear
        tvShow = @{
          "@assetType" = "tvShows"
          "@key" = $showKey
        }
      }
    )
  } | Out-Null

  $seasons = @(Get-Collection $ctx "seasons")
  $createdSeason = $seasons | Where-Object {
    $_.number -eq $seasonNumber -or $_.seasonNumber -eq $seasonNumber
  } | Where-Object {
    ($_.tvShow."@key" -eq $showKey) -or ($_.tvShowId -eq $showKey)
  } | Select-Object -First 1
  if (-not $createdSeason) { throw "Temporada criada, mas não encontrada na busca." }
  $seasonKey = $createdSeason."@key"
  $results += [pscustomobject]@{ Entity = "seasons"; Operation = "create/search"; Status = "ok"; Detail = $seasonKey }

  Invoke-Api $ctx "/invoke/updateAsset" @{
    key = @{
      "@assetType" = "seasons"
      "@key" = $seasonKey
    }
    update = @{
      "@assetType" = "seasons"
      "@key" = $seasonKey
      number = ($seasonNumber + 1)
      year = $seasonYear
      tvShow = @{
        "@assetType" = "tvShows"
        "@key" = $showKey
      }
    }
  } | Out-Null
  $seasonNumber = $seasonNumber + 1
  $results += [pscustomobject]@{ Entity = "seasons"; Operation = "update"; Status = "ok"; Detail = $seasonNumber }

  Invoke-Api $ctx "/invoke/createAsset" @{
    asset = @(
      @{
        "@assetType" = "episodes"
        title = $episodeTitle
        episodeNumber = $episodeNumber
        releaseDate = $episodeDate
        description = "Smoke test episode"
        season = @{
          "@assetType" = "seasons"
          "@key" = $seasonKey
        }
      }
    )
  } | Out-Null

  $episodes = @(Get-Collection $ctx "episodes")
  $createdEpisode = $episodes | Where-Object {
    ($_.number -eq $episodeNumber -or $_.episodeNumber -eq $episodeNumber) -and
    (($_.season."@key" -eq $seasonKey) -or ($_.seasonId -eq $seasonKey))
  } | Select-Object -First 1
  if (-not $createdEpisode) { throw "Episódio criado, mas não encontrado na busca." }
  $episodeKey = $createdEpisode."@key"
  $results += [pscustomobject]@{ Entity = "episodes"; Operation = "create/search"; Status = "ok"; Detail = $episodeKey }

  Invoke-Api $ctx "/invoke/updateAsset" @{
    key = @{
      "@assetType" = "episodes"
      "@key" = $episodeKey
    }
    update = @{
      "@assetType" = "episodes"
      "@key" = $episodeKey
      title = $episodeUpdatedTitle
      episodeNumber = $episodeNumber
      releaseDate = $episodeDate
      description = "Smoke test episode updated"
      season = @{
        "@assetType" = "seasons"
        "@key" = $seasonKey
      }
    }
  } | Out-Null
  $results += [pscustomobject]@{ Entity = "episodes"; Operation = "update"; Status = "ok"; Detail = $episodeUpdatedTitle }
}
finally {
  if ($episodeKey) {
    try {
      Invoke-Api $ctx "/invoke/deleteAsset" @{
        key = @{
          "@assetType" = "episodes"
          "@key" = $episodeKey
        }
      } | Out-Null
      $results += [pscustomobject]@{ Entity = "episodes"; Operation = "delete"; Status = "ok"; Detail = $episodeKey }
    } catch {
      $results += [pscustomobject]@{ Entity = "episodes"; Operation = "delete"; Status = "error"; Detail = $_.Exception.Message }
    }
  }

  if ($seasonKey) {
    try {
      Invoke-Api $ctx "/invoke/deleteAsset" @{
        key = @{
          "@assetType" = "seasons"
          "@key" = $seasonKey
        }
      } | Out-Null
      $results += [pscustomobject]@{ Entity = "seasons"; Operation = "delete"; Status = "ok"; Detail = $seasonKey }
    } catch {
      $results += [pscustomobject]@{ Entity = "seasons"; Operation = "delete"; Status = "error"; Detail = $_.Exception.Message }
    }
  }

  if ($watchlistKey) {
    try {
      Invoke-Api $ctx "/invoke/deleteAsset" @{
        key = @{
          "@assetType" = "watchlist"
          "@key" = $watchlistKey
        }
      } | Out-Null
      $results += [pscustomobject]@{ Entity = "watchlist"; Operation = "delete"; Status = "ok"; Detail = $watchlistKey }
    } catch {
      $results += [pscustomobject]@{ Entity = "watchlist"; Operation = "delete"; Status = "error"; Detail = $_.Exception.Message }
    }
  }
}

$results | ConvertTo-Json -Depth 10
