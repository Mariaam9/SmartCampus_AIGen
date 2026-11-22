# SmartCampus AI - Test automatique des APIs Catalogue
# Utilise curl.exe et des enregistrements temporaires TEST_CURL_.
# Les donnees preexistantes ne sont jamais modifiees.
# Lancer depuis PowerShell, dans le dossier backend :
# powershell -ExecutionPolicy Bypass -File .\test-complet-api.ps1

$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:3000/api"
$ReportDir = Join-Path $PSScriptRoot "rapports-tests-api"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$TxtReport = Join-Path $ReportDir "rapport_tests_api_$Stamp.txt"
$CsvReport = Join-Path $ReportDir "rapport_tests_api_$Stamp.csv"

New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

$Results = New-Object System.Collections.Generic.List[object]
$CreatedIds = @{
    formations = $null
    specialites = $null
    programmes = $null
    matieres = $null
    "conditions-admission" = $null
    prerequis = $null
    tarifs = $null
}
$AssociationCreated = $false
$ProgrammeId = $null
$MatiereId = $null
$FatalError = $null
$remainingIds = @()

function Add-Result {
    param(
        [string]$Test,
        [string]$Method,
        [string]$Path,
        [int]$Expected,
        [int]$Actual,
        [string]$Details = ""
    )

    $ok = ($Expected -eq $Actual)
    $state = if ($ok) { "PASS" } else { "FAIL" }

    $Results.Add([pscustomobject]@{
        Resultat = $state
        Test = $Test
        Methode = $Method
        Endpoint = $Path
        Attendu = $Expected
        Recu = $Actual
        Details = $Details
    }) | Out-Null

    $color = if ($ok) { "Green" } else { "Red" }
    Write-Host ("[{0}] {1} - {2} {3} (attendu {4}, reçu {5})" -f $state, $Test, $Method, $Path, $Expected, $Actual) -ForegroundColor $color
    return $ok
}

function Invoke-CurlApi {
    param(
        [Parameter(Mandatory=$true)][string]$Method,
        [Parameter(Mandatory=$true)][string]$Path,
        [object]$Payload = $null
    )

    $url = "$BaseUrl$Path"
    $tempJsonFile = $null
    $rawOutput = @()
    $curlExit = -1

    $curlArgs = @(
        "-sS",
        "--max-time", "30",
        "-X", $Method,
        $url,
        "-w", "`n%{http_code}"
    )

    if ($null -ne $Payload) {
        # Convertir le body en JSON puis l'ecrire dans un fichier UTF-8 sans BOM.
        # Cela evite les problemes de guillemets de PowerShell avec curl.exe.
        $json = ConvertTo-Json -InputObject $Payload -Depth 10 -Compress
        $tempJsonFile = Join-Path ([System.IO.Path]::GetTempPath()) (
            "smartcampus_" + [guid]::NewGuid().ToString("N") + ".json"
        )

        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($tempJsonFile, $json, $utf8NoBom)

        $curlArgs += @(
            "-H", "Content-Type: application/json; charset=utf-8",
            "--data-binary", "@$tempJsonFile"
        )
    }

    try {
        $rawOutput = & curl.exe @curlArgs 2>&1
        $curlExit = $LASTEXITCODE
    }
    finally {
        if ($null -ne $tempJsonFile -and (Test-Path -LiteralPath $tempJsonFile)) {
            Remove-Item -LiteralPath $tempJsonFile -Force
        }
    }

    $raw = ($rawOutput | Out-String).TrimEnd()
    $status = 0
    $bodyText = $raw
    $lastNewline = $raw.LastIndexOf("`n")

    if ($lastNewline -ge 0) {
        $statusText = $raw.Substring($lastNewline + 1).Trim()
        if ($statusText -match '^\d{3}$') {
            $status = [int]$statusText
            $bodyText = $raw.Substring(0, $lastNewline).Trim()
        }
    }

    $body = $null
    if ($bodyText) {
        try {
            $body = $bodyText | ConvertFrom-Json -ErrorAction Stop
        }
        catch {
            $body = $bodyText
        }
    }

    return [pscustomobject]@{
        StatusCode = $status
        Body = $body
        Raw = $bodyText
        CurlExitCode = $curlExit
    }
}

function Assert-Status {
    param(
        [string]$Test,
        [string]$Method,
        [string]$Path,
        [int]$Expected,
        [object]$Payload = $null
    )

    $response = Invoke-CurlApi -Method $Method -Path $Path -Payload $Payload
    $details = ""

    if ($response.CurlExitCode -ne 0 -and $response.StatusCode -eq 0) {
        $details = "curl.exe (code $($response.CurlExitCode)): $($response.Raw)"
    }
    elseif ($null -ne $response.Body) {
        if ($response.Body -is [string]) {
            $details = $response.Body
        }
        else {
            $details = ConvertTo-Json -InputObject $response.Body -Depth 10 -Compress
        }
    }

    $ok = Add-Result -Test $Test -Method $Method -Path $Path -Expected $Expected -Actual $response.StatusCode -Details $details

    if (-not $ok) {
        throw "Echec du test '$Test' : HTTP $($response.StatusCode), attendu $Expected. $details"
    }

    return $response
}

function New-TrackedResource {
    param(
        [string]$Resource,
        [hashtable]$Payload
    )

    $response = Assert-Status -Test "POST création temporaire $Resource" -Method "POST" -Path "/gestion/$Resource" -Expected 201 -Payload $Payload

    if ($null -eq $response.Body.id) {
        throw "La réponse POST de $Resource ne contient pas d'identifiant."
    }

    $id = [int]$response.Body.id
    $CreatedIds[$Resource] = $id
    Write-Host "    ID temporaire $Resource = $id" -ForegroundColor Cyan
    return $id
}

function Test-ResourceRead {
    param(
        [string]$Resource,
        [int]$Id
    )

    $listResponse = Assert-Status -Test "GET liste gestion $Resource" -Method "GET" -Path "/gestion/$Resource" -Expected 200

    if ($null -eq $listResponse.Body.data) {
        throw "La réponse GET liste de $Resource ne contient pas la propriété data."
    }

    Assert-Status -Test "GET détail gestion $Resource" -Method "GET" -Path "/gestion/$Resource/$Id" -Expected 200 | Out-Null
    Assert-Status -Test "GET détail public $Resource" -Method "GET" -Path "/$Resource/$Id" -Expected 200 | Out-Null

   $publicList = Assert-Status -Test "GET liste publique $Resource" -Method "GET" -Path "/$Resource`?limit=100" -Expected 200
    $found = @($publicList.Body.data | Where-Object { [int]$_.id -eq $Id }).Count -gt 0
    $actual = if ($found) { 200 } else { 404 }

    $ok = Add-Result -Test "Visibilité publique de l'enregistrement $Resource" -Method "GET" -Path "/$Resource" -Expected 200 -Actual $actual -Details "ID temporaire $Id"
    if (-not $ok) {
        throw "L'enregistrement temporaire $Resource/$Id n'apparait pas dans la liste publique."
    }
}

function Test-PatchAndRestore {
    param(
        [string]$Resource,
        [int]$Id,
        [string]$Field,
        [string]$OriginalValue,
        [string]$ChangedValue
    )

    $patchBody = @{}
    $patchBody[$Field] = $ChangedValue

    $updated = Assert-Status -Test "PATCH modification $Resource" -Method "PATCH" -Path "/gestion/$Resource/$Id" -Expected 200 -Payload $patchBody
    $updatedValue = [string]$updated.Body.$Field
    $actual = if ($updatedValue -eq $ChangedValue) { 200 } else { 500 }

    $ok = Add-Result -Test "Vérification PATCH $Resource" -Method "GET/PATCH" -Path "/gestion/$Resource/$Id" -Expected 200 -Actual $actual -Details "$Field = $updatedValue"
    if (-not $ok) {
        throw "La modification PATCH de $Resource n'a pas été confirmée."
    }

    $restoreBody = @{}
    $restoreBody[$Field] = $OriginalValue

    $restored = Assert-Status -Test "PATCH restauration $Resource" -Method "PATCH" -Path "/gestion/$Resource/$Id" -Expected 200 -Payload $restoreBody
    $restoredValue = [string]$restored.Body.$Field
    $actualRestore = if ($restoredValue -eq $OriginalValue) { 200 } else { 500 }

    $okRestore = Add-Result -Test "Vérification restauration $Resource" -Method "GET/PATCH" -Path "/gestion/$Resource/$Id" -Expected 200 -Actual $actualRestore -Details "$Field = $restoredValue"
    if (-not $okRestore) {
        throw "La restauration de $Resource n'a pas été confirmée."
    }
}

function Test-EmptyPostRejected {
    param([string]$Resource)

    Assert-Status -Test "Validation POST champs obligatoires $Resource" -Method "POST" -Path "/gestion/$Resource" -Expected 400 -Payload @{} | Out-Null
}

function Delete-TrackedResource {
    param(
        [string]$Resource,
        [int]$Id
    )

    Assert-Status -Test "DELETE suppression temporaire $Resource" -Method "DELETE" -Path "/gestion/$Resource/$Id" -Expected 200 | Out-Null
    $CreatedIds[$Resource] = $null
    Assert-Status -Test "GET après DELETE $Resource" -Method "GET" -Path "/gestion/$Resource/$Id" -Expected 404 | Out-Null
}

function Cleanup-TemporaryData {
    Write-Host "`nNettoyage de sécurité des données temporaires..." -ForegroundColor Yellow

    if ($AssociationCreated -and $null -ne $ProgrammeId -and $null -ne $MatiereId) {
        try {
            $r = Invoke-CurlApi -Method "DELETE" -Path "/gestion/programmes/$ProgrammeId/matieres/$MatiereId"
            if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 404) {
                Write-Host "Association temporaire nettoyée ou déjà supprimée." -ForegroundColor Green
                $script:AssociationCreated = $false
            }
            else {
                Write-Host "ATTENTION : nettoyage association HTTP $($r.StatusCode)" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "ATTENTION : impossible de nettoyer l'association : $_" -ForegroundColor Red
        }
    }

    # Enfants avant parents. Les suppressions en cascade du schema Prisma
    # sont conservees, mais on supprime explicitement les enregistrements crees.
    $cleanupOrder = @(
        "matieres",
        "programmes",
        "specialites",
        "prerequis",
        "conditions-admission",
        "tarifs",
        "formations"
    )

    foreach ($resource in $cleanupOrder) {
        $id = $CreatedIds[$resource]
        if ($null -ne $id) {
            try {
                $r = Invoke-CurlApi -Method "DELETE" -Path "/gestion/$resource/$id"
                if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 404) {
                    $CreatedIds[$resource] = $null
                    Write-Host "Nettoyage $resource ID $id : OK (HTTP $($r.StatusCode))" -ForegroundColor Green
                }
                else {
                    Write-Host "ATTENTION : nettoyage $resource ID $id impossible (HTTP $($r.StatusCode))." -ForegroundColor Red
                }
            }
            catch {
                Write-Host "ATTENTION : erreur nettoyage $resource ID $id : $_" -ForegroundColor Red
            }
        }
    }
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " SMARTCAMPUS AI - TEST AUTOMATIQUE API CATALOGUE" -ForegroundColor Cyan
Write-Host " Base API : $BaseUrl" -ForegroundColor Cyan
Write-Host " Les données TEST_CURL_ seront supprimées à la fin." -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

try {
    # Connexion et lecture seule d'une formation existante pour obtenir l'etablissementId.
    $seedResponse = Assert-Status -Test "Connexion serveur et lecture établissement de référence" -Method "GET" -Path "/gestion/formations?limit=1" -Expected 200
    $firstFormation = @($seedResponse.Body.data | Select-Object -First 1)[0]

    if ($null -eq $firstFormation -or $null -eq $firstFormation.etablissementId) {
        throw "Aucune formation de référence disponible pour identifier un établissement. Aucune donnée n'a été créée."
    }

    $etablissementId = [int]$firstFormation.etablissementId
    Write-Host "Etablissement de référence ID : $etablissementId (lecture seule)" -ForegroundColor Cyan

    $unique = [guid]::NewGuid().ToString("N").Substring(0, 10).ToUpper()
    $prefix = "TEST_CURL_$unique"

    # POST : creation d'une arborescence entierement temporaire.
    $formationId = New-TrackedResource -Resource "formations" -Payload @{
        etablissementId = $etablissementId
        nom = "$prefix-FORMATION"
        description = "$prefix-DESC-INITIALE"
        niveau = "Test"
        duree = "Test"
        statut = "PUBLIE"
    }

    $specialiteId = New-TrackedResource -Resource "specialites" -Payload @{
        formationId = $formationId
        nom = "$prefix-SPECIALITE"
        description = "$prefix-DESC-INITIALE"
    }

    $programmeId = New-TrackedResource -Resource "programmes" -Payload @{
        specialiteId = $specialiteId
        nom = "$prefix-PROGRAMME"
        description = "$prefix-DESC-INITIALE"
        annee = 1
    }
    $ProgrammeId = $programmeId

    $matiereId = New-TrackedResource -Resource "matieres" -Payload @{
        code = "$prefix-CODE"
        nom = "$prefix-MATIERE"
        description = "$prefix-DESC-INITIALE"
        credits = 3
    }
    $MatiereId = $matiereId

    $today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $future = "2099-12-31T23:59:59.000Z"

    $conditionId = New-TrackedResource -Resource "conditions-admission" -Payload @{
        formationId = $formationId
        description = "$prefix-DESC-INITIALE"
        statutPublication = "PUBLIE"
        dateDebutValidite = $today
        dateFinValidite = $future
    }

    $prerequisId = New-TrackedResource -Resource "prerequis" -Payload @{
        formationId = $formationId
        description = "$prefix-DESC-INITIALE"
        niveau = "Test"
    }

    $tarifId = New-TrackedResource -Resource "tarifs" -Payload @{
        formationId = $formationId
        libelle = "$prefix-TARIF"
        montant = 1
        modalitesPaiement = "$prefix-MODALITES-INITIALES"
        statutPublication = "PUBLIE"
        dateDebutValidite = $today
        dateFinValidite = $future
    }

    # Association programme-matiere.
    Assert-Status -Test "POST association Programme-Matière" -Method "POST" -Path "/gestion/programmes/$programmeId/matieres" -Expected 201 -Payload @{
        matiereId = $matiereId
        semestre = 1
        coefficient = 1
    } | Out-Null
    $AssociationCreated = $true

    $associationList = Assert-Status -Test "GET matières du programme" -Method "GET" -Path "/programmes/$programmeId/matieres" -Expected 200
    $associationFound = @($associationList.Body | Where-Object { [int]$_.matiereId -eq $matiereId }).Count -gt 0
    $associationActual = if ($associationFound) { 200 } else { 500 }
    $associationOk = Add-Result -Test "Vérification association Programme-Matière" -Method "GET" -Path "/programmes/$programmeId/matieres" -Expected 200 -Actual $associationActual
    if (-not $associationOk) {
        throw "L'association Programme-Matière n'a pas été retrouvée."
    }

    # GET listes, details et visibilite publique des 7 ressources.
    $resourceIds = @{
        formations = $formationId
        specialites = $specialiteId
        programmes = $programmeId
        matieres = $matiereId
        "conditions-admission" = $conditionId
        prerequis = $prerequisId
        tarifs = $tarifId
    }

    foreach ($resource in @("formations", "specialites", "programmes", "matieres", "conditions-admission", "prerequis", "tarifs")) {
        Test-ResourceRead -Resource $resource -Id ([int]$resourceIds[$resource])
    }

    # Catalogue destine a l'agent IA.
    $agentResponse = Assert-Status -Test "GET catalogue destiné à l'agent IA" -Method "GET" -Path "/agent/catalogue" -Expected 200
    $agentHasFormation = @($agentResponse.Body.formations | Where-Object { [int]$_.id -eq $formationId }).Count -gt 0
    $agentActual = if ($agentHasFormation) { 200 } else { 500 }
    $agentOk = Add-Result -Test "Présence formation temporaire dans catalogue agent" -Method "GET" -Path "/agent/catalogue" -Expected 200 -Actual $agentActual
    if (-not $agentOk) {
        throw "La formation publiée n'apparait pas dans le catalogue agent."
    }

    # PATCH puis restauration immediate, uniquement sur les enregistrements temporaires.
    Test-PatchAndRestore -Resource "formations" -Id $formationId -Field "description" -OriginalValue "$prefix-DESC-INITIALE" -ChangedValue "$prefix-DESC-MODIFIEE"
    Test-PatchAndRestore -Resource "specialites" -Id $specialiteId -Field "description" -OriginalValue "$prefix-DESC-INITIALE" -ChangedValue "$prefix-DESC-MODIFIEE"
    Test-PatchAndRestore -Resource "programmes" -Id $programmeId -Field "description" -OriginalValue "$prefix-DESC-INITIALE" -ChangedValue "$prefix-DESC-MODIFIEE"
    Test-PatchAndRestore -Resource "matieres" -Id $matiereId -Field "description" -OriginalValue "$prefix-DESC-INITIALE" -ChangedValue "$prefix-DESC-MODIFIEE"
    Test-PatchAndRestore -Resource "conditions-admission" -Id $conditionId -Field "description" -OriginalValue "$prefix-DESC-INITIALE" -ChangedValue "$prefix-DESC-MODIFIEE"
    Test-PatchAndRestore -Resource "prerequis" -Id $prerequisId -Field "description" -OriginalValue "$prefix-DESC-INITIALE" -ChangedValue "$prefix-DESC-MODIFIEE"
    Test-PatchAndRestore -Resource "tarifs" -Id $tarifId -Field "modalitesPaiement" -OriginalValue "$prefix-MODALITES-INITIALES" -ChangedValue "$prefix-MODALITES-MODIFIEES"

    # Validation : POST vide doit etre rejete (HTTP 400).
    foreach ($resource in @("formations", "specialites", "programmes", "matieres", "conditions-admission", "prerequis", "tarifs")) {
        Test-EmptyPostRejected -Resource $resource
    }

    # Relation inexistante : doit etre rejetee.
    Assert-Status -Test "Rejet relation Formation inexistante" -Method "POST" -Path "/gestion/specialites" -Expected 400 -Payload @{
        formationId = 2147483000
        nom = "$prefix-RELATION-INVALIDE"
    } | Out-Null


# Suppression de l'association avant la suppression des ressources.
Assert-Status -Test "DELETE association Programme-Matière" -Method "DELETE" -Path "/gestion/programmes/$programmeId/matieres/$matiereId" -Expected 200 | Out-Null
$AssociationCreated = $false

# Vérification via la route de gestion :
# le programme doit toujours exister après le retrait de l'association.
$afterUnlink = Assert-Status `
    -Test "GET programme après retrait association" `
    -Method "GET" `
    -Path "/gestion/programmes/$programmeId" `
    -Expected 200

    # DELETE : uniquement les IDs temporaires crees par ce script.
    Delete-TrackedResource -Resource "matieres" -Id $matiereId
    Delete-TrackedResource -Resource "programmes" -Id $programmeId
    Delete-TrackedResource -Resource "specialites" -Id $specialiteId
    Delete-TrackedResource -Resource "prerequis" -Id $prerequisId
    Delete-TrackedResource -Resource "conditions-admission" -Id $conditionId
    Delete-TrackedResource -Resource "tarifs" -Id $tarifId
    Delete-TrackedResource -Resource "formations" -Id $formationId

    Add-Result -Test "Cycle CRUD complet des 7 ressources et nettoyage" -Method "POST/PATCH/DELETE" -Path "/gestion/{resource}" -Expected 200 -Actual 200 -Details "7 ressources testées ; données temporaires supprimées."
}
catch {
    $FatalError = $_.Exception.Message
    Write-Host "`nERREUR DU SCRIPT : $FatalError" -ForegroundColor Red
}
finally {
    Cleanup-TemporaryData

    foreach ($key in $CreatedIds.Keys) {
        if ($null -ne $CreatedIds[$key]) {
            $remainingIds += "$key=$($CreatedIds[$key])"
        }
    }

    if ($remainingIds.Count -eq 0) {
        Add-Result -Test "Contrôle final : aucun ID temporaire restant à nettoyer" -Method "CLEANUP" -Path "Base SmartCampus" -Expected 0 -Actual 0
    }
    else {
        Add-Result -Test "Contrôle final : IDs temporaires restant à nettoyer" -Method "CLEANUP" -Path "Base SmartCampus" -Expected 0 -Actual $remainingIds.Count -Details ($remainingIds -join "; ")
    }

    $passed = @($Results | Where-Object { $_.Resultat -eq "PASS" }).Count
    $failed = @($Results | Where-Object { $_.Resultat -eq "FAIL" }).Count
    $total = $Results.Count

    $header = @(
        "SMARTCAMPUS AI - RAPPORT DE TESTS API CATALOGUE"
        "Date : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        "API : $BaseUrl"
        "Tests : $total | Réussis : $passed | Échoués : $failed"
        "Erreur globale : $FatalError"
        "Note : les tests utilisent des enregistrements temporaires TEST_CURL_ ; aucun enregistrement préexistant n'est volontairement modifié."
        ""
    )

    $lines = foreach ($item in $Results) {
        "[{0}] {1} | {2} {3} | attendu={4} reçu={5} | {6}" -f $item.Resultat, $item.Test, $item.Methode, $item.Endpoint, $item.Attendu, $item.Recu, $item.Details
    }

    ($header + $lines) | Set-Content -Path $TxtReport -Encoding UTF8
    $Results | Export-Csv -Path $CsvReport -NoTypeInformation -Encoding UTF8

    Write-Host "`n======================================================" -ForegroundColor Cyan
    Write-Host "RAPPORT FINAL : $passed réussis / $total ; $failed échec(s)" -ForegroundColor Cyan
    Write-Host "Rapport TXT : $TxtReport" -ForegroundColor Cyan
    Write-Host "Rapport CSV : $CsvReport" -ForegroundColor Cyan
    if ($FatalError) {
        Write-Host "Erreur : $FatalError" -ForegroundColor Red
    }
    Write-Host "======================================================" -ForegroundColor Cyan
}

if ($FatalError -or $failed -gt 0 -or $remainingIds.Count -gt 0) {
    exit 1
}
exit 0
