---
schema_version: 1
document_id: "public-russell-02-architecture-v1"
document_kind: guide
title: "Architecture et responsabilités"
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

# Architecture et responsabilités

Le vault est la source documentaire, Qdrant l'index dérivé et l'assistant un producteur d'analyses. Le kit distingue conversation Telegram autorisée et audit interne sans outil ni mémoire partagée.

| YAML racine | Effet |
|---|---|
| rag_sync: true | Indexation ou vérification de génération |
| rag_sync: false | Purge des points de ce chemin |
| drapeau absent | Pas d'action |
| audit_russell: true | Audit après nouvelle indexation confirmée |

Le mode simulation n'effectue aucun appel HTTP pour le RAG et contourne modèle, outils et écriture pour l'assistant. Le RAG lit néanmoins les fichiers pour préparer son plan.

La chaîne réelle est count → embeddings si nécessaire → validation du vecteur → upsert attendu → confirmation → nettoyage limité au fichier. L'audit est regroupé après la boucle. L'absence d'une file durable d'audits et d'un verrou entre exécutions reste une limite.
