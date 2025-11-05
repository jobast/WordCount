# WordCount Goals

Un complément Word (Office.js) permettant de définir et suivre des objectifs d'écriture en nombre de mots ou de caractères, avec alertes et statistiques inspirées de Storyist.

## Fonctionnalités

- Objectifs quotidiens, hebdomadaires et par projet.
- Support du suivi en mots ou en caractères.
- Sauvegarde locale des paramètres et de la progression par jour.
- Lecture du contenu du document Word pour enregistrer la progression en un clic.
- Alertes sonores et visuelles lors de l'atteinte des objectifs.
- Calendrier coloré selon la réussite des objectifs quotidiens.
- Statistiques (moyenne quotidienne, min/max, meilleur enchaînement de jours réussis).

## Structure

```
manifest.xml             # Manifeste du complément Word
src/taskpane/index.html  # Interface utilisateur du panneau Office
src/taskpane/styles.css  # Styles modernes et adaptatifs
src/taskpane/app.js      # Logique métier et gestion du stockage local
```

## Mise en place pour tester en local

Les compléments Office doivent être servis en HTTPS, même en local. Le flux ci-dessous utilise uniquement des outils Node.js gratuits.

1. **Installer les dépendances de développement** (si vous n'avez pas encore Node.js, installez-le d'abord) :
   ```bash
   npm install -g http-server office-addin-dev-certs
   ```
2. **Générer et faire approuver un certificat de développement**. Cette étape n'est à faire qu'une seule fois par machine :
   ```bash
   office-addin-dev-certs install
   ```
   Le certificat sera installé dans le magasin de certificats du système et les fichiers seront disponibles dans
   `~/.office-addin-dev-certs` (macOS/Linux) ou `%USERPROFILE%\.office-addin-dev-certs` (Windows).
3. **Démarrer un serveur HTTPS sur le port 3000** depuis la racine du projet :
   ```bash
   http-server . -p 3000 -S \
     -C ~/.office-addin-dev-certs/localhost.crt \
     -K ~/.office-addin-dev-certs/localhost.key
   ```
   > Sur Windows PowerShell, remplacez les chemins par
   > `-C $env:USERPROFILE\.office-addin-dev-certs\localhost.crt -K $env:USERPROFILE\.office-addin-dev-certs\localhost.key`.
4. **Mettre à jour le manifeste si nécessaire** : si vous servez le projet sur un autre port ou domaine, modifiez les URL dans
   `manifest.xml` (`https://localhost:3000/...`).
5. **Charger le manifeste dans Word** : dans Word, allez dans **Insertion > Mes compléments > Télécharger un complément** puis
   sélectionnez le fichier `manifest.xml`.
6. **Ouvrir le panneau WordCount** : le bouton « WordCount » se trouve dans l'onglet Accueil. Cliquez pour ouvrir le panneau,
   définissez vos objectifs puis utilisez le bouton « Enregistrer la progression » pour tester la lecture du document.

> Remarque : l'accès au contenu du document nécessite Word sur Windows, macOS ou Office sur le Web avec les API Office.js récentes.
> Sur le Web, pensez à autoriser les fenêtres contextuelles pour les notifications.
