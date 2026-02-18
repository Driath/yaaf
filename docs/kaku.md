# Kaku

Terminal macOS rapide et minimaliste, fork de WezTerm en Rust par Tw93.
Pensé pour le coding assisté par IA (Claude Code, etc.).

## Installation

```bash
brew install tw93/tap/kakuku
```

## Config

Fichier : `~/.config/kaku/kaku.lua`

Compatible avec l'API Lua de WezTerm. Les overrides se mettent après le chargement des defaults bundled.

## Raccourcis

### Tabs

| Raccourci | Action |
|---|---|
| Cmd+T | Nouvel onglet |
| Cmd+W | Fermer pane > tab > masquer l'app |
| Cmd+Shift+W | Fermer l'onglet |
| Cmd+1-9 | Aller à l'onglet N |
| Cmd+Shift+[ | Onglet précédent |
| Cmd+Shift+] | Onglet suivant |

### Splits (panes)

| Raccourci | Action |
|---|---|
| Cmd+D | Split vertical |
| Cmd+Shift+D | Split horizontal |
| Cmd+Shift+S | Inverser la direction du split |
| Cmd+Shift+Enter | Zoom/dézoom le pane actif |
| Cmd+Option+flèches | Naviguer entre les panes |
| Cmd+Ctrl+flèches | Redimensionner les panes |

### Édition / Navigation

| Raccourci | Action |
|---|---|
| Sélection souris | Copie automatique dans le presse-papier |
| Cmd+clic | Ouvrir un lien dans le navigateur |
| Cmd+K / Cmd+R | Clear terminal + scrollback |
| Cmd+Enter / Shift+Enter | Nouvelle ligne sans exécuter |
| Option+flèches | Saut de mot |
| Cmd+flèches | Début/fin de ligne |
| Cmd+Backspace | Supprimer jusqu'au début de la ligne |
| Option+Backspace | Supprimer le mot |

### Fenêtre

| Raccourci | Action |
|---|---|
| Cmd+N | Nouvelle fenêtre |
| Cmd+Ctrl+F | Plein écran |
| Cmd+M | Minimiser |
| Cmd+Q | Quitter |
| Cmd+=/- /0 | Zoom texte |

## Outils CLI pré-intégrés

- **Starship** : prompt avec statut git
- **z** : navigation rapide par répertoires fréquents
- **Delta** : diffs git colorés
- **zsh autosuggestions + syntax highlighting + completions**

## Defaults notables

- Police : JetBrains Mono
- Line height : 1.28
- Font size : 17px (Retina) / 15px (écran externe)
- Curseur : barre clignotante violette
- Copy on select activé
- Scrollback : 10 000 lignes
