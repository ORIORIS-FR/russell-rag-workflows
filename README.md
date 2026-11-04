# Russell — assistant et RAG documentaire n8n

Kit public générique : deux workflows candidats désactivés, deux sous-workflows de démonstration sans effets, prompts, tests, six diagrammes et guides pas à pas. Aucun accès, credential ou donnée d'une installation privée n'est fourni.

**Commencer : [installation pas à pas](docs/03-installation.md), puis [recette](docs/07-recette.md).** Les exemples Docker sont uniquement destinés à un laboratoire isolé ; ils n'ont pas été déployés lors de cette publication.

```powershell
git clone https://github.com/ORIORIS-FR/russell-rag-workflows.git
cd russell-rag-workflows
npm run verify
```

Node.js 22+ suffit aux tests sans services. Aucun paquet npm externe à installer pour ce contrôle. Ouvrir ensuite [le portail HTML](docs/site/index.html) localement ; GitHub présente le source HTML et ne l'exécute pas directement. Les [diagrammes](docs/diagrams/index.html) sont autonomes et consultables hors ligne.

| Élément | Rôle |
|---|---|
| workflows/optimized | Assistant et RAG candidats, dryRun=true |
| workflows/demo | Deux contrats synthétiques ; aucune lecture disque, shell ou API |
| src / tests | Logique testée et tests reproductibles |
| config / prompts | Valeurs de départ et instructions de modèle |
| examples | Pile de staging et notes fictives |
| docs | Installation, usages, exploitation et limites |

État : publication du kit, pas activation d'un assistant en production. La mémoire PostgreSQL, les missions durables et les intégrations de capture/cockpit/vidéo sont des pistes de conception à adapter et tester séparément.

Le code est publié sans licence de réutilisation attribuée à ce stade ; voir [LICENSE.md](LICENSE.md). Les licences des produits externes restent distinctes.
