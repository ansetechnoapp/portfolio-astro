import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ProjectManagerProps {
  workspaceId: string;
}

export default function ProjectManager({ workspaceId }: ProjectManagerProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [workspaceId]);

  const fetchProjects = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId);
        
      if (error) throw error;
      
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            workspace_id: workspaceId,
            name: newProjectName,
            description: newProjectDescription,
          },
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      setProjects([...projects, data]);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (err: any) {
      console.error('Error creating project:', err);
      alert(`Error creating project: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="project-manager">
      <h2 className="text-2xl font-bold mb-4">Projects</h2>
      
      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <>
          {projects.length === 0 ? (
            <p>No projects in this workspace yet. Create one to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="project-card border rounded-lg p-4 shadow-sm">
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <p className="text-gray-600">{project.description}</p>
                  <div className="mt-4 flex space-x-4">
                    <a 
                      href={`/docs/projects/${project.id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Project
                    </a>
                    <a 
                      href={`/docs/projects/${project.id}/docs`}
                      className="text-green-600 hover:text-green-800"
                    >
                      Documentation
                    </a>
                    <a 
                      href={`/docs/projects/${project.id}/api`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      API Docs
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Project Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
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
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows={3}
                />
              </div>
              
              <button
                type="submit"
                disabled={creating}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
