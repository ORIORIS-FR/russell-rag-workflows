# Méthode de publication

Chaque futur ensemble devra fournir :

- Le ou les workflows anonymisés et leurs sous-workflows, ou le contrat explicite d’une dépendance externe.
- Une explication des entrées, du traitement et des sorties, avec un exemple.
- Un schéma global correspondant aux fichiers publiés.
- Des étapes d’installation adaptées à cette version, les credentials à créer localement et les paramètres à remplacer.
- Des vérifications documentées, en distinguant contrôle des fichiers, import et exécution réellement observée.

Les secrets, identifiants de comptes, chemins privés, hôtes internes, données de notes et résultats d’exécution restent exclus. Les sous-workflows pourront être anonymisés ; un outil absent sera signalé comme tel.

Pour l’instant il n’y a rien à importer ni à installer. L’historique Git conserve les anciennes versions retirées de main ; il n’a pas été réécrit. L’anonymisation future concerne les contenus publiés, pas l’identité du propriétaire du compte GitHub.

Contrôle local des documents, avec Python 3 depuis la racine : `python -B scripts/check.py`. Aucun service ni workflow n’est exécuté.
