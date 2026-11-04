---
schema_version: 1
document_id: "public-russell-03-installation-v1"
document_kind: guide
title: "Installation pas à pas, en environnement isolé"
description: "Guide public générique, sans référence privée."
type: "🔄_workflow"
status: "🟢_actif"
tags:
  - SYSTEME/Documentation
related: []
created_at: "2026-11-04"
updated_at: "2026-11-04"
auteur: codex
github_repo: "https://github.com/ORIORIS-FR/russell-rag-workflows"
source_verified_at: "2026-11-04"
publish: false
rag_sync: false
audit_russell: false
---

# Installation pas à pas, en environnement isolé

## 1. Prérequis et téléchargement

Git, Node.js 22+ pour le kit et Docker Desktop/Engine avec Compose si vous choisissez l'exemple conteneurisé. Le kit ne lance pas Docker depuis ses commandes npm.

```powershell
git clone https://github.com/ORIORIS-FR/russell-rag-workflows.git
cd russell-rag-workflows
npm run verify
```

Attendu : tests locaux réussis et pages dans docs/site. Aucun fournisseur contacté.

## 2. Préparer le laboratoire Docker facultatif

L'exemple fourni est une nouvelle pile de test, sans montage personnel, socket Docker, réseau hôte ou service existant. Il utilise les ports locaux 15678, 16333 et 11435 ; vérifier qu'ils sont libres.

```powershell
Copy-Item examples/staging.env.example examples/.env
```

Dans examples/.env, remplacer les deux marqueurs de secrets par deux valeurs aléatoires différentes, générées localement et non affichées dans une issue. Les choisir avant de créer des données : la clé n8n devra être conservée pour retrouver ses credentials. Vérifier le tag Ollama puis le figer par digest pour une installation reproductible. Les tags indiqués ne constituent pas une recette de production.

```powershell
docker compose --project-name russell-staging --env-file examples/.env -f examples/compose.staging.example.yml config --quiet
docker compose --project-name russell-staging --env-file examples/.env -f examples/compose.staging.example.yml up -d
```

Ouvrir http://127.0.0.1:15678 et créer le compte local n8n. L'exemple de laboratoire conserve n8n sur SQLite dans son volume ; PostgreSQL pour la mémoire est une évolution séparée. Aucun composant privé n'est restauré par cet exemple.

Les images doivent être téléchargées ; prévoir les ressources et l'espace nécessaires. Ces commandes sont documentées, pas exécutées par la préparation de ce dépôt.

## 3. Modèle et collection de test

```powershell
docker compose --project-name russell-staging --env-file examples/.env -f examples/compose.staging.example.yml exec ollama ollama pull nomic-embed-text:latest
```

Interroger un embedding de test sur /api/embed, confirmer le nombre de dimensions, puis créer knowledge-base-staging dans Qdrant avec cette taille et la distance choisie. Le Qdrant de l'exemple est accessible sur http://127.0.0.1:16333 et exige la clé locale configurée. Ne pas réutiliser une collection réelle ni une clé de production.

Le modèle d'embedding et sa révision doivent être identiques en ingestion et en recherche. Les 768 dimensions de l'exemple sont à vérifier, pas à imposer à un autre modèle. L'origine interne des appels n8n est http://ollama:11434 et http://qdrant:6333 ; les ports hôte servent aux outils du PC.

Exemple PowerShell à exécuter uniquement dans ce laboratoire, après remplacement des marqueurs dans examples/.env :

```powershell
$labKeys = ConvertFrom-StringData (Get-Content examples/.env -Raw)
$embedBody = @{model='nomic-embed-text:latest';input=@('Texte de test');truncate=$false} | ConvertTo-Json
$embedding = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:11435/api/embed' -ContentType 'application/json' -Body $embedBody
$vectorSize = $embedding.embeddings[0].Count
if ($vectorSize -lt 1) { throw 'Embedding absent : ne pas creer de collection.' }
$collectionBody = @{vectors=@{size=$vectorSize;distance='Cosine'}} | ConvertTo-Json -Depth 4
Invoke-RestMethod -Method Put -Uri 'http://127.0.0.1:16333/collections/knowledge-base-staging' -Headers @{'api-key'=$labKeys.QDRANT_API_KEY} -ContentType 'application/json' -Body $collectionBody
$modelTags = Invoke-RestMethod -Uri 'http://127.0.0.1:11435/api/tags'
$modelTags.models | Where-Object {$_.name -eq 'nomic-embed-text:latest'} | Select-Object name,digest
```

Conserver le digest renvoyé comme embeddingRevision et la taille observée comme expectedDimensions. Si la collection existe déjà, vérifier sa configuration au lieu de la supprimer pour refaire la commande. Ne pas afficher la variable contenant les clés dans un ticket.

## 4. Importer sans activer

Importer workflows/optimized/russell.v0.1.json puis rag-obsidian.v0.1.json avec l'interface n8n. Conserver les deux inactifs. Relever le nouvel ID de l'assistant si l'audit interne doit être essayé plus tard.

Importer ensuite les deux fichiers workflows/demo/. Ce sont des contrats à données fictives : aucun vrai dossier n'est inventorié et aucun nettoyage de notes n'est réalisé. Ne pas importer des références privées trouvées ailleurs comme si c'étaient ces mocks.

Pour essayer un mock depuis l'interface n8n, créer un parent temporaire : Manual Trigger → Edit Fields avec dossier_cible = demo → Execute Workflow, puis sélectionner l'ID du mock. Attendu : status = demo et execution_enabled = false. Le parent et le mock restent des workflows de test, sans activation planifiée.

## 5. Configurer les nœuds

| Zone | Valeurs de staging |
|---|---|
| Configurer RAG | dryRun=true ; vaultRoot=/vault ; qdrantBaseUrl=http://qdrant:6333 ; ollamaBaseUrl=http://ollama:11434 ; collection=knowledge-base-staging |
| Embedding | Modèle et révision réels ; dimensions vérifiées ; chunkSize=500 ; chunkOverlap=50 |
| Audit | enableAudit=false au premier essai ; ID de la copie d'assistant ensuite |
| Configurer l'assistant | dryRun=true ; reportDirectory=/reports ; allowedChatIds et allowedUserIds explicitement remplis pour le bot de test |
| Notifications | sendTelegram=false jusqu'au dernier test |
| Cartographe | ID du mock si souhaité ; une réponse demo n'est pas un inventaire réel |

Associer les credentials dans n8n : modèle OpenAI compatible de votre choix, Ollama, Qdrant, Header Auth pour HTTP Qdrant (nom api-key), SearXNG et Telegram selon les parcours utilisés. Le nom assistant-model est un exemple à remplacer par un modèle réellement proposé par votre endpoint ; aucune clé fournisseur n'est livrée.

Un bot de test différent évite de remplacer le webhook du bot en service. Pour un premier essai interne sans Telegram, utiliser l'entrée de sous-workflow sur une chaîne synthétique bornée.

## 6. Première simulation

Exécuter Test manuel dans le RAG. Les notes examples/demo-vault/A/test.md et B/test.md doivent garder deux chemins distincts. Vérifier le bilan et l'absence d'appel HTTP. Tester le mock dossier sans shell.

## 7. Essais réels de staging

Après revue des ressources et des coûts, passer dryRun à false uniquement dans le laboratoire. Vérifier l'indexation, la recherche, un rapport unique, une reprise après échec et l'isolation de sessions. Activer l'audit puis Telegram séparément. Les appels modèle peuvent transmettre vos extraits au fournisseur choisi ; utiliser d'abord des données synthétiques.

## 8. Arrêt et retour

Arrêter seulement cette pile avec le même nom de projet et le même fichier Compose. Conserver ses volumes et sa clé ; ne pas ajouter --volumes. Une adaptation à une infrastructure existante demande un diff, une sauvegarde et une validation propre, jamais une copie de ce Compose sur la production.
