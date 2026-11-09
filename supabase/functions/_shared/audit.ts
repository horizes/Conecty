/**
 * Auditoria de segurança para Edge Functions da Conecty.
 *
 * Requer a migration `20261108120000_security_events.sql`.
 * Nunca envie senha, token, chave Omie ou dado financeiro em `metadata`.
 * `sanitizeMetadata` remove chaves sensíveis antes da gravação.
 */

type RpcClient = {
  rpc(
    name: string,
    params: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export const SECURITY_ACTIONS = {
  loginSuccess: "auth.login.success",
  loginFailure: "auth.login.failure",
  logout: "auth.logout",
  passwordChanged: "auth.password.changed",
  passwordResetRequested: "auth.password.reset_requested",
  sessionRevoked: "auth.session.revoked",
  inviteCreated: "admin.invite.created",
  inviteAccepted: "admin.invite.accepted",
  inviteRevoked: "admin.invite.revoked",
  permissionChanged: "admin.permission.changed",
  userCreated: "admin.user.created",
  userDisabled: "admin.user.disabled",
  clientCreated: "admin.client.created",
  clientUpdated: "admin.client.updated",
  credentialsUpdated: "admin.credentials.updated",
  exportGenerated: "data.export.generated",
  syncStarted: "sync.started",
  syncFailed: "sync.failed",
  syncSucceeded: "sync.succeeded",
  rateLimited: "security.rate_limited",
  accessDenied: "security.access_denied",
} as const;

export type SecurityAction = (typeof SECURITY_ACTIONS)[keyof typeof SECURITY_ACTIONS];
export type Severity = "info" | "warning" | "critical";

export type SecurityEvent = {
  action: SecurityAction | string;
  severity?: Severity;
  entity?: string;
  entityId?: string;
  customerId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
};

export type RequestContext = { ip?: string | null; userAgent?: string | null };

export function requestContext(req: Request): RequestContext {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  return { ip: ip?.slice(0, 60) ?? null, userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null };
}

export async function recordSecurityEvent(
  admin: RpcClient,
  event: SecurityEvent,
  context: RequestContext = {},
): Promise<void> {
  const { error } = await admin.rpc("conecty_security_event", {
    p_action: event.action,
    p_entity: event.entity ?? null,
    p_entity_id: event.entityId ?? null,
    p_customer_id: event.customerId ?? null,
    p_severity: event.severity ?? "info",
    p_metadata: sanitizeMetadata(event.metadata ?? {}),
    p_actor_id: event.actorId ?? null,
    p_actor_email: event.actorEmail ?? null,
    p_actor_role: event.actorRole ?? null,
    p_ip: context.ip ?? null,
    p_user_agent: context.userAgent ?? null,
  });

  if (error) {
    // Falha de auditoria não deve derrubar a operação, mas precisa ser visível.
    console.error(JSON.stringify({ event: "audit_write_error", action: event.action, message: error.message }));
  }
}

const SENSITIVE_KEY = /(password|senha|token|secret|authorization|apikey|api_key|credential|chave)/i;

export function sanitizeMetadata(value: unknown, depth = 0): Record<string, unknown> {
  if (depth > 3 || value === null || typeof value !== "object") return {};
  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (raw === null || ["string", "number", "boolean"].includes(typeof raw)) {
      output[key] = typeof raw === "string" ? raw.slice(0, 500) : raw;
    } else if (Array.isArray(raw)) {
      output[key] = raw
        .slice(0, 20)
        .filter((item) => ["string", "number", "boolean"].includes(typeof item))
        .map((item) => (typeof item === "string" ? item.slice(0, 200) : item));
    } else if (typeof raw === "object") {
      output[key] = sanitizeMetadata(raw, depth + 1);
    }
  }
  return output;
}
