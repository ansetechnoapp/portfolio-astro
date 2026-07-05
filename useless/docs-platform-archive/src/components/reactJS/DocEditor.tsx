import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface DocEditorProps {
  documentationId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
}

export default function DocEditor({ documentationId, initialContent = '', onSave }: DocEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    // Load the initial content if not provided
    if (!initialContent) {
      loadContent();
    }
  }, [documentationId, initialContent]);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('documentation')
        .select('content, title, updated_at, is_published')
        .eq('id', documentationId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setContent(data.content || '');
        setTitle(data.title || '');
        setLastSaved(new Date(data.updated_at));
        setIsPublished(data.is_published || false);
      }
    } catch (err) {
      console.error('Error loading documentation:', err);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('documentation')
        .update({
          content,
          title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentationId);
        
      if (error) throw error;
      
      setLastSaved(new Date());
      if (onSave) onSave(content);
    } catch (err) {
      console.error('Error saving documentation:', err);
    } finally {
      setSaving(false);
    }
  };

  const togglePublishStatus = async () => {
    try {
      const newStatus = !isPublished;
      
      const { error } = await supabase
        .from('documentation')
        .update({
          is_published: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentationId);
        
      if (error) throw error;
      
      setIsPublished(newStatus);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error updating publish status:', err);
    }
  };

  return (
    <div className="doc-editor">
      <div className="editor-header mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document Title"
          className="text-2xl font-bold w-full border-b border-gray-300 pb-2 focus:outline-none focus:border-indigo-500"
        />
      </div>
      
      <div className="editor-toolbar flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-md">
        <div className="toolbar-buttons flex space-x-2">
          <button
            onClick={() => {
              const newContent = content + '# Heading\n\n';
              setContent(newContent);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="Add Heading"
          >
            H1
          </button>
          <button
            onClick={() => {
              const newContent = content + '## Subheading\n\n';
              setContent(newContent);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="Add Subheading"
          >
            H2
          </button>
          <button
            onClick={() => {
              const newContent = content + '**Bold Text**';
              setContent(newContent);
            }}
            className="p-1 hover:bg-gray-200 rounded font-bold"
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => {
              const newContent = content + '*Italic Text*';
              setContent(newContent);
            }}
            className="p-1 hover:bg-gray-200 rounded italic"
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => {
              const newContent = content + '\n```\ncode block\n```\n';
              setContent(newContent);
            }}
            className="p-1 hover:bg-gray-200 rounded font-mono"
            title="Code Block"
          >
            Code
          </button>
          <button
            onClick={() => {
              const newContent = content + '\n- List item 1\n- List item 2\n- List item 3\n';
              setContent(newContent);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="Bullet List"
          >
            • List
          </button>
        </div>
        
        <div className="toolbar-actions flex items-center space-x-4">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={togglePublishStatus}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isPublished 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {isPublished ? 'Published' : 'Draft'}
          </button>
          
          <button
            onClick={saveContent}
            disabled={saving}
            className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-1 rounded text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      <div className="editor-content-wrapper grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="editor-input">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[600px] p-4 border rounded-md font-mono text-sm"
            placeholder="Start writing your documentation here using Markdown..."
          />
        </div>
        
        <div className="editor-preview bg-white border rounded-md p-4 h-[600px] overflow-auto prose">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </div>
      </div>
    </div>
  );
}

// Simple markdown renderer (in a real app, use a proper markdown library)
function renderMarkdown(markdown: string): string {
  // This is a very basic implementation - in a real app, use a library like marked.js
  let html = markdown
    // Headers
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gm, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/gm, '<code>$1</code>')
    // Lists
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gm, '<a href="$2">$1</a>')
    // Paragraphs
    .replace(/^\s*(\n)?(.+)/gm, function(m) {
      return /\<(\/)?(h\d|ul|ol|li|blockquote|pre|img)/.test(m) ? m : '<p>'+m+'</p>';
    })
    // Line breaks
    .replace(/\n/gm, '<br>');
  
  // Fix lists
  html = html.replace(/<li>(.+)<\/li>/g, function(m, content) {
    return '<ul>' + m + '</ul>';
  }).replace(/<\/ul><ul>/g, '');
  
  return html;
}
