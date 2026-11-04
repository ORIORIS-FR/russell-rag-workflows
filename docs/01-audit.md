---
schema_version: 1
document_id: "public-russell-01-audit-v1"
document_kind: guide
title: "Ce que le candidat cherche à corriger"
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

# Ce que le candidat cherche à corriger

| Fragilité générique | Comportement proposé | Limite |
|---|---|---|
| Suppression avant embedding | Upsert confirmé puis nettoyage | Pas une transaction ; un seul producteur requis |
| Nom de fichier seul comme identité | Chemin complet du document | Renommages et suppressions physiques à gérer séparément |
| Mémoire globale | Session conversationnelle isolée | Mémoire simple non durable |
| Audit avec outils puissants | Chaîne séparée sans outils | Analyse des seuls extraits fournis |
| Destinataire Telegram implicite | Listes de chat et utilisateur explicites | Le bot de test doit être distinct du bot actif |
| Rejeu après panne | IDs déterministes et génération comptée | La qualité des vecteurs n'est pas prouvée par leur nombre |

Le public ne contient ni les exports réellement actifs, ni leurs IDs, ni une topologie privée. Les tests disponibles ne prouvent pas un import ou une exécution métier n8n.
