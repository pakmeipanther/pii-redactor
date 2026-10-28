**Lire en :** [English](guide.en.md) · [Tiếng Việt](guide.vi.md) · [Deutsch](guide.de.md) · [Français](guide.fr.md)

---

# PII Redactor — Guide d'utilisation pour débutants

## À quoi sert cet outil ?

Imaginez que vous photocopiez votre pièce d'identité pour un inconnu — vous prendriez sûrement un stylo pour masquer votre nom, votre numéro de téléphone, votre adresse avant de la lui donner, n'est-ce pas ? PII Redactor fait exactement cela, mais avec du texte, des captures d'écran et des fichiers PDF — il trouve et masque automatiquement les informations sensibles (emails, numéros de téléphone, adresses IP, mots de passe, chaînes de connexion à une base de données...) avant que vous ne colliez ce contenu dans ChatGPT, Claude ou tout autre outil d'IA.

> **Le plus important :** ce logiciel n'établit aucune connexion Internet et n'envoie aucune donnée nulle part — tout le traitement se fait directement sur votre ordinateur. Vous pouvez complètement désactiver le Wi-Fi en l'utilisant, il continuera de fonctionner normalement — c'est aussi un moyen de le vérifier par vous-même.

![Démo de PII Redactor : une fausse fiche de personnel est analysée, le texte est noirci, le visage est masqué par une mosaïque et une zone supplémentaire est dessinée à la main](images/demo.gif)

*(Tout ce qui apparaît dans cet enregistrement est inventé.)*

**Ce que l'outil sait faire, en une liste** — chaque point a sa propre section plus bas :

- masquer les éléments sensibles dans un **texte** (e-mails, numéros de téléphone, adresses IP, clés, mots de passe...) ;
- tenir **votre propre liste** de mots à toujours masquer (nom d'entreprise, noms de serveurs...) ;
- signaler les **mots de passe et secrets suspects** pour que vous les confirmiez ;
- noircir le texte sensible dans les **images et captures d'écran** ;
- vous laisser vérifier, désactiver ou ajouter des **zones à la main** avant que quoi que ce soit soit enregistré ;
- repérer et masquer les **visages** dans les images ;
- nettoyer les fichiers **PDF**, et transformer les fichiers **Word** et **PowerPoint** en PDF caviardé ;
- afficher et supprimer les **métadonnées** cachées de chaque fichier, puis revérifier chaque résultat avant de vous laisser le télécharger.

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

## Étape 2 — Ouvrez le logiciel et repérez-vous

1. Ouvrez le dossier décompressé à l'étape 1 et double-cliquez sur le fichier nommé index.html. Il s'ouvre dans votre navigateur.
1. En haut à droite, choisissez votre langue (English, Français, Deutsch ou Tiếng Việt).
1. La ligne verte sous le titre indique qu'aucune connexion réseau n'est établie. C'est une promesse que vous pouvez vérifier vous-même (voir « Bonnes habitudes » à la fin).

La page se lit de haut en bas :

| Partie | À quoi elle sert |
|---|---|
| **1. Collez du texte, ou glissez-déposez / choisissez un fichier** | La grande zone de texte pour coller du texte, et une seule zone de dépôt pour tout fichier. Vous ne choisissez jamais le type de fichier : le logiciel affiche une ligne « Détecté : » et ouvre juste en dessous le panneau correspondant (image, PDF, Word ou PowerPoint). |
| **2. Termes internes personnalisés** | Votre propre liste de mots à toujours masquer. |
| **3. Types de données à détecter** | Cochez ou décochez les types de données à chercher dans le texte. |
| **4. Résultat** | Le texte avec les trouvailles surlignées, et le bouton de téléchargement. |
| **Panneau Image / PDF / Word / PowerPoint** | N'apparaît qu'après le dépôt d'un fichier de ce type. |

Quelles fonctions marchent par un simple double-clic sur index.html, et lesquelles demandent le serveur local de l'étape 3 ?

| Fonction | Double-clic sur index.html | Serveur local nécessaire (étape 3) |
|---|---|---|
| Texte, termes personnalisés, secrets suspects | oui | — |
| Fichiers Word et PowerPoint | oui | — |
| Images et captures (lecture du texte), zones dessinées à la main, visages, PDF | non (utilisez le serveur local) | oui |

Dans le doute, utilisez le serveur local : il fonctionne pour tout.

## Étape 3 (avancée, nécessaire pour les images, les visages et les PDF) — Lancez un serveur local

La lecture du texte dans les images, la détection des visages et le traitement des PDF demandent une petite étape technique supplémentaire, à cause d'une restriction de sécurité du navigateur. « Lancer un serveur local » semble effrayant, mais il s'agit simplement de taper une ligne de commande. Si vous n'avez besoin que du texte, de Word ou de PowerPoint, vous pouvez sauter cette section.

#### macOS — lancer un serveur local

1. Ouvrez l'application Terminal (appuyez sur Cmd + Espace, tapez "Terminal", appuyez sur Entrée).
1. Tapez cd (avec un espace après "cd"), puis glissez-déposez le dossier décompressé à l'étape 1 directement dans la fenêtre du Terminal — le chemin se remplira automatiquement. Appuyez sur Entrée.
1. Tapez la ligne suivante puis appuyez sur Entrée :

   ```
   python3 -m http.server 8000
   ```

   > Si un message d'erreur rouge "command not found: python3" apparaît, cela signifie que Python n'est pas installé sur votre machine. Consultez le guide d'installation détaillé de Python ci-dessous, ou utilisez simplement la fonction texte (Fonction 1), qui suffit largement.
1. Ouvrez votre navigateur et tapez dans la barre d'adresse :

   ```
   http://localhost:8000
   ```
1. Désormais, toutes les fonctions (texte, image, PDF) sont utilisables, comme décrit dans les fonctions ci-dessous.
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
1. Utilisez-le comme décrit dans les fonctions ci-dessous.
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

## Fonction 1 — Caviarder du texte

*La fonction la plus simple — rien à installer.*

1. Ouvrez index.html (étape 2).
1. Collez le texte à vérifier dans la grande zone de la partie 1 — par exemple un e-mail contenant un numéro de téléphone et une adresse.
1. Dans la partie 3, « Types de données à détecter », laissez cochés les types de données que vous voulez chercher : Email, Adresse IPv4, Adresse IPv6, Numéro de téléphone, Clé API / jeton, Numéro de carte bancaire, Chaîne de connexion base de données (sous ses deux formes), Port de connexion à la base de données, et Mot de passe / chaîne aléatoire (entropie élevée). Tout est coché au départ.
1. Cliquez sur « Analyser et surligner ».
1. Dans la partie 4, « Résultat », les trouvailles sont surlignées en rouge. Une ligne au-dessus indique combien ont été trouvées.
1. Si tout est correct, cliquez sur « Télécharger le texte nettoyé (.txt) ». Dans le fichier enregistré, chaque trouvaille est remplacée par une étiquette comme [EMAIL MASQUÉ] ou [IP MASQUÉE]. C'est la version que vous pouvez coller sans risque dans un outil d'IA.
1. « Tout effacer » vide la page pour recommencer.

> **Regardez toujours les parties surlignées avant de télécharger.** Un outil automatique est une aide, jamais une garantie.

## Fonction 2 — Votre propre liste de termes internes

Le logiciel ne peut pas deviner que « srv-db-prod-02 » ou le nom de votre entreprise est secret. Dites-le une fois, et il sera toujours masqué — dans le texte, dans les images, dans les PDF, Word et PowerPoint — sans qu'on vous le redemande.

1. Dans la partie 2, « Termes internes personnalisés », saisissez un mot ou une expression et cliquez sur « Ajouter ». Il apparaît sous forme de petite étiquette ; cliquez sur « Supprimer » de l'étiquette pour la retirer.
1. Cochez « Sensible à la casse » seulement si les majuscules comptent (par exemple pour masquer « Falcon » mais pas « falcon »).
1. Les termes sont conservés dans votre navigateur, uniquement sur votre ordinateur : ils sont donc encore là la prochaine fois.
1. « Exporter la liste (.json) » enregistre votre liste dans un fichier (sauvegarde, ou moyen de la transférer sur un autre ordinateur). « Importer une liste (.json) » charge un tel fichier.
1. Dans les images, un terme est aussi reconnu quand le texte de l'image a d'autres accents ou (si « Sensible à la casse » n'est pas coché) d'autres majuscules ; les expressions réparties sur deux lignes sont également trouvées. Si vos termes contiennent des lettres accentuées alors que la langue OCR est l'anglais, le logiciel vous avertit — choisissez la vraie langue de l'image (Fonction 4).

### Vider toute la liste : « Supprimer tous les termes »

Quand la liste est longue, retirer les termes un par un est pénible. « Supprimer tous les termes » les retire tous, mais jamais au premier clic, car la liste ne peut pas être récupérée ensuite :

1. Un avertissement apparaît : les termes seront effacés du stockage local de ce navigateur et ne pourront pas être récupérés.
1. Choisissez « Exporter d'abord la liste (.json) » pour enregistrer une sauvegarde. Le logiciel redemande ensuite confirmation (« Sauvegarde exportée. Supprimer maintenant … termes personnalisés ? »).
1. Ou choisissez « Supprimer sans exporter » si vous n'avez vraiment pas besoin de sauvegarde.
1. Seul « Supprimer maintenant » supprime. « Annuler » (ou la touche Échap) ferme l'avertissement et garde tout.

## Fonction 3 — Mots de passe et secrets suspects

Certains secrets n'ont pas de forme reconnaissable : un mot de passe qui a l'air aléatoire, un jeton. Le logiciel repère les chaînes qui semblent aléatoires (« entropie élevée »), mais comme il peut se tromper, il **ne** les masque **pas** tout seul.

- **Dans un texte :** les suspects sont marqués, avec l'infobulle « Mot de passe/secret suspecté (entropie élevée) — cliquez pour confirmer le masquage ». Cliquez sur l'un d'eux pour le confirmer (« Confirmé — sera masqué au téléchargement ») ; cliquez à nouveau pour annuler la confirmation.
- **Dans une image :** les suspects reçoivent un **contour jaune** et les pixels **ne sont pas** encore effacés. Une liste sous l'image, « Mots de passe/secrets suspectés (entropie élevée) — cochez pour confirmer le masquage », vous permet de cocher ceux à noircir ; l'image se redessine aussitôt.
- **Dans les fichiers Word et PowerPoint :** les suspects sont seulement signalés. Si l'un d'eux est vraiment un secret, ajoutez-le à votre liste personnalisée (Fonction 2) et convertissez à nouveau.
- Vous pouvez désactiver complètement cette détection en décochant « Mot de passe / chaîne aléatoire (entropie élevée) » dans « Types de données à détecter ».

## Fonction 4 — Images et captures d'écran

1. Déposez une image (PNG, JPEG ou WEBP) sur la zone de dépôt, ou cliquez dessus pour en choisir une. Vous pouvez aussi **coller** une capture d'écran avec Ctrl+V (Cmd+V sur Mac) n'importe où sur la page : elle est reconnue comme une image et n'est pas insérée comme texte.
1. La ligne « Détecté : » affiche « Image / capture d'écran » et le panneau « Image / capture d'écran » s'ouvre. Au-dessus, « Métadonnées du fichier d'origine » montre ce que l'image transporte (Fonction 10).
1. Sous « Langue OCR : », choisissez la langue **dans laquelle l'image est écrite**. Un mauvais choix fait mal lire le texte et peut laisser passer des mots sensibles.
1. Laissez « Analyse approfondie (plus lente) » cochée. Elle relit l'image plusieurs fois avec un traitement des couleurs différent, ce qui permet de trouver le texte sur fond coloré, les lettres claires sur titres foncés et les polices fantaisie.
1. Cliquez sur « Analyser et noircir les zones sensibles ». La première fois, le modèle de lecture est chargé (quelques secondes) ; vous voyez ensuite la progression et une ligne comme « Terminé — 3 zone(s) sensible(s) noircie(s) dans l'image. »
1. Regardez l'image. De vrais rectangles noirs couvrent les trouvailles. Les contours jaunes sont des suspects à confirmer (Fonction 3). Vérifiez la liste des zones (Fonction 5) et ajoutez ce qui a été oublié (Fonction 6, Fonction 7).
1. Cliquez sur « Télécharger l'image traitée » (le bouton indique aussi le type de fichier : .png, .jpg ou .webp) ou sur « Télécharger en PDF ».
1. « Tout effacer » dans le panneau retire l'image et permet de recommencer.

**C'est une vraie suppression.** L'image finale est reconstruite à partir de votre original intact : les pixels sensibles sont écrasés par du noir, et non cachés sous une couche transparente, donc personne ne peut retirer le noir pour voir ce qu'il y avait dessous.

**Si le logiciel a manqué quelque chose**, ouvrez « Ce que l'OCR a lu (et pourquoi chaque zone a été noircie) » sous l'image. Vous y voyez le texte lu par le logiciel et la raison de chaque rectangle noir. Si le mot attendu n'y figure pas, le logiciel ne l'a pas lu — choisissez la bonne langue, gardez « Analyse approfondie » active, ou couvrez l'endroit à la main.

## Fonction 5 — La liste des zones masquées

Sous l'image, « Zones qui seront masquées : N (M dessinées par vous) » liste **tout** ce qui sera caché : ce que le logiciel a trouvé seul, les visages et les zones que vous avez dessinées. Tout vit dans cette liste unique.

- Chaque ligne a une case. **Décochez-la** pour laisser la zone visible (par exemple une fausse alerte) ; cochez-la à nouveau pour la masquer.
- Une ligne se lit « Automatique : le type de données — le texte », « Visage n° 1 » ou « Zone dessinée n° 1 ».
- Survolez une ligne (ou rejoignez-la avec la touche Tab) : un cadre bleu en pointillés montre où elle se trouve sur l'image.
- Les zones que vous avez dessinées ont un bouton « Supprimer ».
- L'image et le téléchargement suivent toujours cette liste : ce qui est coché est masqué, ce qui ne l'est pas ne l'est pas.
- Une nouvelle analyse du texte remplace les zones de texte automatiques ; les visages et les zones dessinées sont conservés.

## Fonction 6 — Dessiner des zones à la main

Pour tout ce que le logiciel ne sait pas lire : un logo, une écriture manuscrite, un QR code, un nom sur un badge, un visage.

1. Cliquez sur « Dessiner une zone à masquer » pour activer l'outil (le bouton reste allumé).
1. Faites glisser sur la zone avec la souris, le doigt ou un stylet. Un cadre bleu clair vous suit ; relâchez pour valider. Échap annule le tracé en cours. Un simple clic est ignoré.
1. La nouvelle zone est remplie de noir uni, comme les zones automatiques, et apparaît dans la liste sous « Zone dessinée n° … ».
1. « Annuler » et « Rétablir » (aussi Ctrl/Cmd+Z, Maj+Ctrl/Cmd+Z et Ctrl+Y) font avancer et reculer à travers tout ce que vous modifiez — dessiner, supprimer, cocher ou décocher une zone.
1. « Supprimer mes zones dessinées » efface tous vos dessins d'un coup (vous pouvez encore annuler).
1. Le dessin fonctionne sans analyse : vous pouvez donc simplement noircir des parties d'une image à la main et la télécharger.

## Fonction 7 — Masquer les visages

1. Chargez une image (Fonction 4). Il n'est pas nécessaire d'analyser le texte d'abord.
1. Sous « Masquer les visages avec : », choisissez comment les visages seront couverts :
   - **« Noir uni (irréversible) »** — les pixels sont remplacés ; il ne reste rien du visage. Choisissez-le chaque fois qu'une personne ne doit pas être reconnue.
   - **« Grosse mosaïque (difficile à inverser, sans garantie) »** — chaque gros bloc garde une seule couleur moyenne. Très difficile à annuler, mais ce n'est pas une garantie mathématique.
   - **« Flou (cosmétique — partiellement réversible) »** — un effet de lissage qui peut parfois être en partie reconstitué. Ne comptez pas dessus pour protéger l'identité de quelqu'un ; le logiciel affiche un avertissement quand vous le choisissez.
1. Cliquez sur « Détecter les visages ». Un message indique combien ont été trouvés (« 1 visage trouvé. »).
1. Chaque visage apparaît dans la liste des zones (Fonction 5) sous « Visage n° 1 », « Visage n° 2 »... Décochez une ligne pour laisser ce visage visible. Changer de style met l'image à jour immédiatement.
1. **Le détecteur n'est fiable que pour les visages tournés à peu près vers l'objectif.** Les visages de profil, petits, cachés ou mal éclairés peuvent être manqués : regardez donc toujours l'image et couvrez les visages oubliés avec « Dessiner une zone à masquer » (Fonction 6). Les zones dessinées sont toujours en noir uni.
1. Le détecteur fonctionne entièrement dans votre navigateur (un petit programme et son fichier de données se trouvent dans le dossier vendor du logiciel). Il fonctionne même dans Safari avec le mode Isolement (Lockdown Mode). Il demande le serveur local (étape 3) ; sans lui, vous obtenez un message et pouvez toujours dessiner à la main.

## Fonction 8 — Fichiers PDF

1. Déposez le PDF sur la zone de dépôt. Le panneau « Fichier PDF » s'ouvre.
1. Si le PDF est un **scan ou une photo** d'un papier (vous ne pouvez pas sélectionner son texte), cochez « Exécuter aussi l'OCR sur chaque page — utile seulement si le PDF est un scan/image (pas de couche de texte sélectionnable), plus lent », et choisissez « Langue OCR (si activé) : ». Pour un PDF créé sur ordinateur, cette case est inutile.
1. Cliquez sur « Analyser et noircir le PDF ». Vous voyez la progression page par page.
1. Cliquez sur « Télécharger le PDF traité ».

Fonctionnement : chaque page est **redessinée sous forme d'image**, les parties sensibles sont noircies sur cette image, puis les images sont réunies en un nouveau PDF. La couche de texte d'origine et les métadonnées ne survivent donc pas. Le prix à payer : le résultat se comporte comme un document scanné — vous ne pouvez plus en sélectionner ni en copier le texte.

La détection des visages et les zones dessinées à la main n'existent que dans le panneau Image. Si un PDF contient une photo avec des visages, enregistrez cette page comme image et traitez-la dans le panneau Image.

## Fonction 9 — Fichiers Word et PowerPoint

1. Déposez le fichier .docx ou .pptx. Le panneau « Fichier Word (.docx) » ou « Fichier PowerPoint (.pptx) » s'ouvre.
1. Cliquez sur « Convertir et caviarder → PDF », puis sur « Télécharger le PDF traité » (le fichier s'appelle texte-caviarde.pdf ou diapositives-caviardees.pdf).

Ce que vous obtenez est volontairement un **PDF en texte brut**, jamais une copie de votre fichier d'origine, car un fichier Word ou PowerPoint peut cacher beaucoup de choses (commentaires, anciennes versions, notes, objets incorporés). La mise en page, les tableaux, les images, les graphiques et les animations ne sont donc **pas** conservés. Les commentaires et le texte supprimé sous suivi des modifications ne sont pas inclus, et les notes du présentateur d'un fichier PowerPoint non plus — seulement le texte visible sur les pages ou les diapositives. Si vous avez besoin de la mise en page, enregistrez d'abord le fichier en PDF vous-même et déposez ce PDF (Fonction 8).

## Fonction 10 — La vérification des métadonnées

Les « métadonnées » sont des informations cachées à l'intérieur d'un fichier, que vous ne voyez pas quand vous l'ouvrez : qui l'a créé, avec quel programme, quand — et parfois même où (une photo peut contenir la position GPS de l'endroit où elle a été prise).

- **Quand vous déposez un fichier** (une image, un PDF, un fichier Word ou PowerPoint), un encadré « Métadonnées du fichier d'origine » apparaît sous la ligne « Détecté : ». Il liste ce que le fichier transporte, avec les valeurs réelles, pour que vous voyiez exactement ce qui aurait été partagé. Cliquez sur « Masquer les valeurs » si vous voulez cacher les valeurs (par exemple pendant un partage d'écran) ; les noms des champs restent visibles. Ces valeurs ne sont affichées que sur votre ordinateur.
- **Le fichier que vous téléchargez est reconstruit de zéro**, aucune de ces informations n'y est donc copiée.
- **Avant chaque téléchargement, l'outil revérifie le résultat.** Si tout est propre, vous voyez une ligne verte : « Vérifié : le fichier … exporté ne contient aucune métadonnée identifiante. » S'il reste quelque chose — ou si l'outil n'est pas sûr —, le téléchargement est **bloqué** et une ligne rouge explique pourquoi. Rien n'est alors téléchargé.
- Le profil colorimétrique (ICC) d'une photo peut apparaître en gris : c'est une information technique qui ne vous identifie pas et qui ne bloque rien.
- La vérification ne peut pas regarder à l'intérieur de l'image elle-même ; elle ne peut donc pas détecter des choses comme les filigranes invisibles.

## Quand quelque chose ne fonctionne pas

| Ce que vous voyez | Que faire |
|---|---|
| Un message sur le fichier (file://) ou « Erreur lors du traitement de l'image » | Les images, les visages et les PDF demandent le serveur local — voir l'étape 3. Le texte, Word et PowerPoint non. |
| Un message sur **WebAssembly** (Safari avec le mode Isolation / **Lockdown Mode**) | Le Lockdown Mode désactive WebAssembly, dont la lecture du texte dans les images a besoin. Utilisez Firefox ou Chrome pour les images, ou excluez ce site du Lockdown Mode dans les réglages du site de Safari. Le texte, les fichiers Word et PowerPoint, le dessin à la main et la détection des visages fonctionnent toujours. |
| Un mot sensible n'a pas été masqué dans une image | Vérifiez « Langue OCR : », gardez « Analyse approfondie » active, ouvrez « Ce que l'OCR a lu », puis ajoutez le mot à votre liste personnalisée ou couvrez-le à la main. |
| Un rectangle noir couvre quelque chose d'inoffensif | Décochez cette ligne dans la liste des zones (Fonction 5). |
| « Ce format de fichier n'a pas été reconnu » | Pris en charge : texte (.txt), images (PNG, JPEG, WEBP), PDF, Word (.docx), PowerPoint (.pptx). |
| Une ligne rouge « TÉLÉCHARGEMENT BLOQUÉ » | La vérification finale a trouvé quelque chose qu'elle n'a pas pu écarter (Fonction 10). Rien n'a été téléchargé ; merci de le signaler sur la page GitHub du projet. |

Toujours bloqué ? Faites une capture d'écran (sans contenu sensible) et demandez à quelqu'un d'à l'aise avec la technique plutôt que de deviner.

## Bonnes habitudes

- Le logiciel est une aide, pas un remplaçant de votre propre vigilance : vérifiez toujours avant de faire confiance, car aucun outil ne détecte 100 % des cas.
- Vous voulez vérifier qu'« aucune donnée n'est envoyée nulle part » ? Coupez le Wi-Fi/le réseau avant d'ouvrir le logiciel. Il fonctionne toujours normalement — et la page elle-même interdit aussi toute connexion sortante.
- Tout ce que vous chargez reste sur votre ordinateur. Seuls vos termes personnalisés sont mémorisés, dans votre propre navigateur.
- Utilisez de fausses données pour essayer le logiciel.
- Pour toute personne dont l'identité doit rester secrète : utilisez « Noir uni » pour les visages, vérifiez les bords de l'image, l'arrière-plan et les reflets à la recherche d'autres indices, et gardez l'original loin des outils d'IA.
