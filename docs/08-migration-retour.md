---
schema_version: 1
document_id: "public-russell-08-migration-retour-v1"
document_kind: guide
title: "Adapter et revenir en arrière"
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

# Adapter et revenir en arrière

1. Sauvegarder les workflows réellement actifs et les credentials par le mécanisme privé de l'installation.
2. Créer une collection et une instance séparées ; utiliser des notes synthétiques.
3. Comparer ancien et candidat sur les mêmes questions, avec le même modèle.
4. Prévoir un seul producteur, puis une bascule explicite de l'ingestion et de la recherche.
5. Garder l'ancienne collection pendant l'observation.
6. En cas d'échec, couper le nouvel entrant, confirmer la fin des tâches puis reconnecter l'ancienne lecture.

Une suppression ou un renommage de note demande une réconciliation explicite. Ne pas faire une purge globale pour régler un écart de chemin. Le retour de code ne restaure pas une collection déjà modifiée.
