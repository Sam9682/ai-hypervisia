# Oracle AI - Fix pour l'erreur "kiro-cli: not found"

## Problème
L'Oracle AI était configuré pour utiliser "kiro" comme fournisseur d'IA par défaut, mais `kiro-cli` n'est pas installé sur le serveur, causant l'erreur:
```
2026-02-19 10:42:49 - hypervisia - ERROR - Kiro CLI error: /bin/sh: 1: kiro-cli: not found
```

## Solution appliquée
Le fournisseur d'IA par défaut a été changé de "kiro" à "openai" dans tous les fichiers concernés.

### Fichiers modifiés

1. **app/oracle/schemas.py**
   - `OracleQuery.ai_provider`: default changé de "kiro" à "openai"
   - `OracleAnalysisRequest.ai_provider`: default changé de "kiro" à "openai"

2. **app/oracle/router.py**
   - Endpoint `/api/oracle/providers`: OpenAI est maintenant marqué comme default
   - Kiro AI a une note "Nécessite installation"

3. **oracle_config.json**
   - Ordre des providers changé: openai en premier avec `"default": true`
   - Kiro AI avec `"default": false` et note sur l'installation

4. **frontend/src/services/oracleService.ts**
   - `analyzeForumMessages()`: default changé de "kiro" à "openai"

5. **frontend/src/pages/OraclePage.tsx**
   - State initial du provider: changé de "kiro" à "openai"
   - Dropdown: OpenAI en premier, Kiro avec note "Nécessite installation"

## Configuration requise

Pour utiliser OpenAI (nouveau default), vous devez configurer la clé API dans `.env`:

```bash
# Ajouter dans .env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
```

## Alternatives

Si vous ne souhaitez pas utiliser OpenAI, vous avez deux options:

### Option 1: Utiliser Shai AI (OVH Cloud)
```bash
# Ajouter dans .env
SHAI_API_KEY=your_shai_api_key_here
SHAI_API_URL=https://api.ovh.com/shai/v1/chat
```

### Option 2: Installer kiro-cli
```bash
bash scripts/install_kiro_cli.sh
```

## Test

Après avoir configuré la clé API OpenAI, redémarrez l'application et testez:

```bash
# Redémarrer l'application
docker-compose restart

# Tester l'Oracle
curl -X POST http://localhost:8000/api/oracle/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Bonjour Oracle, comment vas-tu?"}'
```

## Notes

- Kiro AI reste disponible comme option mais nécessite l'installation de `kiro-cli`
- Les utilisateurs peuvent toujours choisir leur fournisseur d'IA dans l'interface
- L'historique des requêtes précédentes avec Kiro est préservé
