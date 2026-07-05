-- Documentation Platform Database Schema
-- Ce fichier contient toutes les définitions de tables et politiques de sécurité
-- pour la plateforme de documentation collaborative.

-- =============================================
-- TABLES
-- =============================================

-- Création de la table users (liée à auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table workspace_members
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Création de la table projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table documentation
CREATE TABLE documentation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  version TEXT DEFAULT '1.0.0',
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (project_id, slug)
);

-- Création de la table api_endpoints
CREATE TABLE api_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS')),
  summary TEXT,
  description TEXT,
  request_body JSONB,
  responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (project_id, path, method)
);

-- Création de la table documentation_sections
CREATE TABLE documentation_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  documentation_id UUID NOT NULL REFERENCES documentation(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  documentation_id UUID REFERENCES documentation(id) ON DELETE CASCADE,
  section_id UUID REFERENCES documentation_sections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (documentation_id IS NOT NULL AND section_id IS NULL) OR
    (documentation_id IS NULL AND section_id IS NOT NULL)
  )
);

-- =============================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Politiques pour la table workspaces
CREATE POLICY "Users can view workspaces they own or are members of or public workspaces"
  ON workspaces FOR SELECT
  USING (
    is_public OR
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update their workspaces"
  ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete their workspaces"
  ON workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- Politiques pour la table workspace_members
CREATE POLICY "Users can view workspace members for workspaces they are part of"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND (workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members wm
        WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Workspace owners can manage workspace members"
  ON workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Politiques pour la table projects
CREATE POLICY "Users can view projects in workspaces they have access to"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = projects.workspace_id
      AND (workspaces.is_public OR workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = workspaces.id AND workspace_members.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can manage projects in workspaces they own or have editor role"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = projects.workspace_id
      AND (workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'editor')
      ))
    )
  );

-- Politiques pour la table documentation
CREATE POLICY "Users can view documentation in projects they have access to"
  ON documentation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspaces ON projects.workspace_id = workspaces.id
      WHERE projects.id = documentation.project_id
      AND (workspaces.is_public OR workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can manage documentation in projects they own or have editor role"
  ON documentation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspaces ON projects.workspace_id = workspaces.id
      WHERE projects.id = documentation.project_id
      AND (workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'editor')
      ))
    )
  );

-- Politiques pour la table api_endpoints
CREATE POLICY "Users can view API endpoints in projects they have access to"
  ON api_endpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspaces ON projects.workspace_id = workspaces.id
      WHERE projects.id = api_endpoints.project_id
      AND (workspaces.is_public OR workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can manage API endpoints in projects they own or have editor role"
  ON api_endpoints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      JOIN workspaces ON projects.workspace_id = workspaces.id
      WHERE projects.id = api_endpoints.project_id
      AND (workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'editor')
      ))
    )
  );

-- Politiques pour la table documentation_sections
CREATE POLICY "Users can view documentation sections in projects they have access to"
  ON documentation_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documentation
      JOIN projects ON documentation.project_id = projects.id
      JOIN workspaces ON projects.workspace_id = workspaces.id
      WHERE documentation.id = documentation_sections.documentation_id
      AND (workspaces.is_public OR workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can manage documentation sections in projects they own or have editor role"
  ON documentation_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM documentation
      JOIN projects ON documentation.project_id = projects.id
      JOIN workspaces ON projects.workspace_id = workspaces.id
      WHERE documentation.id = documentation_sections.documentation_id
      AND (workspaces.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'editor')
      ))
    )
  );

-- Politiques pour la table comments
CREATE POLICY "Users can view comments on documentation they have access to"
  ON comments FOR SELECT
  USING (
    (
      documentation_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM documentation
        JOIN projects ON documentation.project_id = projects.id
        JOIN workspaces ON projects.workspace_id = workspaces.id
        WHERE documentation.id = comments.documentation_id
        AND (workspaces.is_public OR workspaces.owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = workspaces.id
          AND workspace_members.user_id = auth.uid()
        ))
      )
    ) OR (
      section_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM documentation_sections
        JOIN documentation ON documentation_sections.documentation_id = documentation.id
        JOIN projects ON documentation.project_id = projects.id
        JOIN workspaces ON projects.workspace_id = workspaces.id
        WHERE documentation_sections.id = comments.section_id
        AND (workspaces.is_public OR workspaces.owner_id = auth.uid() OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = workspaces.id
          AND workspace_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can insert their own comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
