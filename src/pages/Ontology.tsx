import React, { useEffect, useState } from 'react';
import { Layers, Plus, Link } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { entitiesApi } from '../api/entities';
import type { EntityType } from '../types';

export const Ontology: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ['entity-types'],
    queryFn: entitiesApi.getEntityTypes,
  });

  const [selectedEntity, setSelectedEntity] = useState('');

  useEffect(() => {
    if (!selectedEntity && entities.length) setSelectedEntity(entities[0].id);
  }, [entities, selectedEntity]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');

  const createMutation = useMutation({
    mutationFn: (data: Partial<EntityType>) => entitiesApi.createEntityType(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['entity-types'] });
      setSelectedEntity(created.id);
    },
  });

  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: newName,
      description: newDescription,
      color: newColor,
      icon: '🔹',
      properties: [],
      relationships: [],
    });
    setShowCreateModal(false);
    setNewName('');
    setNewDescription('');
  };

  const selectedNode = entities.find(e => e.id === selectedEntity) || entities[0];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ontology & Schema Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Define real-world entity models (nodes) and their semantic connections (edges).</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>New Entity Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Classes */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Entity Classes</h4>
          {isLoading && (
            <div className="text-sm text-gray-500 p-4">Loading ontology…</div>
          )}
          {!isLoading && entities.length === 0 && (
            <div className="text-sm text-gray-500 p-4">No entity classes found.</div>
          )}
          {entities.map(ent => (
            <button
              key={ent.id}
              onClick={() => setSelectedEntity(ent.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                selectedEntity === ent.id
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-lg'
                  : 'bg-gray-900/50 border-gray-800 text-gray-300 hover:bg-gray-800/40'
              }`}
            >
              <div
                className="p-2 rounded-lg border flex items-center justify-center"
                style={{
                  color: ent.color,
                  borderColor: selectedEntity === ent.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.8)',
                  backgroundColor: selectedEntity === ent.id ? 'rgba(59, 130, 246, 0.05)' : 'rgba(17, 24, 39, 0.8)'
                }}
              >
                <Layers size={18} />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-sm text-white">{ent.name}</h5>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ent.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Right Side: Visual Graph & Properties */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive SVG Diagram preview */}
          <div className="glass p-5 rounded-2xl border border-gray-800 relative h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute top-3 left-4 text-xxs font-bold text-gray-500 uppercase tracking-wider">Ontology Mapping View</div>

            {/* Simple SVGs showing nodes and relationships, driven by the live entity classes */}
            <svg className="w-full h-full max-w-sm" viewBox="0 0 300 100">
              {entities.slice(0, 3).map((ent, idx) => {
                const cx = 60 + idx * 90;
                return (
                  <React.Fragment key={ent.id}>
                    {idx > 0 && (
                      <line x1={cx - 90} y1="50" x2={cx} y2="50" stroke="#475569" strokeWidth="2" strokeDasharray="3" />
                    )}
                    <circle cx={cx} cy="50" r="16" fill={ent.color} className="cursor-pointer" onClick={() => setSelectedEntity(ent.id)} />
                    <text x={cx} y="85" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">{ent.name}</text>
                  </React.Fragment>
                );
              })}
            </svg>
          </div>

          {/* Properties Details */}
          {selectedNode && (
            <div className="glass p-6 rounded-2xl border border-gray-800 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                  {selectedNode.name} Schema Definition
                </h3>
                <p className="text-xs text-gray-500 mt-1">{selectedNode.description}</p>
              </div>

              {/* Properties Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</h4>
                <div className="bg-gray-950/40 border border-gray-800/60 rounded-xl overflow-hidden divide-y divide-gray-800/40">
                  {selectedNode.properties.length === 0 && (
                    <div className="p-3.5 text-xs text-gray-500">No observed properties yet.</div>
                  )}
                  {selectedNode.properties.map((prop, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                      <div>
                        <p className="font-semibold text-gray-200">{prop.name}</p>
                        <p className="text-xxs text-gray-500 mt-0.5">{prop.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xxs uppercase">{prop.type}</span>
                        {prop.required && (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-xxs font-bold">Required</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Relationships */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Semantic Connections (Edges)</h4>
                <div className="bg-gray-950/40 border border-gray-800/60 rounded-xl overflow-hidden divide-y divide-gray-800/40">
                  {selectedNode.relationships.length === 0 && (
                    <div className="p-3.5 text-xs text-gray-500">No relationships mapped yet.</div>
                  )}
                  {selectedNode.relationships.map((rel, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Link size={12} className="text-gray-500" />
                        <span className="font-bold text-gray-200">{rel.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 uppercase text-xxs">Target: {rel.targetType}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xxs font-semibold">{rel.cardinality}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Entity Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
          <div className="glass w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="p-6 border-b border-gray-800 bg-gray-950/50">
              <h3 className="text-lg font-bold text-white">Define New Entity Class</h3>
              <p className="text-xs text-gray-500 mt-0.5">Register a new ontology node type for the graph schema.</p>
            </div>
            <form onSubmit={handleCreateEntity} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Class Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Vehicle"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Description</label>
                <input
                  type="text"
                  required
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                  placeholder="Short description of this entity class..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Accent Color</label>
                <input
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="w-16 h-9 bg-gray-950 border border-gray-800 rounded-xl px-1 py-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-800 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800/30 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create Entity Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
