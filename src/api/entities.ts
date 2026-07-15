import type { EntityType } from '../types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_ENTITY_TYPES: EntityType[] = [
  {
    id: 'et-001',
    name: 'Person',
    icon: '👤',
    color: '#3B82F6',
    description: 'Individual person entities including persons of interest, suspects, and associates',
    count: 48392,
    properties: [
      { name: 'firstName', type: 'string', required: true, description: 'First name', indexed: true },
      { name: 'lastName', type: 'string', required: true, description: 'Last name', indexed: true },
      { name: 'dateOfBirth', type: 'date', required: false, description: 'Date of birth' },
      { name: 'nationality', type: 'string', required: false, description: 'Nationality', indexed: true },
      { name: 'email', type: 'email', required: false, description: 'Email address', indexed: true },
      { name: 'phone', type: 'phone', required: false, description: 'Phone number', indexed: true },
      { name: 'isActive', type: 'boolean', required: true, description: 'Active status' },
      { name: 'riskScore', type: 'number', required: false, description: 'Risk assessment score' },
    ],
    relationships: [
      { targetType: 'Organization', name: 'member_of', cardinality: 'many-to-many', description: 'Member or employee of organization' },
      { targetType: 'Vehicle', name: 'owns', cardinality: 'one-to-many', description: 'Owns or operates vehicle' },
      { targetType: 'Location', name: 'associated_with', cardinality: 'many-to-many', description: 'Associated with location' },
      { targetType: 'Phone', name: 'uses', cardinality: 'one-to-many', description: 'Uses phone number' },
      { targetType: 'Transaction', name: 'initiated', cardinality: 'one-to-many', description: 'Initiated financial transaction' },
    ],
  },
  {
    id: 'et-002',
    name: 'Organization',
    icon: '🏢',
    color: '#10B981',
    description: 'Organizations, corporations, NGOs, and other group entities',
    count: 12847,
    properties: [
      { name: 'name', type: 'string', required: true, description: 'Organization name', indexed: true },
      { name: 'type', type: 'string', required: true, description: 'Organization type', indexed: true },
      { name: 'registrationId', type: 'string', required: false, description: 'Official registration ID', indexed: true },
      { name: 'country', type: 'string', required: true, description: 'Country of registration', indexed: true },
      { name: 'founded', type: 'date', required: false, description: 'Founded date' },
      { name: 'isActive', type: 'boolean', required: true, description: 'Active status' },
      { name: 'website', type: 'url', required: false, description: 'Website URL' },
    ],
    relationships: [
      { targetType: 'Person', name: 'employs', cardinality: 'one-to-many', description: 'Employs or members' },
      { targetType: 'Location', name: 'headquartered_at', cardinality: 'many-to-one', description: 'Primary location' },
      { targetType: 'Transaction', name: 'involved_in', cardinality: 'one-to-many', description: 'Financial activity' },
      { targetType: 'Document', name: 'issued', cardinality: 'one-to-many', description: 'Issued documents' },
    ],
  },
  {
    id: 'et-003',
    name: 'Vehicle',
    icon: '🚗',
    color: '#F59E0B',
    description: 'Cars, trucks, aircraft, vessels and other vehicles',
    count: 8234,
    properties: [
      { name: 'vin', type: 'string', required: false, description: 'Vehicle identification number', indexed: true },
      { name: 'licensePlate', type: 'string', required: false, description: 'License plate', indexed: true },
      { name: 'make', type: 'string', required: true, description: 'Manufacturer', indexed: true },
      { name: 'model', type: 'string', required: true, description: 'Model name' },
      { name: 'year', type: 'number', required: false, description: 'Year of manufacture' },
      { name: 'color', type: 'string', required: false, description: 'Vehicle color' },
      { name: 'type', type: 'string', required: true, description: 'Vehicle type', indexed: true },
    ],
    relationships: [
      { targetType: 'Person', name: 'owned_by', cardinality: 'many-to-one', description: 'Owner' },
      { targetType: 'Location', name: 'sighted_at', cardinality: 'many-to-many', description: 'Locations spotted' },
    ],
  },
  {
    id: 'et-004',
    name: 'Location',
    icon: '📍',
    color: '#EF4444',
    description: 'Geographic locations including addresses, regions, and points of interest',
    count: 23891,
    properties: [
      { name: 'name', type: 'string', required: false, description: 'Location name', indexed: true },
      { name: 'address', type: 'string', required: false, description: 'Street address' },
      { name: 'city', type: 'string', required: false, description: 'City', indexed: true },
      { name: 'country', type: 'string', required: true, description: 'Country code', indexed: true },
      { name: 'coordinates', type: 'geolocation', required: false, description: 'Lat/Lng coordinates' },
      { name: 'type', type: 'string', required: true, description: 'Location type', indexed: true },
    ],
    relationships: [
      { targetType: 'Person', name: 'associated_with', cardinality: 'many-to-many', description: 'Related persons' },
      { targetType: 'Organization', name: 'hosts', cardinality: 'one-to-many', description: 'Organizations at location' },
    ],
  },
  {
    id: 'et-005',
    name: 'Phone',
    icon: '📱',
    color: '#8B5CF6',
    description: 'Phone numbers and communication devices',
    count: 31204,
    properties: [
      { name: 'number', type: 'phone', required: true, description: 'Phone number', indexed: true },
      { name: 'type', type: 'string', required: true, description: 'Mobile/landline/VOIP' },
      { name: 'carrier', type: 'string', required: false, description: 'Carrier name' },
      { name: 'country', type: 'string', required: false, description: 'Country code', indexed: true },
      { name: 'isActive', type: 'boolean', required: true, description: 'Active status' },
    ],
    relationships: [
      { targetType: 'Person', name: 'used_by', cardinality: 'many-to-many', description: 'Users of this number' },
    ],
  },
  {
    id: 'et-006',
    name: 'Document',
    icon: '📄',
    color: '#06B6D4',
    description: 'Documents, records, and files of intelligence value',
    count: 15678,
    properties: [
      { name: 'title', type: 'string', required: true, description: 'Document title', indexed: true },
      { name: 'type', type: 'string', required: true, description: 'Document type', indexed: true },
      { name: 'hash', type: 'string', required: false, description: 'File hash', indexed: true },
      { name: 'dateCreated', type: 'date', required: false, description: 'Creation date' },
      { name: 'language', type: 'string', required: false, description: 'Document language' },
      { name: 'classification', type: 'string', required: true, description: 'Classification level' },
    ],
    relationships: [
      { targetType: 'Person', name: 'authored_by', cardinality: 'many-to-one', description: 'Document author' },
      { targetType: 'Organization', name: 'issued_by', cardinality: 'many-to-one', description: 'Issuing organization' },
    ],
  },
  {
    id: 'et-007',
    name: 'Transaction',
    icon: '💰',
    color: '#10B981',
    description: 'Financial transactions and monetary transfers',
    count: 94512,
    properties: [
      { name: 'transactionId', type: 'string', required: true, description: 'Transaction ID', indexed: true },
      { name: 'amount', type: 'number', required: true, description: 'Transaction amount' },
      { name: 'currency', type: 'string', required: true, description: 'Currency code' },
      { name: 'date', type: 'date', required: true, description: 'Transaction date', indexed: true },
      { name: 'type', type: 'string', required: true, description: 'Transaction type', indexed: true },
      { name: 'suspicious', type: 'boolean', required: false, description: 'Flagged as suspicious' },
    ],
    relationships: [
      { targetType: 'Person', name: 'sender', cardinality: 'many-to-one', description: 'Sending party' },
      { targetType: 'Person', name: 'recipient', cardinality: 'many-to-one', description: 'Receiving party' },
      { targetType: 'Organization', name: 'processed_by', cardinality: 'many-to-one', description: 'Processing institution' },
    ],
  },
];

export const entitiesApi = {
  getEntityTypes: async (): Promise<EntityType[]> => {
    await delay(400);
    return MOCK_ENTITY_TYPES;
  },

  getEntityType: async (id: string): Promise<EntityType> => {
    await delay(300);
    const et = MOCK_ENTITY_TYPES.find(e => e.id === id);
    if (!et) throw new Error('Entity type not found');
    return et;
  },

  createEntityType: async (data: Partial<EntityType>): Promise<EntityType> => {
    await delay(600);
    return { ...data, id: 'et-' + Date.now(), count: 0 } as EntityType;
  },

  updateEntityType: async (id: string, data: Partial<EntityType>): Promise<EntityType> => {
    await delay(500);
    const et = MOCK_ENTITY_TYPES.find(e => e.id === id)!;
    return { ...et, ...data };
  },
};
