import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://cfnwwubinuizykgebksf.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get the current user
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  return user;
}

// Helper function to get user workspaces
export async function getUserWorkspaces() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  
  const { data: ownedWorkspaces } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', session.user.id);
    
  const { data: memberWorkspaces } = await supabase
    .from('workspace_members')
    .select('workspaces(*)')
    .eq('user_id', session.user.id)
    .not('owner_id', 'eq', session.user.id);
    
  return [...(ownedWorkspaces || []), ...(memberWorkspaces?.map(item => item.workspaces) || [])];
}

// Helper function to check if user has access to a workspace
export async function hasWorkspaceAccess(workspaceId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  // Check if user is the owner
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();
    
  if (workspace?.owner_id === session.user.id) return true;
  
  // Check if user is a member
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', session.user.id)
    .single();
    
  return !!membership;
}

// Helper function to check if user has access to a project
export async function hasProjectAccess(projectId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  // Get the workspace ID for this project
  const { data: project } = await supabase
    .from('projects')
    .select('workspace_id')
    .eq('id', projectId)
    .single();
    
  if (!project) return false;
  
  // Check workspace access
  return hasWorkspaceAccess(project.workspace_id);
}

// Helper function to get project details
export async function getProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
    
  if (error) throw error;
  return data;
}

// Helper function to get workspace details
export async function getWorkspace(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();
    
  if (error) throw error;
  return data;
}
