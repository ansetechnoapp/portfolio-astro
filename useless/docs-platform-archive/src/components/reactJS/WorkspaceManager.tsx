import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function WorkspaceManager() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    fetchWorkspaces();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
    }
  };

  const fetchWorkspaces = async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setWorkspaces([]);
        return;
      }
      
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', session.user.id);
        
      if (ownedError) throw ownedError;
      
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspaces(*)')
        .eq('user_id', session.user.id);
        
      if (memberError) throw memberError;
      
      const memberWorkspacesData = memberWorkspaces
        ?.map(item => item.workspaces)
        .filter(Boolean) || [];
        
      setWorkspaces([...(ownedWorkspaces || []), ...memberWorkspacesData]);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to create a workspace');
      }
      
      // Create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([
          {
            name: newWorkspaceName,
            description: newWorkspaceDescription,
            owner_id: session.user.id,
          },
        ])
        .select()
        .single();
        
      if (workspaceError) throw workspaceError;
      
      // Add the workspace to the list
      setWorkspaces([...workspaces, workspace]);
      
      // Reset the form
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
    } catch (err: any) {
      console.error('Error creating workspace:', err);
      alert(`Error creating workspace: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="workspace-manager">
      <h2 className="text-2xl font-bold mb-4">Your Workspaces</h2>
      
      {loading ? (
        <p>Loading workspaces...</p>
      ) : (
        <>
          {workspaces.length === 0 ? (
            <p>You don't have any workspaces yet. Create one to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="workspace-card border rounded-lg p-4 shadow-sm">
                  <h3 className="text-xl font-semibold">{workspace.name}</h3>
                  <p className="text-gray-600">{workspace.description}</p>
                  <div className="mt-4">
                    <a 
                      href={`/docs/workspaces/${workspace.id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Workspace →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Create New Workspace</h3>
            <form onSubmit={createWorkspace} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Workspace Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows={3}
                />
              </div>
              
              <button
                type="submit"
                disabled={creating}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {creating ? 'Creating...' : 'Create Workspace'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
