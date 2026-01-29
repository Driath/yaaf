# TODO

## En cours

- [ ] PR #3 en review : https://github.com/Driath/yaaf/pull/3

## Skills à implémenter/améliorer

### skill:check
- [ ] Lire `skill:format:out` dynamiquement (DRY design-system)
- [ ] Valider section Output contre le format
- [ ] Ajouter `--all` pour valider tous les skills
- [ ] Générer/mettre à jour `ia/state/skills.md`
- [ ] Inciter au test E2E dans les notes

### workflow:check (NEW)
- [ ] Créer le skill `workflow:check`
- [ ] Hérite de skill:check (car workflow IS skill)
- [ ] Valider que les sub-skills existent
- [ ] Valider que les sub-skills sont eux-mêmes validés (lire `ia/state/skills.md`)
- [ ] Appeler `skill:check` sur chaque sub-skill (deep par défaut)
- [ ] Flag `--shallow` pour skip la validation des sub-skills
- [ ] Générer/mettre à jour `ia/state/workflows.md`
- [ ] Valider le flow d'orchestration (étapes cohérentes)
- [ ] Inciter/forcer un test E2E documenté

## State files à créer

- [ ] `ia/state/skills.md` - généré par `skill:check --all`
- [ ] `ia/state/workflows.md` - généré par `workflow:check --all`

## Cleanup

- [ ] Retirer règle "Background Monitoring" de `workflow/SKILL.md` (pas sa responsabilité)
