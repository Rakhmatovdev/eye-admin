// All TypeScript types for the application
export type UserRole = 'admin' | 'analyst' | 'viewer' | 'operator' | 'auditor';
export type UserStatus = 'active' | 'suspended' | 'inactive' | 'pending';
export type ClearanceLevel = 'TOP_SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'UNCLASSIFIED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  clearance: ClearanceLevel;
  avatar?: string;
  lastLogin: string;
  lastIp: string;
  createdAt: string;
  department: string;
  mfaEnabled: boolean;
  sessionCount: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clearance: ClearanceLevel;
  avatar?: string;
  mfaEnabled?: boolean;
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  userCount: number;
  color: string;
  createdAt: string;
}

export type DataSourceType = 'postgresql' | 'mysql' | 'mongodb' | 'api' | 'csv' | 'kafka' | 'elasticsearch' | 's3';
export type DataSourceStatus = 'connected' | 'error' | 'syncing' | 'disconnected' | 'warning';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: DataSourceStatus;
  host: string;
  database?: string;
  lastSync: string;
  recordCount: number;
  syncInterval: number;
  description: string;
  tags: string[];
  errorMessage?: string;
}

export type EntityPropertyType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'email' | 'phone' | 'url' | 'geolocation';

export interface EntityProperty {
  name: string;
  type: EntityPropertyType;
  required: boolean;
  description: string;
  indexed?: boolean;
}

export interface EntityRelationship {
  targetType: string;
  name: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  description: string;
}

export interface EntityType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  properties: EntityProperty[];
  relationships: EntityRelationship[];
  count: number;
}

export type MetricType = 'cpu' | 'ram' | 'disk' | 'network' | 'api';

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface ServiceStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  uptime: number;
  responseTime: number;
  version: string;
  lastCheck: string;
}

export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'execute' | 'configure';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: string;
  ip: string;
  userAgent: string;
  result: 'success' | 'failure';
  hash: string;
  country?: string;
  changes?: { field: string; from: string; to: string }[];
}

export type AgentStatus = 'online' | 'offline' | 'degraded' | 'updating' | 'error';
export type AgentType = 'collector' | 'analyzer' | 'relay' | 'gateway' | 'sensor';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  version: string;
  lastHeartbeat: string;
  location: string;
  country: string;
  ip: string;
  platform: string;
  cpuUsage: number;
  memUsage: number;
  dataCollected: number;
  tasksCompleted: number;
  uptime: number;
  lat: number;
  lng: number;
}

export interface AgentCommand {
  id: string;
  agentId: string;
  command: string;
  params?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  issuedAt: string;
  completedAt?: string;
  output?: string;
  issuedBy: string;
}

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved';
export type IncidentType = 'intrusion' | 'malware' | 'data_exfil' | 'brute_force' | 'anomaly' | 'policy_violation' | 'impossible_travel';

export interface SecurityIncident {
  id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  timestamp: string;
  userId?: string;
  userName?: string;
  sourceIp: string;
  affectedAssets: string[];
  description: string;
  assignee?: string;
  tlp: 'RED' | 'AMBER' | 'GREEN' | 'WHITE';
}

export interface ThreatFeedItem {
  id: string;
  timestamp: string;
  indicator: string;
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  description: string;
  tags: string[];
}

export interface BlocklistEntry {
  id: string;
  value: string;
  type: 'ip' | 'domain' | 'cidr' | 'asn';
  reason: string;
  addedBy: string;
  addedAt: string;
  expiresAt?: string;
  hitCount: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  totalEntities: number;
  securityIncidents: number;
  apiRequestsPerHour: number;
  dataSources: number;
  usersTrend: number;
  sessionsTrend: number;
  entitiesTrend: number;
  incidentsTrend: number;
}

export interface ApiPoint {
  time: string;
  requests: number;
  errors: number;
  latency: number;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  lastTriggered?: string;
}

// --- Cyber Security Center ---

export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low';
export type VulnerabilityStatus = 'open' | 'patching' | 'mitigated' | 'resolved' | 'accepted_risk';

export interface Vulnerability {
  id: string;
  cveId?: string;
  title: string;
  severity: VulnerabilitySeverity;
  cvssScore: number;
  status: VulnerabilityStatus;
  affectedAsset: string;
  component: string;
  discoveredAt: string;
  description: string;
  remediation: string;
}

export interface AttackMapNode {
  id: string;
  label: string;
  kind: 'ip' | 'asset';
  country?: string;
  incidentCount: number;
  severity: IncidentSeverity;
}

export interface SecurityTrendPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SeverityBreakdownSlice {
  name: string;
  value: number;
  color: string;
}

export interface SecurityOverview {
  riskScore: number;
  riskLevel: 'nominal' | 'elevated' | 'critical';
  riskTrend: number;
  criticalOpen: number;
  highOpen: number;
  openIncidents: number;
  resolvedRecent: number;
  blockedCount: number;
  openVulnerabilities: number;
  mttr: string;
  trend: SecurityTrendPoint[];
  severityBreakdown: SeverityBreakdownSlice[];
}
