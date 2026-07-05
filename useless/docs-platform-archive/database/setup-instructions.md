# Instructions pour configurer la base de données Supabase

Ce document fournit des instructions détaillées pour configurer la base de données Supabase pour la plateforme de documentation collaborative.

## Étape 1 : Créer un projet Supabase

Si vous n'avez pas encore de projet Supabase :

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Connectez-vous ou créez un compte
3. Cliquez sur "New Project"
4. Remplissez les informations requises :
   - Nom du projet
   - Base de données mot de passe (conservez-le en lieu sûr)
   - Région (choisissez la plus proche de vos utilisateurs)
5. Cliquez sur "Create new project"

## Étape 2 : Configurer l'authentification

1. Dans le dashboard Supabase, allez dans "Authentication" > "Settings"
2. Sous "Email Auth", assurez-vous que "Enable Email Signup" est activé
3. Configurez les paramètres de redirection :
   - Site URL: `http://localhost:4321` (en développement)
   - Redirect URLs: 
     - `http://localhost:4321/docs/dashboard`
     - `http://localhost:4321/docs/login`

## Étape 3 : Créer les tables et politiques

1. Dans le dashboard Supabase, allez dans "SQL Editor"
2. Cliquez sur "New Query"
3. Copiez le contenu du fichier `schema.sql` dans l'éditeur
4. Cliquez sur "Run" pour exécuter le script

Si le script est trop long, vous pouvez le diviser en plusieurs parties :

1. D'abord, exécutez la partie qui crée les tables (jusqu'à la ligne "-- POLITIQUES DE SÉCURITÉ (RLS)")
2. Ensuite, exécutez la partie qui active RLS sur les tables
3. Enfin, exécutez les politiques de sécurité pour chaque table

## Étape 4 : Configurer les variables d'environnement

1. Dans le dashboard Supabase, allez dans "Settings" > "API"
2. Copiez la "Project URL" et la "anon key"
3. Créez un fichier `.env` à la racine de votre projet en vous basant sur `.env.example`
4. Collez les valeurs copiées dans le fichier `.env`

## Étape 5 : Vérifier l'installation

Pour vérifier que tout est correctement configuré :

1. Allez dans "Table Editor" dans le dashboard Supabase
2. Vous devriez voir toutes les tables créées (users, workspaces, projects, etc.)
3. Allez dans "Authentication" > "Policies"
4. Vérifiez que toutes les politiques RLS sont bien en place

## Étape 6 : Tester l'application

1. Démarrez votre serveur de développement : `bun run dev`
2. Accédez à http://localhost:4321/docs
3. Essayez de créer un compte et de vous connecter
4. Testez la création d'un espace de travail, d'un projet et d'une documentation

## Résolution des problèmes courants

### Erreur "relation does not exist"

Si vous obtenez une erreur indiquant qu'une relation n'existe pas, cela signifie que la table n'a pas été créée correctement. Vérifiez :

1. Que vous avez exécuté le script SQL complet
2. Qu'il n'y a pas eu d'erreurs lors de l'exécution du script
3. Que vous êtes bien connecté à la bonne base de données

### Erreur "permission denied"

Si vous obtenez une erreur de permission, cela peut être dû à :

1. Des politiques RLS mal configurées
2. Un problème avec l'authentification
3. Un utilisateur qui tente d'accéder à des ressources auxquelles il n'a pas droit

Vérifiez les politiques RLS dans le dashboard Supabase et assurez-vous qu'elles correspondent à celles du fichier `schema.sql`.

### Erreur "JWT expired"

Si vous obtenez une erreur indiquant que le JWT a expiré, déconnectez-vous et reconnectez-vous à l'application.

## Maintenance

Pour maintenir votre base de données :

1. Effectuez régulièrement des sauvegardes via le dashboard Supabase
2. Surveillez l'utilisation et les performances
3. Mettez à jour les politiques de sécurité si nécessaire
