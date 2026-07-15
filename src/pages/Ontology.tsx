import React, { useState } from 'react';
import { Layers, Plus, Link, HelpCircle } from 'lucide-react';

export const Ontology: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState('person');

  const [entities] = useState([
    {
      id: 'person',
      name: 'Person',
      color: '#3B82F6',
      description: 'Physical individual identity containing biometric registry, passport information, and contact logs.',
      properties: [
        { name: 'passport_id', type: 'string', required: true, desc: 'Biometric registry identifier' },
        { name: 'full_name', type: 'string', required: true, desc: 'First and last name' },
        { name: 'date_of_birth', type: 'date', required: true, desc: 'Date of birth' },
        { name: 'nationality', type: 'string', required: false, desc: 'Country of citizenship' },
      ],
      relationships: [
        { target: 'phone', name: 'owns_phone', type: 'one-to-many' },
        { target: 'organization', name: 'employed_at', type: 'many-to-one' },
        { target: 'vehicle', name: 'drives', type: 'many-to-many' },
      ]
    },
    {
      id: 'organization',
      name: 'Organization',
      color: '#10B981',
      description: 'Legal corporation entity, trading registries, government ministries, or commercial companies.',
      properties: [
        { name: 'tax_id', type: 'string', required: true, desc: 'State tax registration number' },
        { name: 'legal_name', type: 'string', required: true, desc: 'Registered enterprise name' },
        { name: 'incorporation_date', type: 'date', required: false, desc: 'Incorporation registry date' },
      ],
      relationships: [
        { target: 'person', name: 'employs', type: 'one-to-many' },
        { target: 'location', name: 'headquartered_in', type: 'many-to-one' },
      ]
    },
    {
      id: 'phone',
      name: 'Phone Number',
      color: '#06B6D4',
      description: 'GSM / LTE Telecommunication endpoint, mobile SIM, or landline identifier.',
      properties: [
        { name: 'msisdn', type: 'string', required: true, desc: 'Standard international phone number format' },
        { name: 'imsi', type: 'string', required: false, desc: 'SIM identity number' },
        { name: 'carrier', type: 'string', required: false, desc: 'Telecom carrier' },
      ],
      relationships: [
        { target: 'person', name: 'owned_by', type: 'many-to-one' },
      ]
    }
  ]);

  const selectedNode = entities.find(e => e.id === selectedEntity) || entities[0];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ontology & Schema Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Define real-world entity models (nodes) and their semantic connections (edges).</p>
        </div>
        <button className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2">
          <Plus size={16} />
          <span>New Entity Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Classes */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Entity Classes</h4>
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
            
            {/* Simple SVGs showing nodes and relationships */}
            <svg className="w-full h-full max-w-sm" viewBox="0 0 300 100">
              {/* Lines */}
              <line x1="60" y1="50" x2="150" y2="50" stroke="#475569" strokeWidth="2" strokeDasharray="3" />
              <line x1="150" y1="50" x2="240" y2="50" stroke="#475569" strokeWidth="2" strokeDasharray="3" />
              
              {/* Nodes */}
              <circle cx="60" cy="50" r="16" fill="#3B82F6" className="cursor-pointer" onClick={() => setSelectedEntity('person')} />
              <text x="60" y="85" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">Person</text>

              <circle cx="150" cy="50" r="16" fill="#10B981" className="cursor-pointer" onClick={() => setSelectedEntity('organization')} />
              <text x="150" y="85" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">Organization</text>

              <circle cx="240" cy="50" r="16" fill="#06B6D4" className="cursor-pointer" onClick={() => setSelectedEntity('phone')} />
              <text x="240" y="85" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">Phone</text>
            </svg>
          </div>

          {/* Properties Details */}
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
                {selectedNode.properties.map((prop, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                    <div>
                      <p className="font-semibold text-gray-200">{prop.name}</p>
                      <p className="text-xxs text-gray-500 mt-0.5">{prop.desc}</p>
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
                {selectedNode.relationships.map((rel, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Link size={12} className="text-gray-500" />
                      <span className="font-bold text-gray-200">{rel.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 uppercase text-xxs">Target: {rel.target}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xxs font-semibold">{rel.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
