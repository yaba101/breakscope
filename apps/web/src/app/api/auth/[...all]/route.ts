import { createAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

async function handler(request: Request) {
  try { return (await createAuth()).handler(request); }
  catch (error) { return errorResponse(error); }
}

export const GET = handler;
export const POST = handler;
