# Requirements Document

## Introduction

Le Générateur de Cours est une transformation de la page Oracle existante en un outil permettant de générer des cours de mathématiques adaptés à un public cible. Le système scanne le répertoire `docs/cours/` pour lister les cours LaTeX disponibles, permet à l'utilisateur de sélectionner un niveau d'audience, puis utilise un fournisseur d'IA (shai, kiro ou openai) pour adapter le contenu mathématique au niveau choisi et produire un fichier PDF téléchargeable.

## Glossary

- **Générateur_de_Cours** : Le système complet (frontend + backend) permettant de générer des cours adaptés à un public cible
- **Page_Générateur** : La page React frontend qui remplace l'ancienne page Oracle, offrant l'interface utilisateur du générateur
- **Service_Backend** : Le module FastAPI backend responsable du scan des cours, de l'appel IA et de la génération PDF
- **Fournisseur_IA** : Un des fournisseurs d'intelligence artificielle disponibles (shai, kiro, openai) utilisé pour adapter le contenu
- **Cours_Source** : Un fichier LaTeX (.tex) situé dans `docs/cours/` contenant le contenu mathématique original
- **Audience_Cible** : Le niveau académique ou professionnel pour lequel le cours sera adapté
- **Cours_Adapté** : Le contenu LaTeX résultant de l'adaptation par l'IA au niveau de l'audience cible
- **PDF_Généré** : Le fichier PDF compilé à partir du Cours_Adapté, prêt au téléchargement

## Requirements

### Exigence 1 : Lister les cours disponibles

**User Story :** En tant qu'utilisateur, je veux voir la liste des cours disponibles, afin de choisir le cours que je souhaite adapter.

#### Critères d'acceptation

1. WHEN la Page_Générateur est chargée, THE Service_Backend SHALL scanner le répertoire `docs/cours/` et retourner la liste des sous-répertoires contenant au moins un fichier `.tex`, dans un délai maximum de 5 secondes
2. WHEN la liste des cours est reçue, THE Page_Générateur SHALL afficher chaque cours disponible avec son nom formaté (remplacement des points par des espaces), triés par ordre alphabétique croissant
3. IF le répertoire `docs/cours/` est vide ou si une erreur d'accès au système de fichiers survient lors du scan, THEN THE Service_Backend SHALL retourner une liste vide avec un code HTTP 200
4. IF aucun cours n'est disponible dans la liste reçue, THEN THE Page_Générateur SHALL afficher un message indiquant à l'utilisateur qu'aucun cours n'est disponible et qu'il doit contacter un administrateur pour en ajouter

### Exigence 2 : Sélectionner le public cible

**User Story :** En tant qu'utilisateur, je veux sélectionner un niveau d'audience pour le cours généré, afin d'obtenir un contenu adapté à mon niveau ou celui de mes étudiants.

#### Critères d'acceptation

1. THE Page_Générateur SHALL afficher les niveaux d'audience suivants dans un sélecteur à choix unique, dans cet ordre :
   - Élève de Seconde (15-16 ans, lycée)
   - Élève de Terminale (17-18 ans, lycée)
   - Étudiant en Licence (L1-L3, université)
   - Étudiant en Master Mathématiques
   - Élève ingénieur Grande École
   - Professeur des universités
   - Chercheur en entreprise / laboratoire
2. WHEN l'utilisateur sélectionne un niveau d'audience, THE Page_Générateur SHALL afficher visuellement le niveau sélectionné comme actif et conserver cette sélection pour la génération
3. IF un niveau d'audience est sélectionné ET un cours est également sélectionné, THEN THE Page_Générateur SHALL activer le bouton de génération
4. IF aucun cours n'est sélectionné (indépendamment du niveau d'audience sélectionné), THEN THE Page_Générateur SHALL désactiver le bouton de génération
5. THE Page_Générateur SHALL présélectionner le niveau "Étudiant en Licence (L1-L3, université)" par défaut au chargement de la page

### Exigence 3 : Sélectionner le fournisseur d'IA

**User Story :** En tant qu'utilisateur, je veux pouvoir choisir le fournisseur d'IA utilisé pour l'adaptation, afin d'utiliser le modèle le plus adapté à mes besoins.

#### Critères d'acceptation

1. THE Page_Générateur SHALL afficher un sélecteur de fournisseur d'IA avec les options : shai (OVH), kiro (AWS), openai (GPT-4)
2. THE Page_Générateur SHALL présélectionner le fournisseur "shai" par défaut lors du chargement initial de la page
3. WHILE une génération est en cours (entre la soumission de la requête et la réception complète de la réponse ou d'une erreur), THE Page_Générateur SHALL désactiver le sélecteur de fournisseur d'IA de sorte que l'utilisateur ne puisse pas modifier la valeur
4. WHEN l'utilisateur lance une génération, THE Page_Générateur SHALL transmettre la valeur du fournisseur sélectionné dans la requête envoyée au backend
5. IF le fournisseur sélectionné retourne une erreur lors de la génération, THEN THE Page_Générateur SHALL afficher un message d'erreur indiquant l'indisponibilité du fournisseur et réactiver le sélecteur

### Exigence 4 : Générer un cours adapté

**User Story :** En tant qu'utilisateur, je veux lancer la génération d'un cours adapté à mon public cible, afin d'obtenir un document pédagogique approprié.

#### Critères d'acceptation

1. WHEN l'utilisateur clique sur le bouton "Générer", THE Service_Backend SHALL lire le fichier `.tex` du Cours_Source sélectionné et envoyer son contenu au Fournisseur_IA avec l'Audience_Cible sélectionnée
2. WHEN le fichier `.tex` est lu, THE Service_Backend SHALL construire un prompt demandant au Fournisseur_IA d'adapter le contenu mathématique au niveau de l'Audience_Cible sélectionnée en conservant l'intégralité des commandes LaTeX structurelles (sections, environnements mathématiques, théorèmes, définitions, preuves)
3. WHEN le Fournisseur_IA retourne le Cours_Adapté, THE Service_Backend SHALL retourner le contenu LaTeX généré et THE Page_Générateur SHALL afficher le résultat dans une zone de visualisation dédiée permettant à l'utilisateur de consulter et copier le contenu
4. WHILE la génération est en cours, THE Page_Générateur SHALL afficher un indicateur visuel animé accompagné d'un texte informant l'utilisateur que le traitement est en cours
5. WHILE la génération est en cours, THE Page_Générateur SHALL désactiver le bouton "Générer" et les sélecteurs de cours et d'audience
6. IF le Fournisseur_IA échoue ou ne répond pas dans un délai de 120 secondes, THEN THE Service_Backend SHALL retourner une erreur indiquant la cause de l'échec (timeout, indisponibilité du fournisseur, ou erreur de traitement)
7. IF une erreur survient pendant la génération, THEN THE Page_Générateur SHALL afficher un message d'erreur indiquant la nature du problème, masquer l'indicateur de progression et réactiver le bouton "Générer" ainsi que les sélecteurs
8. IF l'utilisateur clique sur "Générer" sans avoir sélectionné un Cours_Source et une Audience_Cible, THEN THE Page_Générateur SHALL maintenir le bouton "Générer" désactivé tant que les deux sélections ne sont pas effectuées
9. WHEN la génération est terminée avec succès, THE Page_Générateur SHALL masquer l'indicateur de progression, réactiver les contrôles et afficher le Cours_Adapté dans un format permettant la copie et le téléchargement du fichier `.tex` résultant

### Exigence 5 : Générer le PDF à partir du cours adapté

**User Story :** En tant qu'utilisateur, je veux que le cours adapté soit compilé en PDF, afin d'obtenir un document prêt à l'impression et à la distribution.

#### Critères d'acceptation

1. WHEN le Cours_Adapté est produit par le Fournisseur_IA, THE Service_Backend SHALL compiler le contenu LaTeX en fichier PDF via un compilateur LaTeX (pdflatex ou équivalent) dans un délai maximum de 120 secondes
2. WHEN la compilation PDF réussit, THE Service_Backend SHALL stocker le PDF_Généré pendant une durée de 60 minutes et retourner un identifiant de téléchargement au frontend
3. IF la compilation LaTeX échoue, THEN THE Service_Backend SHALL retourner une erreur HTTP 422 avec le message d'erreur du compilateur tronqué à 2000 caractères maximum
4. IF la compilation LaTeX échoue, THEN THE Page_Générateur SHALL afficher un message indiquant que la génération du PDF a échoué, conserver les paramètres saisis par l'utilisateur, et suggérer de réessayer avec un autre fournisseur d'IA
5. IF la compilation LaTeX dépasse le délai de 120 secondes, THEN THE Service_Backend SHALL interrompre le processus de compilation et retourner une erreur indiquant un dépassement de délai

### Exigence 6 : Télécharger le PDF généré

**User Story :** En tant qu'utilisateur, je veux télécharger le PDF généré, afin de l'utiliser hors ligne pour mes cours ou études.

#### Critères d'acceptation

1. WHEN la génération du PDF est terminée avec succès, THE Page_Générateur SHALL afficher un bouton "Télécharger le PDF" dans un délai maximum de 1 seconde après la fin de la génération
2. WHEN l'utilisateur clique sur "Télécharger le PDF", THE Service_Backend SHALL servir le fichier PDF avec le header `Content-Disposition: attachment` et un nom de fichier au format `{nom_cours}_{audience}.pdf` où les caractères spéciaux et espaces dans nom_cours et audience sont remplacés par des underscores, et le nom de fichier total est tronqué à 100 caractères maximum (extension incluse)
3. THE Service_Backend SHALL conserver les fichiers PDF générés pendant une durée maximale de 1 heure avant suppression automatique
4. IF le fichier PDF demandé n'existe plus (expiré), THEN THE Service_Backend SHALL retourner une erreur HTTP 404 avec un message indiquant que le fichier a expiré et THE Page_Générateur SHALL proposer à l'utilisateur de relancer la génération
5. IF une requête de téléchargement ne contient pas un jeton JWT valide, THEN THE Service_Backend SHALL rejeter la requête avec une erreur HTTP 401
6. IF un utilisateur authentifié tente de télécharger un fichier PDF qui ne lui appartient pas, THEN THE Service_Backend SHALL rejeter la requête avec une erreur HTTP 403

### Exigence 7 : Authentification et autorisation

**User Story :** En tant qu'administrateur, je veux que seuls les utilisateurs authentifiés puissent générer des cours, afin de contrôler l'utilisation des ressources IA.

#### Critères d'acceptation

1. THE Service_Backend SHALL exiger un token JWT valide (non expiré, non révoqué, et associé à un utilisateur existant) pour les endpoints de génération de cours et de téléchargement de cours
2. IF une requête vers un endpoint protégé ne contient pas de token JWT ou contient un token invalide, expiré ou révoqué, THEN THE Service_Backend SHALL retourner une erreur HTTP 401 avec un code d'erreur indiquant la raison du rejet (token absent, invalide, expiré ou révoqué)
3. THE Service_Backend SHALL appliquer un rate limit de 5 générations de cours par fenêtre glissante de 60 minutes par utilisateur authentifié, identifié par son identifiant utilisateur extrait du token JWT
4. IF un utilisateur authentifié dépasse la limite de 5 générations de cours dans une fenêtre glissante de 60 minutes, THEN THE Service_Backend SHALL rejeter la requête avec une erreur HTTP 429 et un message indiquant le dépassement de la limite autorisée

### Exigence 8 : Interface utilisateur de la page Générateur

**User Story :** En tant qu'utilisateur, je veux une interface claire et intuitive pour générer mes cours, afin de naviguer facilement dans le processus de génération.

#### Critères d'acceptation

1. THE Page_Générateur SHALL remplacer l'ancienne page Oracle et conserver la route `/oracle` dans l'application
2. THE Page_Générateur SHALL organiser l'interface en trois sections visibles simultanément, numérotées et libellées : (1) sélection du cours, (2) sélection de l'audience, (3) génération et téléchargement
3. THE Page_Générateur SHALL être responsive de sorte que tous les éléments interactifs soient visibles et utilisables sans défilement horizontal sur écrans de bureau (≥1024px) et tablettes (≥768px)
4. WHILE aucun cours n'est sélectionné, THE Page_Générateur SHALL désactiver le bouton "Générer" et afficher un attribut visuel indiquant que le bouton est inactif (opacité réduite et curseur non-cliquable)
5. WHEN la génération est terminée avec succès, THE Page_Générateur SHALL afficher une notification de succès contenant le nom du cours généré, visible pendant au moins 5 secondes ou jusqu'à fermeture manuelle par l'utilisateur
6. WHILE une génération est en cours, THE Page_Générateur SHALL afficher un indicateur de chargement dans la section "génération et téléchargement" et désactiver les sélecteurs de cours, d'audience et de fournisseur d'IA

### Exigence 9 : Construction du prompt d'adaptation

**User Story :** En tant que développeur, je veux que le prompt envoyé à l'IA soit structuré de manière à produire un cours cohérent et adapté, afin de garantir la qualité du contenu généré.

#### Critères d'acceptation

1. WHEN le prompt est construit, THE Service_Backend SHALL inclure le contenu intégral du fichier `.tex` source dans le contexte du prompt, sans troncature ni modification
2. WHEN le prompt est construit, THE Service_Backend SHALL inclure une section d'instructions d'adaptation contenant : le niveau d'audience cible sélectionné, une directive de vocabulaire (terminologie attendue pour ce niveau), une directive de niveau de détail (profondeur des explications), et une directive d'exemples (type et quantité d'exemples attendus)
3. WHEN le prompt est construit, THE Service_Backend SHALL demander au Fournisseur_IA de produire une réponse en LaTeX valide qui préserve les environnements mathématiques du document source (theorem, definition, proof, equation, align) et les packages utilisés (amsmath, amssymb, amsthm)
4. WHEN le prompt est construit pour un niveau "Élève de Seconde" ou "Élève de Terminale", THE Service_Backend SHALL inclure les directives suivantes : remplacer les démonstrations formelles par des justifications intuitives, ajouter au moins un exemple numérique par théorème ou propriété, et utiliser un vocabulaire accessible sans jargon universitaire
5. WHEN le prompt est construit pour un niveau "Chercheur" ou "Professeur des universités", THE Service_Backend SHALL inclure les directives suivantes : développer les preuves complètes avec les étapes intermédiaires, ajouter au minimum 3 références bibliographiques pertinentes au domaine, et utiliser la terminologie formelle du champ de recherche
6. WHEN le prompt est construit pour un niveau "Étudiant en Licence", "Étudiant en Master Mathématiques" ou "Élève ingénieur Grande École", THE Service_Backend SHALL inclure les directives suivantes : conserver les démonstrations avec des explications intermédiaires, ajouter des exemples d'application pour illustrer les résultats, et adapter le vocabulaire au niveau universitaire correspondant
7. WHEN le prompt est construit, THE Service_Backend SHALL inclure une directive exigeant que le contenu généré soit rédigé intégralement en langue française
