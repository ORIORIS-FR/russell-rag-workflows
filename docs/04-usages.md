---
schema_version: 1
document_id: "public-russell-04-usages-v1"
document_kind: guide
title: "Usages et exemples"
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

# Usages et exemples

| Objectif | Demande utile | Limite |
|---|---|---|
| Retrouver une décision | Retrouve les sources de [sujet] et cite leurs chemins | L'index peut être incomplet |
| Comparer | Compare ces deux notes, leurs dates et leurs preuves | Ne pas déclarer la plus récente forcément vraie |
| Préparer un plan | Propose un petit résultat utile, ses tests et son retour | Aucun code exécuté automatiquement |
| Diagnostiquer | Sépare observations, hypothèses et vérifications sur ces logs expurgés | Pas de Docker connecté dans le candidat |
| Préparer une vidéo | Écris un brief et un storyboard à relire | Aucun renderer fourni ou connecté |
| Audit documentaire | Analyse les seuls extraits fournis et les omissions | Aucun Web dans la chaîne d'audit |

Voir le [catalogue de prompts](../prompts/catalogue.md). Les confirmations de lecture, d'analyse, de modification et de publication doivent être distinctes.
