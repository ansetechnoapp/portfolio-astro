# Schéma de Base de Données - Plateforme de Documentation

Ce dossier contient le schéma de base de données pour la plateforme de documentation collaborative.

## Structure des Tables

Le schéma comprend les tables suivantes :

1. **users** - Profils utilisateurs liés à auth.users de Supabase
2. **workspaces** - Espaces de travail pour organiser les projets
3. **workspace_members** - Membres des espaces de travail avec leurs rôles
4. **projects** - Projets au sein des espaces de travail
5. **documentation** - Documents de documentation pour les projets
6. **api_endpoints** - Points d'API documentés pour les projets
7. **documentation_sections** - Sections de documentation
8. **comments** - Commentaires sur la documentation

## Politiques de Sécurité (RLS)

Le schéma inclut également des politiques de sécurité Row Level Security (RLS) pour contrôler l'accès aux données :

- Chaque utilisateur ne peut voir que ses propres données ou les données auxquelles il a accès
- Les propriétaires d'espaces de travail peuvent gérer leurs espaces et inviter des membres
- Les membres avec le rôle "editor" peuvent créer et modifier la documentation
- Les membres avec le rôle "viewer" peuvent uniquement consulter la documentation

## Comment Utiliser ce Schéma

### Première Installation

Pour créer toutes les tables et politiques de sécurité dans votre base de données Supabase :

1. Connectez-vous à votre dashboard Supabase (https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans "SQL Editor"
4. Créez une nouvelle requête
5. Copiez-collez le contenu du fichier `schema.sql`
6. Exécutez la requête

### Mise à Jour du Schéma

Si vous devez modifier le schéma de la base de données :

1. Mettez à jour le fichier `schema.sql` avec vos modifications
2. Créez une nouvelle requête SQL dans l'éditeur Supabase avec uniquement les modifications
3. Exécutez la requête
4. Documentez les changements dans ce README

## Variables d'Environnement

Assurez-vous que votre fichier `.env` contient les variables suivantes :

```
PUBLIC_SUPABASE_URL=votre_url_supabase
PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
```

Ces variables sont utilisées dans `src/lib/supabase.ts` pour se connecter à votre base de données Supabase.

## Diagramme de la Base de Données

Voici un aperçu des relations entre les tables :

```
users
 ↑
 ├─────────────────┐
 │                 │
workspaces ────────┼─── workspace_members
 ↑                 │
 │                 │
projects           │
 ↑                 │
 ├─────────┐       │
 │         │       │
documentation  api_endpoints
 ↑
 │
documentation_sections
 ↑
 │
comments ──────────┘
```

## Maintenance

Pour maintenir votre base de données :

1. Effectuez régulièrement des sauvegardes via le dashboard Supabase
2. Surveillez les performances des requêtes et ajoutez des index si nécessaire
3. Mettez à jour ce fichier et `schema.sql` lorsque vous apportez des modifications au schéma

## Résolution des Problèmes

Si vous rencontrez des erreurs lors de l'exécution du script SQL :

1. Vérifiez que vous avez les droits d'administrateur sur la base de données
2. Exécutez les commandes par petits groupes pour identifier où se trouve l'erreur
3. Consultez les logs dans le dashboard Supabase
