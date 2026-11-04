---
schema_version: 1
document_id: "public-russell-10-decisions-v1"
document_kind: guide
title: "Décisions et pistes d'évolution"
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

# Décisions et pistes d'évolution

Le kit privilégie un RAG par générations, un audit sans outil, des rapports uniques et un staging distinct. Les mocks remplacent volontairement les outils privés. Le code candidat est publié pour revue ; il ne constitue pas une validation de production.

Pour une mémoire durable, étudier Postgres Chat Memory avec base/rôle dédiés, sessions canoniques, rétention et restauration. La fenêtre de contexte ne vaut pas suppression des messages. Ne pas mélanger historique conversationnel, état de mission et notes validées.

Pour plusieurs utilisateurs, ne pas supposer qu'un session_id libre ou une politique RLS ajoutée sans identité serveur suffit. Pour plusieurs exécutions, concevoir un verrou d'ingestion et une file durable de missions avant de multiplier les workers. Pour la vidéo, commencer par un brief et un schéma d'assets autorisés, sans code ou commande arbitraire.
