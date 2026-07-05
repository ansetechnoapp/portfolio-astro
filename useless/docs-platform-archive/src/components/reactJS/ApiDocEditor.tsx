import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ApiEndpoint {
  id?: string;
  project_id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  summary: string;
  description: string;
  request_body: any;
  responses: any;
}

interface ApiDocEditorProps {
  projectId: string;
  endpointId?: string;
}

export default function ApiDocEditor({ projectId, endpointId }: ApiDocEditorProps) {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEndpoint, setCurrentEndpoint] = useState<ApiEndpoint | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEndpoints();
    
    if (endpointId) {
      fetchEndpoint(endpointId);
    } else {
      handleCreateNew();
    }
  }, [projectId, endpointId]);

  const fetchEndpoints = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      setEndpoints(data || []);
    } catch (err) {
      console.error('Error fetching API endpoints:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEndpoint = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      setCurrentEndpoint(data);
    } catch (err) {
      console.error('Error fetching endpoint:', err);
      handleCreateNew();
    }
  };

  const handleEndpointSelect = (endpoint: ApiEndpoint) => {
    setCurrentEndpoint(endpoint);
  };

  const handleCreateNew = () => {
    setCurrentEndpoint({
      project_id: projectId,
      path: '',
      method: 'GET',
      summary: '',
      description: '',
      request_body: {},
      responses: {
        '200': {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {}
            }
          }
        }
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setCurrentEndpoint({
      ...currentEndpoint!,
      [field]: value
    });
  };

  const handleSave = async () => {
    if (!currentEndpoint) return;
    
    setSaving(true);
    
    try {
      let result;
      
      if (currentEndpoint.id) {
        // Update existing endpoint
        const { data, error } = await supabase
          .from('api_endpoints')
          .update({
            path: currentEndpoint.path,
            method: currentEndpoint.method,
            summary: currentEndpoint.summary,
            description: currentEndpoint.description,
            request_body: currentEndpoint.request_body,
            responses: currentEndpoint.responses,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEndpoint.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new endpoint
        const { data, error } = await supabase
          .from('api_endpoints')
          .insert([{
            project_id: projectId,
            path: currentEndpoint.path,
            method: currentEndpoint.method,
            summary: currentEndpoint.summary,
            description: currentEndpoint.description,
            request_body: currentEndpoint.request_body,
            responses: currentEndpoint.responses
          }])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      // Update the endpoints list
      if (currentEndpoint.id) {
        setEndpoints(endpoints.map(ep => ep.id === result.id ? result : ep));
      } else {
        setEndpoints([...endpoints, result]);
      }
      
      // Update current endpoint with the saved data
      setCurrentEndpoint(result);
      
      // Redirect to the endpoint page
      window.location.href = `/docs/projects/${projectId}/api/${result.id}`;
    } catch (err: any) {
      console.error('Error saving endpoint:', err);
      alert(`Error saving endpoint: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="api-doc-editor grid grid-cols-4 gap-4">
      <div className="col-span-1 border-r pr-4">
        <h3 className="text-lg font-semibold mb-4">Endpoints</h3>
        
        <button
          onClick={handleCreateNew}
          className="mb-4 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Add New Endpoint
        </button>
        
        {loading ? (
          <p>Loading endpoints...</p>
        ) : (
          <ul className="space-y-2">
            {endpoints.length === 0 ? (
              <p>No endpoints defined yet.</p>
            ) : (
              endpoints.map((endpoint) => (
                <li 
                  key={endpoint.id}
                  className={`p-2 rounded cursor-pointer ${currentEndpoint?.id === endpoint.id ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleEndpointSelect(endpoint)}
                >
                  <span className={`inline-block px-2 py-1 text-xs font-bold rounded mr-2 ${
                    endpoint.method === 'GET' ? 'bg-blue-500 text-white' :
                    endpoint.method === 'POST' ? 'bg-green-500 text-white' :
                    endpoint.method === 'PUT' ? 'bg-yellow-500 text-white' :
                    endpoint.method === 'DELETE' ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {endpoint.method}
                  </span>
                  <span>{endpoint.path}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      
      <div className="col-span-3">
        {currentEndpoint ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {currentEndpoint.id ? 'Edit Endpoint' : 'New Endpoint'}
              </h3>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {saving ? 'Saving...' : 'Save Endpoint'}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  HTTP Method
                </label>
                <select
                  value={currentEndpoint.method}
                  onChange={(e) => handleInputChange('method', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Path
                </label>
                <input
                  type="text"
                  value={currentEndpoint.path}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  placeholder="/api/resource/{id}"
                  className="w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Summary
              </label>
              <input
                type="text"
                value={currentEndpoint.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Brief summary of what this endpoint does"
                className="w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={currentEndpoint.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of the endpoint"
                className="w-full rounded-md border-gray-300 shadow-sm"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Request Body (JSON)
              </label>
              <textarea
                value={JSON.stringify(currentEndpoint.request_body, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange('request_body', parsed);
                  } catch (err) {
                    // Allow invalid JSON during editing
                    console.log('Invalid JSON, will not update until valid');
                  }
                }}
                placeholder="{ ... }"
                className="w-full rounded-md border-gray-300 shadow-sm font-mono text-sm"
                rows={6}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Responses (JSON)
              </label>
              <textarea
                value={JSON.stringify(currentEndpoint.responses, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange('responses', parsed);
                  } catch (err) {
                    // Allow invalid JSON during editing
                    console.log('Invalid JSON, will not update until valid');
                  }
                }}
                placeholder="{ ... }"
                className="w-full rounded-md border-gray-300 shadow-sm font-mono text-sm"
                rows={6}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Select an endpoint from the list or create a new one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
