# PR Comments Plan

Branch: feature/skill-sub-skill-check
PR: #12
Generated: 2026-01-30

## Summary
- Total: 4 comments
- Auto: 0 (can be fixed automatically)
- Manual: 4 (need human input)

## Comments

| # | Type | Subject | Importance | Comment | Proposed Action |
|---|------|---------|------------|---------|-----------------|
| 1 | manual | architecture | question | "maybe say : look if skill has callbacks ? just discuss ? is it enough ? where should the responsibility to have callback skills ?" | reply: "Good point - callbacks could be defined in skill frontmatter. Let's track this as a future enhancement in TODO.md" |
| 2 | manual | architecture | question | "est-ce que ça sera pas sa responsabilité d'executer les scripts /skill/scripts/set-session ?" | reply: "Oui, l'agent workflow pourrait appeler les scripts de session. À ajouter dans une prochaine itération." |
| 3 | manual | architecture | question | "est-ce qu'il est pertinent qu'on se mette un format d'instruction ? est-ce qu'il existe des outils pour ça ?" | reply: "Le format markdown actuel est suffisant pour l'instant. On pourrait explorer JSON Schema ou similar plus tard si besoin de validation." |
| 4 | manual | meta | suggestion | "let's discuss about comments" | reply: "Discussion handled via this PR comment workflow!" |

## Status
- [ ] Approved
