# Contributing to DermAssist AI

Merci de contribuer à DermAssist AI ! Voici quelques directives.

## Code Style

### Python (Backend)

- PEP 8 avec Black formatter
- Type hints recommandés
- Docstrings pour les fonctions publiques

```bash
# Format
black .

# Lint
pylint app/
```

### JavaScript (Frontends)

- ESLint + Prettier
- React hooks plutôt que classes
- Nommage explicite (pas de abbr)

```bash
npm run lint
npm run format
```

## Processus de Contribution

1. **Fork** le projet
2. **Créer une branche** `feature/feature-name`
3. **Commit** avec messages clairs
4. **Push** vers la branche
5. **Créer une Pull Request** avec description

## Bonnes Pratiques

- Écrire des tests pour les nouveaux endpoints
- Mettre à jour la documentation
- Suivre les patterns existants
- Tester localement avant PR
- Une fonctionnalité = une PR

## Structure Commit

```
[FEAT|FIX|DOCS|TEST] Brief description

Optional longer explanation.
```

Exemples:

- `[FEAT] Add patient advice endpoint`
- `[FIX] Fix JWT token validation`
- `[DOCS] Update API documentation`

## Reporting Issues

Inclure:

- Description claire du problème
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, versions)

## Questions ?

Créer une issue "question" ou contacter l'équipe.

Merci !
