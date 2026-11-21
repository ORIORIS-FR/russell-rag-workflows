"""Contrôle documentaire hors ligne : aucun workflow ni service exécuté."""
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
errors = []
files = [p for p in root.rglob('*') if p.is_file() and not any(x in {'.git','.local','__pycache__'} for x in p.relative_to(root).parts)]
for p in files:
    if p.suffix not in {'.md','.json','.html','.py','.yml','.svg','.mmd'}:
        continue
    text = p.read_text(encoding='utf-8')
    if p.suffix == '.md':
        # Liens locaux seulement ; les liens vers les commits historiques restent externes.
        for link in re.findall(r'\]\(([^)]+)\)', text):
            if re.match(r'^[a-z]+:', link) or link.startswith('#'):
                continue
            if not (p.parent / unquote(link.split('#')[0])).exists():
                errors.append(f'{p.relative_to(root)} : lien absent {link}')
    if p.suffix == '.json':
        try:
            data = json.loads(text)
        except ValueError as e:
            errors.append(f'{p.relative_to(root)} : JSON invalide {e}')
            continue
        def inspect(value):
            if isinstance(value, dict):
                for key, val in value.items():
                    if key in {'credentials','pinData','staticData','webhookId'}:
                        errors.append(f'{p.relative_to(root)} : champ interdit {key}')
                    inspect(val)
            elif isinstance(value,list):
                for val in value:
                    inspect(val)
        inspect(data)
    if re.search(r'gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9_-]{32,}|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----',text):
        errors.append(f'{p.relative_to(root)} : motif de secret à examiner')

cat = root / 'catalogue.json'
graphs = 0
if cat.exists():
    catalog = json.loads(cat.read_text(encoding='utf-8'))
    for entry in catalog['workflows']:
        draft = json.loads((root / entry['draftFile']).read_text(encoding='utf-8'))
        if draft['id'] != entry['id'] or draft['versionId'] != entry['draftVersionId']:
            errors.append('Identité/version de brouillon incohérente')
        if len(draft['nodes']) != entry['nodeCount']:
            errors.append('Nombre de nœuds incohérent')
        for rel in {entry['draftFile'],entry['publishedFile']} - {None}:
            payload = json.loads((root/rel).read_text(encoding='utf-8'))
            names = {n['name'] for n in payload['nodes']}
            for source, types in payload['connections'].items():
                if source not in names:
                    errors.append(f'{rel} : source de connexion absente {source}')
                for outputs in types.values():
                    for output in outputs:
                        for edge in output:
                            if edge['node'] not in names:
                                errors.append(f'{rel} : destination absente {edge["node"]}')
    graphs = len(list((root/'workflows'/'current').glob('*.json')))
    pending = [d['name'] for d in catalog['dependencies'] if d['status'] != 'collected']
    print('Dépendances à récupérer : '+(', '.join(pending) if pending else 'aucune'))
else:
    if (root/'workflows').exists() and any((root/'workflows').rglob('*.json')):
        errors.append('Publication publique inattendue : aucun workflow encore approuvé')
print(json.dumps({'files_checked':len(files),'reference_graphs':graphs,'errors':errors,'scope':'fichiers et liens, sans exécution n8n'},ensure_ascii=False,indent=2))
sys.exit(bool(errors))
