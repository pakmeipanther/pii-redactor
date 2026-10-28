**Lire en :** [English](guide.en.md) · [Tiếng Việt](guide.vi.md) · [Deutsch](guide.de.md) · [Français](guide.fr.md)

---

# PII Redactor — Guide d'utilisation pour débutants

## À quoi sert cet outil ?

Imaginez que vous photocopiez votre pièce d'identité pour un inconnu — vous prendriez sûrement un stylo pour masquer votre nom, votre numéro de téléphone, votre adresse avant de la lui donner, n'est-ce pas ? PII Redactor fait exactement cela, mais avec du texte, des captures d'écran et des fichiers PDF — il trouve et masque automatiquement les informations sensibles (emails, numéros de téléphone, adresses IP, mots de passe, chaînes de connexion à une base de données...) avant que vous ne colliez ce contenu dans ChatGPT, Claude ou tout autre outil d'IA.

> **Le plus important :** ce logiciel n'établit aucune connexion Internet et n'envoie aucune donnée nulle part — tout le traitement se fait directement sur votre ordinateur. Vous pouvez complètement désactiver le Wi-Fi en l'utilisant, il continuera de fonctionner normalement — c'est aussi un moyen de le vérifier par vous-même.

## Étape 1 — Téléchargez le logiciel

1. Ouvrez votre navigateur (Firefox ou Brave sont recommandés — deux navigateurs réputés pour la sécurité et la confidentialité ; Chrome, Safari et Edge fonctionnent aussi), et rendez-vous à l'adresse :

   ```
   https://github.com/pakmeipanther/pii-redactor
   ```
1. Trouvez le bouton vert "Code", cliquez dessus, puis choisissez "Download ZIP".
1. Le fichier sera téléchargé dans le dossier que votre navigateur utilise par défaut — ici, Downloads n'est qu'un exemple, car c'est souvent l'emplacement par défaut, mais vous pouvez choisir n'importe quel dossier.

### Décompresser le fichier (transformer le .zip en un dossier utilisable)

#### macOS

1. Ouvrez le dossier où vous venez d'enregistrer le fichier zip (par exemple Downloads si vous avez utilisé le dossier par défaut).
1. Double-cliquez sur le fichier téléchargé (nommé quelque chose comme pii-redactor-main.zip).
1. macOS créera automatiquement un dossier du même nom juste à côté — terminé !

#### Windows

1. Ouvrez le dossier où vous venez d'enregistrer le fichier zip (par exemple Downloads si vous avez utilisé le dossier par défaut).
1. Faites un clic droit sur le fichier zip, choisissez "Extract All..." (Extraire tout...).
1. Une fenêtre s'ouvre pour demander où l'enregistrer — laissez la valeur par défaut et cliquez sur "Extract" (Extraire).
1. Un nouveau dossier du même nom apparaîtra.

## Étape 2 — Utilisez la fonction de suppression d'informations dans le texte

*La méthode la plus simple — rien à installer*

1. Ouvrez le dossier décompressé à l'étape 1.
1. Trouvez le fichier nommé index.html.
1. Double-cliquez dessus — il s'ouvrira automatiquement dans votre navigateur.
1. En haut à droite de l'écran se trouve un sélecteur de langue — cliquez dessus et choisissez "Français" si besoin pour afficher toute l'interface dans cette langue.
1. Collez le texte à vérifier (par exemple un email contenant un numéro de téléphone, une adresse...) dans la grande zone en haut.
1. Cliquez sur le bouton "Analyser et surligner".
1. Regardez la section "Résultat" ci-dessous — les parties surlignées en rouge sont les informations sensibles trouvées par le logiciel.
1. Si cela vous convient, cliquez sur "Télécharger le texte nettoyé (.txt)" pour enregistrer la version où les informations ont été masquées — c'est cette version que vous pouvez coller en toute confiance dans une IA.

> **Remarque :** le logiciel n'est pas parfait à 100 % — vérifiez toujours les parties surlignées avant de leur faire entièrement confiance, ne vous contentez pas de cliquer sur télécharger sans regarder.

## Étape 3 (avancée, facultative) — Utilisez les fonctions pour les images et les PDF

Les fonctions de traitement des captures d'écran et des fichiers PDF nécessitent une petite étape technique supplémentaire, en raison des règles de sécurité du navigateur. Le terme "lancer un serveur local" peut sembler effrayant, mais il s'agit simplement de taper une seule ligne de commande. Si vous n'avez besoin que de la suppression d'informations dans le texte, vous pouvez ignorer cette section.

#### macOS — lancer un serveur local

1. Ouvrez l'application Terminal (appuyez sur Cmd + Espace, tapez "Terminal", appuyez sur Entrée).
1. Tapez cd (avec un espace après "cd"), puis glissez-déposez le dossier décompressé à l'étape 1 directement dans la fenêtre du Terminal — le chemin se remplira automatiquement. Appuyez sur Entrée.
1. Tapez la ligne suivante puis appuyez sur Entrée :

   ```
   python3 -m http.server 8000
   ```

   > Si un message d'erreur rouge "command not found: python3" apparaît, cela signifie que Python n'est pas installé sur votre machine. Consultez le guide d'installation détaillé de Python ci-dessous, ou utilisez simplement la fonction texte de l'étape 2, qui suffit largement.
1. Ouvrez votre navigateur et tapez dans la barre d'adresse :

   ```
   http://localhost:8000
   ```
1. Désormais, toutes les fonctions (texte, image, PDF) sont utilisables, de la même manière qu'à l'étape 2.
1. Une fois terminé, retournez à la fenêtre du Terminal, appuyez sur Ctrl + C, puis fermez la fenêtre.

#### Windows — lancer un serveur local

1. Appuyez sur la touche Windows, tapez "cmd" ou "PowerShell", appuyez sur Entrée pour ouvrir une fenêtre de ligne de commande.
1. Tapez cd (avec un espace), puis glissez-déposez le dossier décompressé dans la fenêtre — le chemin se remplira automatiquement. Appuyez sur Entrée.
1. Tapez la ligne suivante puis appuyez sur Entrée (sous Windows, c'est généralement "python", pas "python3") :

   ```
   python -m http.server 8000
   ```

   > Si une erreur de commande introuvable apparaît, Python n'est pas installé. Consultez le guide d'installation détaillé ci-dessous — n'oubliez pas de cocher "Add Python to PATH" lors de l'installation.
1. Ouvrez votre navigateur et tapez :

   ```
   http://localhost:8000
   ```
1. Utilisez-le de la même manière qu'à l'étape 2.
1. Une fois terminé, retournez à la fenêtre de ligne de commande, appuyez sur Ctrl + C pour l'arrêter, puis fermez la fenêtre.

### Installation détaillée de Python (si votre machine indique "commande python introuvable")

#### macOS

1. Ouvrez votre navigateur et rendez-vous sur :

   ```
   https://www.python.org/downloads/
   ```
1. La page détectera automatiquement que vous utilisez un Mac et affichera un bouton jaune "Download Python 3.x.x" — cliquez dessus.
1. Le fichier d'installation (.pkg) sera téléchargé dans le dossier Downloads.
1. Double-cliquez dessus pour démarrer l'installation.
1. Une fenêtre d'installation s'ouvre — cliquez sur "Continue" (Continuer) à chaque étape jusqu'à voir le bouton "Install" (Installer), puis cliquez dessus.
1. Votre Mac peut vous demander votre mot de passe de connexion (celui qui déverrouille votre machine) — saisissez-le puis cliquez sur OK.
1. Attendez quelques minutes jusqu'à voir le message "The installation was successful" (Installation réussie).
1. Fermez la fenêtre d'installation, puis fermez toute fenêtre Terminal ouverte et ouvrez-en une nouvelle pour que le Python installé soit reconnu.
1. Essayez à nouveau de taper la ligne suivante — cela devrait maintenant fonctionner sans erreur :

   ```
   python3 -m http.server 8000
   ```

#### Windows

1. Ouvrez votre navigateur et rendez-vous sur :

   ```
   https://www.python.org/downloads/
   ```
1. La page détectera automatiquement que vous utilisez Windows et affichera un bouton jaune "Download Python 3.x.x" — cliquez dessus.
1. Le fichier d'installation (.exe) sera téléchargé dans le dossier Downloads.
1. Double-cliquez dessus pour démarrer l'installation.
1. Très important : sur le premier écran de l'installateur, il y a une petite case à cocher en bas intitulée "Add python.exe to PATH" (ou "Add Python to PATH") — vous devez absolument la cocher avant de continuer, sinon votre machine ne reconnaîtra pas la commande python par la suite.
1. Après avoir coché la case, cliquez sur "Install Now" (Installer maintenant).
1. Attendez quelques minutes jusqu'à voir "Setup was successful" (Installation réussie), puis cliquez sur "Close" (Fermer).
1. Fermez l'ancienne fenêtre de ligne de commande et ouvrez-en une nouvelle pour que le Python installé soit reconnu.
1. Essayez à nouveau de taper la ligne suivante — cela devrait maintenant fonctionner sans erreur :

   ```
   python -m http.server 8000
   ```

> Si vous avez bien suivi toutes les étapes et qu'une erreur persiste, il est possible que votre ordinateur doive redémarrer pour prendre en compte les changements.

## Étape 4 (automatique) — La vérification des métadonnées

Les « métadonnées » sont des informations cachées à l'intérieur d'un fichier, que vous ne voyez pas quand vous l'ouvrez : qui l'a créé, avec quel logiciel, quand — et parfois même où (une photo peut contenir la position GPS du lieu de prise de vue).

- **Quand vous déposez un fichier** (image, PDF, Word ou PowerPoint), un cadre « Métadonnées du fichier d'origine » apparaît sous la ligne « Détecté : ». Il liste ce que le fichier transporte, avec les valeurs réelles, pour que vous voyiez exactement ce qui aurait été partagé. Cliquez sur « Masquer les valeurs » pour les cacher (par exemple pendant un partage d'écran) ; les noms des champs restent visibles. Ces valeurs ne s'affichent que sur votre propre ordinateur.
- **Le fichier que vous téléchargez est reconstruit de zéro**, donc rien de tout cela n'y est copié.
- **Avant chaque téléchargement, l'outil vérifie à nouveau le résultat.** Si tout est propre, vous voyez une ligne verte : « Vérifié : le fichier exporté ne contient aucune métadonnée identifiante. » S'il reste quelque chose — ou si l'outil ne peut pas en être sûr — le téléchargement est **bloqué** et une ligne rouge en explique la raison. Rien n'est alors téléchargé.
- Le profil colorimétrique (ICC) d'une photo peut apparaître en gris : c'est une information technique qui ne vous identifie pas et qui ne bloque rien.
- La vérification ne voit pas l'intérieur de l'image elle-même ; elle ne détecte donc pas, par exemple, les filigranes invisibles.

## Quelques remarques supplémentaires

- Le logiciel est une aide, il ne remplace pas votre propre vigilance — vérifiez toujours les parties surlignées avant de leur faire entièrement confiance, car aucun outil automatique ne détecte 100 % des cas.
- Vous voulez vérifier par vous-même qu'"aucune donnée n'est envoyée nulle part" ? Désactivez complètement le Wi-Fi/réseau de votre machine avant d'ouvrir le logiciel — vous constaterez qu'il fonctionne toujours normalement, preuve qu'aucune connexion Internet n'est utilisée.
- Vous rencontrez une erreur que vous ne comprenez pas ? Faites une capture d'écran du message d'erreur et demandez de l'aide à une personne à l'aise avec la technique (un ami, un proche) plutôt que d'essayer de deviner.
- Toutes les données téléchargées et les "termes personnalisés" (par exemple le nom d'une entreprise à masquer) sont stockés uniquement sur votre propre machine — personne d'autre ne peut les voir.
- Pour les images et les captures d'écran, laissez cochée « Analyse approfondie » : elle est plus lente, mais elle repère aussi le texte sur fond coloré. Choisissez la langue OCR qui correspond à l'image et, si quelque chose a été oublié, ouvrez « Ce que l'OCR a lu » sous l'image pour voir si le logiciel a bien lu ce texte. Il indique aussi pourquoi chaque case noire a été tracée.
- Safari avec le Lockdown Mode (mode Isolement) activé désactive une technologie (WebAssembly) dont la lecture du texte dans les images a besoin. Si vous voyez un message mentionnant WebAssembly, utilisez Firefox ou Chrome pour les images ; le texte et les fichiers Word et PowerPoint ne sont pas concernés.
- Si le logiciel oublie quelque chose dans une image (un logo, une écriture manuscrite, un QR code, un visage), activez « Dessiner une zone à masquer » puis faites glisser la souris ou le doigt dessus. Les zones dessinées sont remplies de noir uni, comme les zones automatiques, et vous pouvez les annuler.
- Pour vider d'un coup votre liste de termes personnalisés, appuyez sur « Supprimer tous les termes ». Le logiciel vous avertit d'abord que la liste sera effacée de ce navigateur et propose un fichier de sauvegarde (.json) ; il ne supprime que si vous le choisissez.
- Pour masquer des visages, appuyez sur « Détecter les visages », regardez les cadres trouvés et choisissez comment les couvrir. Seul « Noir uni (irréversible) » détruit vraiment le visage ; « Grosse mosaïque (difficile à inverser, sans garantie) » est solide sans être une garantie, et « Flou (cosmétique — partiellement réversible) » ne doit pas être utilisé quand une personne doit rester anonyme. Le détecteur trouve surtout les visages de face : vérifiez l'image et utilisez « Dessiner une zone à masquer » pour ceux qui manquent. Comme la reconnaissance de texte, il nécessite le serveur local (pas file://).
