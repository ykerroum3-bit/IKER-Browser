# IKER Browser — première version

## Prérequis
- Windows 10/11 64 bits
- Node.js LTS installé depuis https://nodejs.org/

## Lancer le navigateur en mode développement
1. Décompressez le dossier `IKER-Browser`.
2. Ouvrez le dossier dans l'Explorateur Windows.
3. Cliquez dans la barre d'adresse de l'Explorateur, tapez `cmd`, puis Entrée.
4. Dans le terminal, lancez :
   ```
   npm install
   npm start
   ```

La première installation télécharge Electron et peut prendre quelques minutes.

## Créer un installateur Windows
Dans le même terminal :
```
npm run dist
```
L'installateur sera créé dans le dossier `dist`.

## Raccourcis
- `Ctrl+L` : sélectionner la barre d'adresse
- `Ctrl+T` : nouvel onglet
- `Ctrl+W` : fermer l'onglet

## Limites importantes de cette version
- Le moteur est Chromium via Electron, et les sites sont chargés depuis Internet.
- Le filtre publicitaire est une liste de domaines simple, pas un bloqueur complet.
- Le mode privé utilise une session temporaire distincte, mais ne rend pas anonyme et ne remplace pas un VPN.
- Le panneau IA est un point de départ : il permet de récupérer le texte de la page, mais aucun modèle IA n'est encore connecté.
- Aucun VPN réel n'est connecté. Pour cela, il faut intégrer un fournisseur ou un client VPN approuvé.
- Le gestionnaire de mots de passe et la synchronisation cloud ne sont pas encore implémentés. Ne stockez pas de mots de passe sensibles dans cette version.
- Avant une diffusion publique, il faut ajouter notamment une politique de mise à jour sécurisée, une liste de blocage maintenue, des tests de sécurité et une gestion complète des permissions.

## Dépannage
- Si `npm` n'est pas reconnu, fermez puis rouvrez le terminal après l'installation de Node.js.
- Si un site refuse de s'afficher, essayez une adresse `https://...`.
