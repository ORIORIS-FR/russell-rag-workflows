---
schema_version: 1
document_id: "public-russell-07-recette-v1"
document_kind: guide
title: "Tests locaux et recette n8n"
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

# Tests locaux et recette n8n

npm run verify teste les fonctions et des chemins simulés, puis les liens et les paramètres des exports. Aucun service, bot, modèle ou renderer n'est contacté. Les deux mocks de sous-workflows ont leurs propres tests.

À vérifier dans votre staging : import sans nœud inconnu, identités homonymes, drapeaux, erreur d'embedding, upsert non confirmé, reprise, refus d'utilisateur, sessions distinctes, rapport anti-boucle et coût réel du modèle. La présence de JSON valide ne prouve pas la compatibilité du moteur n8n.

Pour les mocks, confirmer status=demo, execution_enabled=false et la même sortie pour une entrée synthétique identique. Ils ne testent aucune permission de votre disque réel.

Ne passer à un usage réel qu'après une recette consignée avec versions, sources, limites et retour. Les fichiers HTML se consultent hors ligne ; la police système remplace les fontes éditoriales si elles ne sont pas installées.
