import { z } from "zod";
import { getRequestUser } from "@/lib/auth";
import { getBindings } from "@/lib/cloudflare";
import { errorResponse, HttpError } from "@/lib/http";

const decisionSchema = z.object({ decision: z.enum(["accepted", "rejected"]), note: z.string().trim().max(500).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const user = await getRequestUser(request);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Sign in to record a decision");
    const input = decisionSchema.parse(await request.json());
    const env = await getBindings();
    const result = await env.DB.prepare("UPDATE run SET decision = ?, decision_note = ? WHERE id = ? AND user_id = ? AND status = 'ready'").bind(input.decision, input.note ?? null, runId, user.id).run();
    if (!result.meta.changes) throw new HttpError(404, "RUN_NOT_FOUND", "Ready run not found");
    return Response.json({ decision: input });
  } catch (error) { return errorResponse(error); }
}
