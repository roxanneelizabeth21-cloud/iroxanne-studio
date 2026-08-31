import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { TEMPLATE_DEFS } from '../../shared/emailTemplates.ts';

// Admin-only. Returns every automated email template: its definition (name,
// when it sends, merge fields, built-in default copy) merged with the admin's
// saved override, so the admin UI never duplicates the backend registry.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admins only' }, { status: 403 });
    }

    const saved = await base44.asServiceRole.entities.EmailTemplate.list().catch(() => []);
    const byKey = new Map((saved || []).map((r: any) => [r.key, r]));

    const templates = TEMPLATE_DEFS.map((def) => {
      const rec: any = byKey.get(def.key) || null;
      const savedSubject = String(rec?.subject || '').trim();
      const savedBody = String(rec?.body || '').trim();
      return {
        key: def.key,
        name: def.name,
        description: def.description,
        audience: def.audience,
        body_label: def.body_label,
        merge_fields: def.merge_fields,
        default_subject: def.subject,
        default_body: def.body,
        record_id: rec?.id || null,
        subject: savedSubject,
        body: savedBody,
        // "Edited" only when the saved copy actually differs from the built-in
        // default (every template is seeded with its default copy).
        is_customized:
          (!!savedSubject && savedSubject !== def.subject.trim()) ||
          (!!savedBody && savedBody !== def.body.trim()),
        // Only flag emptiness for templates the admin has actually saved —
        // an untouched template is simply running on its built-in copy.
        empty_fields: rec ? [savedSubject ? null : 'subject', savedBody ? null : 'body'].filter(Boolean) : [],
      };
    });

    return Response.json({ templates });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}