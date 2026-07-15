import { subDays, subHours, subMinutes } from 'date-fns';
import apiClient from './client';
import type {
  SecurityIncident,
  Vulnerability,
  BlocklistEntry,
  ThreatFeedItem,
  AttackMapNode,
  SecurityOverview,
  SecurityTrendPoint,
} from '../types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const now = () => new Date();

// ---------------------------------------------------------------------------
// Seed data — realistic SOC-style incidents, vulnerabilities & blocklist
// ---------------------------------------------------------------------------

export let MOCK_INCIDENTS: SecurityIncident[] = [
  {
    id: 'inc-001',
    title: 'Credential Stuffing Campaign',
    type: 'brute_force',
    severity: 'critical',
    status: 'open',
    timestamp: subMinutes(now(), 4).toISOString(),
    sourceIp: '91.219.237.19',
    affectedAssets: ['auth-service', 'api-gateway'],
    description: 'Automated login attempts using a leaked credential list detected against the authentication service. 4,812 attempts across 312 distinct accounts in 6 minutes.',
    assignee: 'S. Chen',
    tlp: 'RED',
  },
  {
    id: 'inc-002',
    title: 'Credential Leak Detection',
    type: 'data_exfil',
    severity: 'critical',
    status: 'investigating',
    timestamp: subMinutes(now(), 22).toISOString(),
    sourceIp: 'unknown',
    affectedAssets: ['admin-portal-oauth'],
    description: 'A paste-site scraper flagged what appears to be a valid admin session token pattern matching this platform\'s OAuth issuer. Token has been force-revoked pending investigation.',
    assignee: 'M. Williams',
    tlp: 'RED',
  },
  {
    id: 'inc-003',
    title: 'Ransomware Signature Match',
    type: 'malware',
    severity: 'critical',
    status: 'open',
    timestamp: subMinutes(now(), 47).toISOString(),
    sourceIp: '45.155.205.87',
    affectedAssets: ['file-server-02', 'backup-node'],
    description: 'File integrity monitor detected mass-encryption behaviour consistent with LockBit-family ransomware on file-server-02. Network segment isolated automatically.',
    assignee: 'M. Williams',
    tlp: 'RED',
  },
  {
    id: 'inc-004',
    title: 'Privilege Escalation Attempt',
    type: 'intrusion',
    severity: 'high',
    status: 'investigating',
    timestamp: subHours(now(), 1).toISOString(),
    sourceIp: '10.0.4.221',
    affectedAssets: ['rbac-service'],
    description: 'Internal service account attempted to assign itself the `admin:system` permission outside of the standard IaC pipeline. Request blocked by policy engine.',
    assignee: 'H. Al-Farsi',
    tlp: 'RED',
  },
  {
    id: 'inc-005',
    title: 'Brute Force SSH Probe',
    type: 'brute_force',
    severity: 'high',
    status: 'open',
    timestamp: subMinutes(now(), 5).toISOString(),
    sourceIp: '185.220.101.4',
    affectedAssets: ['border-gateway-01'],
    description: 'Sustained SSH authentication attempts from a known Tor exit node against the border gateway. Fail2ban threshold exceeded 3 times in the last hour.',
    tlp: 'AMBER',
  },
  {
    id: 'inc-006',
    title: 'Unusual Data Export Volume',
    type: 'data_exfil',
    severity: 'high',
    status: 'open',
    timestamp: subHours(now(), 2).toISOString(),
    sourceIp: '172.16.0.44',
    affectedAssets: ['entities-api'],
    description: 'A single API key exported 38,000 entity records in a 10-minute window — roughly 40x the account\'s 30-day average. Rate limiting applied, key flagged for review.',
    assignee: 'N. Petrov',
    tlp: 'AMBER',
  },
  {
    id: 'inc-007',
    title: 'Malicious DNS Beacon',
    type: 'malware',
    severity: 'high',
    status: 'investigating',
    timestamp: subHours(now(), 3).toISOString(),
    sourceIp: 'malicious-c2.ru',
    affectedAssets: ['ingest-worker-03'],
    description: 'Periodic DNS beaconing (every 60s, fixed jitter) from ingest-worker-03 to a domain matching a known C2 infrastructure pattern in threat intel feeds.',
    assignee: 'M. Williams',
    tlp: 'RED',
  },
  {
    id: 'inc-008',
    title: 'SQL Injection Attempt Blocked',
    type: 'intrusion',
    severity: 'high',
    status: 'resolved',
    timestamp: subHours(now(), 9).toISOString(),
    sourceIp: '103.152.36.9',
    affectedAssets: ['entities-api'],
    description: 'WAF blocked a UNION-based SQL injection attempt against the `/entities` search endpoint. Payload logged and source added to blocklist.',
    assignee: 'S. Chen',
    tlp: 'AMBER',
  },
  {
    id: 'inc-009',
    title: 'Impossible Travel Alert',
    type: 'impossible_travel',
    severity: 'medium',
    status: 'contained',
    timestamp: subHours(now(), 1).toISOString(),
    sourceIp: '198.51.100.72',
    affectedAssets: ['a.karimov session'],
    description: 'Same session token used from Tashkent and Frankfurt 11 minutes apart — physically impossible travel time. Session terminated, MFA re-challenge issued.',
    tlp: 'AMBER',
  },
  {
    id: 'inc-010',
    title: 'DDoS Pattern on API Gateway',
    type: 'anomaly',
    severity: 'medium',
    status: 'contained',
    timestamp: subHours(now(), 5).toISOString(),
    sourceIp: '203.0.113.0/24',
    affectedAssets: ['api-gateway'],
    description: 'Volumetric traffic spike (14x baseline) from a distributed /24 range. Edge rate-limiting engaged automatically, no downstream impact observed.',
    tlp: 'GREEN',
  },
  {
    id: 'inc-011',
    title: 'Insider Threat: After-hours Bulk Query',
    type: 'anomaly',
    severity: 'medium',
    status: 'investigating',
    timestamp: subHours(now(), 14).toISOString(),
    sourceIp: '10.0.2.88',
    affectedAssets: ['graph-service'],
    description: 'Analyst account executed 200+ graph expand queries between 02:14–02:41 local time, outside of typical working pattern for this user.',
    assignee: 'S. Dubois',
    tlp: 'AMBER',
  },
  {
    id: 'inc-012',
    title: 'New Device Login (Unrecognized)',
    type: 'anomaly',
    severity: 'low',
    status: 'open',
    timestamp: subMinutes(now(), 51).toISOString(),
    sourceIp: '77.83.36.10',
    affectedAssets: ['s.dubois session'],
    description: 'Login from a previously unseen device fingerprint and ASN. Email verification challenge sent to account owner.',
    tlp: 'GREEN',
  },
  {
    id: 'inc-013',
    title: 'Policy Violation: Clipboard Export',
    type: 'policy_violation',
    severity: 'low',
    status: 'resolved',
    timestamp: subDays(now(), 1).toISOString(),
    sourceIp: '10.0.1.55',
    affectedAssets: ['analyst-workstation-12'],
    description: 'User copied classification-marked entity properties to clipboard on a device without DLP agent installed. User acknowledged policy reminder.',
    assignee: 'J. O\'Brien',
    tlp: 'WHITE',
  },
  {
    id: 'inc-014',
    title: 'Expired Certificate Exploited',
    type: 'policy_violation',
    severity: 'low',
    status: 'resolved',
    timestamp: subDays(now(), 2).toISOString(),
    sourceIp: '10.0.0.9',
    affectedAssets: ['mtls-agent-gw'],
    description: 'Remote agent gateway accepted a connection using a certificate 3 days past expiry due to a clock-skew edge case. Cert rotated, clock sync alert added.',
    tlp: 'WHITE',
  },
];

export let MOCK_VULNERABILITIES: Vulnerability[] = [
  {
    id: 'vuln-001',
    cveId: 'CVE-2024-6387',
    title: 'OpenSSH regreSSHion — Remote Code Execution',
    severity: 'critical',
    cvssScore: 9.8,
    status: 'open',
    affectedAsset: 'bastion-hosts (×4)',
    component: 'openssh-server 8.9p1',
    discoveredAt: subDays(now(), 3).toISOString(),
    description: 'Signal handler race condition allows unauthenticated remote code execution as root on glibc-based systems.',
    remediation: 'Upgrade to OpenSSH 9.8 or apply vendor backport patch. Track via CHG-4471.',
  },
  {
    id: 'vuln-002',
    cveId: 'CVE-2024-3094',
    title: 'XZ Utils Supply-Chain Backdoor',
    severity: 'critical',
    cvssScore: 10.0,
    status: 'patching',
    affectedAsset: 'ingest-worker (×6)',
    component: 'liblzma 5.6.1',
    discoveredAt: subDays(now(), 6).toISOString(),
    description: 'Malicious code injected into the xz build process allows SSH authentication bypass on affected distributions.',
    remediation: 'Pin liblzma to 5.4.x, rebuild ingest-worker images, rotate any credentials exposed to affected hosts.',
  },
  {
    id: 'vuln-003',
    cveId: 'CVE-2024-21626',
    title: 'runc Container Breakout',
    severity: 'critical',
    cvssScore: 8.6,
    status: 'patching',
    affectedAsset: 'k8s-worker-pool',
    component: 'runc 1.1.11',
    discoveredAt: subDays(now(), 4).toISOString(),
    description: 'File descriptor leak allows a malicious container to gain access to the host filesystem.',
    remediation: 'Upgrade container runtime to runc 1.1.12+, restart node pool with rolling update.',
  },
  {
    id: 'vuln-004',
    cveId: 'CVE-2023-44487',
    title: 'HTTP/2 Rapid Reset DoS',
    severity: 'high',
    cvssScore: 7.5,
    status: 'mitigated',
    affectedAsset: 'api-gateway',
    component: 'gin/http2 stack',
    discoveredAt: subDays(now(), 12).toISOString(),
    description: 'Rapid stream creation/cancellation can exhaust server resources, causing denial of service.',
    remediation: 'Stream concurrency limits and connection-level rate limiting deployed at the edge load balancer.',
  },
  {
    id: 'vuln-005',
    title: 'Exposed Debug Metrics Endpoint',
    severity: 'high',
    cvssScore: 7.2,
    status: 'mitigated',
    affectedAsset: 'monitoring-service',
    component: 'internal /metrics route',
    discoveredAt: subDays(now(), 9).toISOString(),
    description: '/metrics endpoint reachable without authentication from the internal network, exposing service topology and query volumes.',
    remediation: 'Restricted to the monitoring VPC range and added bearer-token auth. Full auth rollout pending.',
  },
  {
    id: 'vuln-006',
    cveId: 'CVE-2023-4863',
    title: 'libwebp Heap Buffer Overflow',
    severity: 'high',
    cvssScore: 8.8,
    status: 'resolved',
    affectedAsset: 'image-thumbnailer',
    component: 'libwebp 1.3.1',
    discoveredAt: subDays(now(), 30).toISOString(),
    description: 'Crafted WebP images can trigger a heap overflow leading to potential remote code execution.',
    remediation: 'Upgraded to libwebp 1.3.2 across all document-processing containers. Verified via image scan.',
  },
  {
    id: 'vuln-007',
    title: 'Weak Password Policy on Service Accounts',
    severity: 'medium',
    cvssScore: 6.1,
    status: 'accepted_risk',
    affectedAsset: 'IAM / service accounts',
    component: 'auth-service policy config',
    discoveredAt: subDays(now(), 18).toISOString(),
    description: 'Legacy service accounts created before 2025 are exempt from the 20-character minimum password policy.',
    remediation: 'Scheduled for rotation to certificate-based auth in Q4 migration; risk accepted by Security Council until then.',
  },
  {
    id: 'vuln-008',
    title: 'Outdated TLS Cipher Suite on Legacy Endpoint',
    severity: 'medium',
    cvssScore: 5.3,
    status: 'open',
    affectedAsset: 'legacy-report-svc',
    component: 'nginx 1.18 TLS config',
    discoveredAt: subDays(now(), 5).toISOString(),
    description: 'Endpoint still negotiates TLS 1.1 and CBC cipher suites for backward compatibility with one external consumer.',
    remediation: 'Consumer notified of TLS 1.3-only cutover date; endpoint will be hardened after migration window closes.',
  },
];

export let MOCK_BLOCKLIST: BlocklistEntry[] = [
  {
    id: 'blk-001',
    value: '185.220.101.4',
    type: 'ip',
    reason: 'Tor exit node — sustained SSH brute-force probing',
    addedBy: 'System (auto-rule)',
    addedAt: subDays(now(), 1).toISOString(),
    hitCount: 214,
  },
  {
    id: 'blk-002',
    value: 'malicious-c2.ru',
    type: 'domain',
    reason: 'Matches known C2 infrastructure — DNS beacon pattern',
    addedBy: 'M. Williams',
    addedAt: subDays(now(), 2).toISOString(),
    hitCount: 58,
  },
  {
    id: 'blk-003',
    value: '45.155.205.87',
    type: 'ip',
    reason: 'Ransomware staging host (LockBit signature match)',
    addedBy: 'System (auto-rule)',
    addedAt: subMinutes(now(), 40).toISOString(),
    hitCount: 6,
  },
  {
    id: 'blk-004',
    value: '91.219.237.19',
    type: 'ip',
    reason: 'Credential stuffing botnet node',
    addedBy: 'S. Chen',
    addedAt: subMinutes(now(), 3).toISOString(),
    hitCount: 4812,
  },
  {
    id: 'blk-005',
    value: '103.152.36.9',
    type: 'ip',
    reason: 'SQL injection scanner — WAF signature match',
    addedBy: 'System (auto-rule)',
    addedAt: subHours(now(), 9).toISOString(),
    hitCount: 31,
  },
  {
    id: 'blk-006',
    value: 'evil-phish-login.uz',
    type: 'domain',
    reason: 'Phishing clone of platform login portal',
    addedBy: 'H. Al-Farsi',
    addedAt: subDays(now(), 4).toISOString(),
    hitCount: 17,
  },
  {
    id: 'blk-007',
    value: '194.36.190.0/24',
    type: 'cidr',
    reason: 'Bulletproof hosting range flagged by threat intel feed',
    addedBy: 'System (auto-rule)',
    addedAt: subDays(now(), 7).toISOString(),
    hitCount: 903,
    expiresAt: subDays(now(), -23).toISOString(),
  },
];

const THREAT_FEED_TEMPLATES: Omit<ThreatFeedItem, 'id' | 'timestamp'>[] = [
  { indicator: '91.219.237.19', type: 'ip', severity: 'critical', source: 'Internal IDS', description: 'Credential stuffing burst detected against auth-service', tags: ['brute-force', 'auth'] },
  { indicator: 'malicious-c2.ru', type: 'domain', severity: 'high', source: 'AlienVault OTX', description: 'Domain associated with active C2 infrastructure', tags: ['c2', 'malware'] },
  { indicator: '45.155.205.87', type: 'ip', severity: 'critical', source: 'Suricata IDS', description: 'Ransomware staging host — mass file write pattern', tags: ['ransomware'] },
  { indicator: 'd41d8cd98f00b204e9800998ecf8427e', type: 'hash', severity: 'medium', source: 'VirusTotal', description: 'File hash matches known dropper sample', tags: ['malware', 'dropper'] },
  { indicator: '185.220.101.4', type: 'ip', severity: 'high', source: 'AbuseIPDB', description: 'Tor exit node with elevated abuse confidence score (98%)', tags: ['tor', 'brute-force'] },
  { indicator: 'evil-phish-login.uz', type: 'url', severity: 'high', source: 'Cloudflare WAF', description: 'Phishing kit serving a clone of the platform login page', tags: ['phishing'] },
  { indicator: '103.152.36.9', type: 'ip', severity: 'medium', source: 'Zeek NSM', description: 'Automated SQLi scanning tool signature (sqlmap UA)', tags: ['scanner', 'web'] },
  { indicator: 'ops-report@corp-secure-mail.cn', type: 'email', severity: 'medium', source: 'MISP Feed', description: 'Sender address linked to a business email compromise campaign', tags: ['bec', 'phishing'] },
  { indicator: '198.51.100.72', type: 'ip', severity: 'low', source: 'Internal IDS', description: 'Geo-velocity anomaly on active session token', tags: ['impossible-travel'] },
  { indicator: '77.83.36.10', type: 'ip', severity: 'low', source: 'Recorded Future', description: 'New ASN observed for existing user login, low reputation score', tags: ['anomaly'] },
  { indicator: '203.0.113.44', type: 'ip', severity: 'medium', source: 'Cloudflare WAF', description: 'Part of a distributed volumetric traffic spike against api-gateway', tags: ['ddos'] },
  { indicator: 'c3f5a1e9b2d4.exe', type: 'hash', severity: 'high', source: 'VirusTotal', description: 'Binary flagged by 41/70 engines — generic trojan heuristic', tags: ['malware'] },
  { indicator: '172.16.0.44', type: 'ip', severity: 'medium', source: 'Internal DLP', description: 'API key exceeded data export volume threshold', tags: ['exfiltration'] },
  { indicator: 'update-secure-portal.net', type: 'domain', severity: 'high', source: 'AlienVault OTX', description: 'Newly registered domain typosquatting internal portal name', tags: ['phishing', 'typosquat'] },
];

let feedCounter = 0;
export function generateThreatFeedItem(): ThreatFeedItem {
  const tpl = THREAT_FEED_TEMPLATES[Math.floor(Math.random() * THREAT_FEED_TEMPLATES.length)];
  feedCounter += 1;
  return {
    ...tpl,
    id: `live-${Date.now()}-${feedCounter}`,
    timestamp: new Date().toISOString(),
  };
}

export const THREAT_FEED_SEED: ThreatFeedItem[] = Array.from({ length: 8 }).map((_, i) => ({
  ...THREAT_FEED_TEMPLATES[i % THREAT_FEED_TEMPLATES.length],
  id: `seed-${i}`,
  timestamp: subMinutes(now(), i * 3 + 1).toISOString(),
}));

// ---------------------------------------------------------------------------
// Derived analytics — risk score, trend series, severity breakdown, map
// ---------------------------------------------------------------------------

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#06B6D4',
  low: '#10B981',
};

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 100,
  high: 60,
  medium: 25,
  low: 5,
};

function computeTrend(incidents: SecurityIncident[]): SecurityTrendPoint[] {
  const days: SecurityTrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = subDays(now(), i);
    const label = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    days.push({ date: label, critical: 0, high: 0, medium: 0, low: 0 });
  }
  incidents.forEach((inc) => {
    const incDate = new Date(inc.timestamp);
    const diffDays = Math.floor((now().getTime() - incDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays > 6) return;
    const bucket = days[6 - diffDays];
    if (!bucket) return;
    (bucket as any)[inc.severity] += 1;
  });
  return days;
}

export function computeOverview(
  incidents: SecurityIncident[],
  vulnerabilities: Vulnerability[],
  blocklist: BlocklistEntry[]
): SecurityOverview {
  const open = incidents.filter((i) => i.status !== 'resolved');
  const criticalOpen = open.filter((i) => i.severity === 'critical').length;
  const highOpen = open.filter((i) => i.severity === 'high').length;
  const resolvedRecent = incidents.filter((i) => i.status === 'resolved').length;
  const openVulnerabilities = vulnerabilities.filter((v) => v.status === 'open' || v.status === 'patching').length;
  const criticalVulns = vulnerabilities.filter((v) => v.severity === 'critical' && v.status !== 'resolved').length;

  const rawScore = 12 + criticalOpen * 16 + highOpen * 7 + openVulnerabilities * 3 + criticalVulns * 6;
  const riskScore = Math.max(4, Math.min(100, Math.round(rawScore)));
  const riskLevel: SecurityOverview['riskLevel'] = riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'elevated' : 'nominal';

  const trend = computeTrend(incidents);
  const firstHalf = trend.slice(0, 3).reduce((sum, d) => sum + d.critical + d.high + d.medium + d.low, 0);
  const secondHalf = trend.slice(4).reduce((sum, d) => sum + d.critical + d.high + d.medium + d.low, 0);
  const riskTrend = firstHalf === 0 ? (secondHalf > 0 ? 100 : 0) : Math.round(((secondHalf - firstHalf) / firstHalf) * 100);

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  open.forEach((i) => { bySeverity[i.severity] += 1; });
  const severityBreakdown = (['critical', 'high', 'medium', 'low'] as const)
    .map((sev) => ({ name: sev, value: bySeverity[sev], color: SEVERITY_COLOR[sev] }))
    .filter((s) => s.value > 0);

  return {
    riskScore,
    riskLevel,
    riskTrend,
    criticalOpen,
    highOpen,
    openIncidents: open.length,
    resolvedRecent,
    blockedCount: blocklist.length,
    openVulnerabilities,
    mttr: '3h 42m',
    trend,
    severityBreakdown: severityBreakdown.length ? severityBreakdown : [{ name: 'none', value: 1, color: '#334155' }],
  };
}

export function computeAttackMap(incidents: SecurityIncident[]): AttackMapNode[] {
  const groups = new Map<string, { count: number; severity: string }>();
  incidents.forEach((inc) => {
    if (!inc.sourceIp || inc.sourceIp === 'unknown') return;
    const existing = groups.get(inc.sourceIp);
    if (existing) {
      existing.count += 1;
      if (SEVERITY_WEIGHT[inc.severity] > SEVERITY_WEIGHT[existing.severity]) {
        existing.severity = inc.severity;
      }
    } else {
      groups.set(inc.sourceIp, { count: 1, severity: inc.severity });
    }
  });

  return Array.from(groups.entries())
    .map(([ip, v]) => ({
      id: ip,
      label: ip,
      kind: (ip.startsWith('10.') || ip.startsWith('172.16.') ? 'asset' : 'ip') as AttackMapNode['kind'],
      incidentCount: v.count,
      severity: v.severity as AttackMapNode['severity'],
    }))
    .sort((a, b) => b.incidentCount - a.incidentCount)
    .slice(0, 9);
}

export const severityColor = (severity: string) => SEVERITY_COLOR[severity] ?? '#64748B';

// ---------------------------------------------------------------------------
// Public API — real backend calls when reachable, seeded demo data otherwise
// ---------------------------------------------------------------------------

// --- backend <-> UI mappers -------------------------------------------------

interface BackendIncident {
  id: string; type: string; severity: string; status: string;
  title: string; description: string; source_ip: string;
  affected_assets: string[] | null; tlp: string; assignee?: string | null; timestamp: string;
}
interface BackendVuln {
  id: string; cve_id?: string | null; title: string; severity: string; cvss_score: number;
  status: string; affected_asset: string; component: string; description: string;
  remediation: string; discovered_at: string;
}
interface BackendBlocklist {
  id: string; value: string; type: string; reason: string; hit_count: number;
  added_by: string; expires_at?: string | null; created_at: string;
}

function mapIncident(i: BackendIncident): SecurityIncident {
  return {
    id: i.id,
    title: i.title,
    type: i.type as SecurityIncident['type'],
    severity: i.severity as SecurityIncident['severity'],
    status: i.status as SecurityIncident['status'],
    timestamp: i.timestamp,
    sourceIp: i.source_ip,
    affectedAssets: i.affected_assets ?? [],
    description: i.description,
    assignee: i.assignee ?? undefined,
    tlp: (i.tlp as SecurityIncident['tlp']) ?? 'AMBER',
  };
}
function mapVuln(v: BackendVuln): Vulnerability {
  return {
    id: v.id,
    cveId: v.cve_id ?? undefined,
    title: v.title,
    severity: v.severity as Vulnerability['severity'],
    cvssScore: v.cvss_score,
    status: v.status as Vulnerability['status'],
    affectedAsset: v.affected_asset,
    component: v.component,
    discoveredAt: v.discovered_at,
    description: v.description,
    remediation: v.remediation,
  };
}
function mapBlocklist(b: BackendBlocklist): BlocklistEntry {
  return {
    id: b.id,
    value: b.value,
    type: b.type as BlocklistEntry['type'],
    reason: b.reason,
    addedBy: b.added_by,
    addedAt: b.created_at,
    expiresAt: b.expires_at ?? undefined,
    hitCount: b.hit_count,
  };
}

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  return (await p).data.data;
}

// Fetch helpers: real backend, falling back to seeded demo data on any error.
async function fetchIncidents(): Promise<SecurityIncident[]> {
  try {
    const data = await unwrap<BackendIncident[]>(apiClient.get('/v1/security/incidents'));
    if (!data?.length) return MOCK_INCIDENTS;
    return data.map(mapIncident);
  } catch {
    return MOCK_INCIDENTS;
  }
}
async function fetchVulnerabilities(): Promise<Vulnerability[]> {
  try {
    const data = await unwrap<BackendVuln[]>(apiClient.get('/v1/security/vulnerabilities'));
    if (!data?.length) return MOCK_VULNERABILITIES;
    return data.map(mapVuln);
  } catch {
    return MOCK_VULNERABILITIES;
  }
}
async function fetchBlocklist(): Promise<BlocklistEntry[]> {
  try {
    const data = await unwrap<BackendBlocklist[]>(apiClient.get('/v1/security/blocklist'));
    if (!data?.length) return MOCK_BLOCKLIST;
    return data.map(mapBlocklist);
  } catch {
    return MOCK_BLOCKLIST;
  }
}

export const securityApi = {
  async getOverview(): Promise<SecurityOverview> {
    const [incidents, vulns, blocklist] = await Promise.all([
      fetchIncidents(),
      fetchVulnerabilities(),
      fetchBlocklist(),
    ]);
    return computeOverview(incidents, vulns, blocklist);
  },

  async listIncidents(): Promise<SecurityIncident[]> {
    const incidents = await fetchIncidents();
    return incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async resolveIncident(id: string): Promise<SecurityIncident> {
    try {
      await apiClient.post(`/v1/security/incidents/${id}/resolve`);
    } catch { /* fall through to local update */ }
    MOCK_INCIDENTS = MOCK_INCIDENTS.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i));
    return MOCK_INCIDENTS.find((i) => i.id === id) ?? { ...MOCK_INCIDENTS[0], id, status: 'resolved' };
  },

  async updateIncidentStatus(id: string, status: SecurityIncident['status']): Promise<SecurityIncident> {
    try {
      await apiClient.patch(`/v1/security/incidents/${id}/status`, { status });
    } catch { /* fall through */ }
    MOCK_INCIDENTS = MOCK_INCIDENTS.map((i) => (i.id === id ? { ...i, status } : i));
    return MOCK_INCIDENTS.find((i) => i.id === id) ?? { ...MOCK_INCIDENTS[0], id, status };
  },

  async assignIncident(id: string, assignee: string): Promise<SecurityIncident> {
    try {
      await apiClient.post(`/v1/security/incidents/${id}/assign`, { assignee });
    } catch { /* fall through */ }
    MOCK_INCIDENTS = MOCK_INCIDENTS.map((i) => (i.id === id ? { ...i, assignee } : i));
    return MOCK_INCIDENTS.find((i) => i.id === id) ?? { ...MOCK_INCIDENTS[0], id, assignee };
  },

  async listVulnerabilities(): Promise<Vulnerability[]> {
    const vulns = await fetchVulnerabilities();
    return vulns.sort((a, b) => b.cvssScore - a.cvssScore);
  },

  async updateVulnerabilityStatus(id: string, status: Vulnerability['status']): Promise<Vulnerability> {
    try {
      const data = await unwrap<BackendVuln>(apiClient.patch(`/v1/security/vulnerabilities/${id}`, { status }));
      return mapVuln(data);
    } catch {
      MOCK_VULNERABILITIES = MOCK_VULNERABILITIES.map((v) => (v.id === id ? { ...v, status } : v));
      return MOCK_VULNERABILITIES.find((v) => v.id === id) ?? { ...MOCK_VULNERABILITIES[0], id, status };
    }
  },

  async listBlocklist(): Promise<BlocklistEntry[]> {
    const blocklist = await fetchBlocklist();
    return blocklist.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  },

  async addToBlocklist(value: string, type: BlocklistEntry['type'], reason: string): Promise<BlocklistEntry> {
    try {
      const data = await unwrap<BackendBlocklist>(
        apiClient.post('/v1/security/blocklist', { value, type, reason: reason || 'Manually added by administrator' })
      );
      return mapBlocklist(data);
    } catch {
      const entry: BlocklistEntry = {
        id: `blk-${Date.now()}`,
        value,
        type,
        reason: reason || 'Manually added by administrator',
        addedBy: 'You',
        addedAt: new Date().toISOString(),
        hitCount: 0,
      };
      MOCK_BLOCKLIST = [entry, ...MOCK_BLOCKLIST];
      return entry;
    }
  },

  async removeFromBlocklist(id: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/security/blocklist/${id}`);
    } catch { /* fall through */ }
    MOCK_BLOCKLIST = MOCK_BLOCKLIST.filter((b) => b.id !== id);
  },

  async getAttackMap(): Promise<AttackMapNode[]> {
    const incidents = await fetchIncidents();
    return computeAttackMap(incidents);
  },
};
