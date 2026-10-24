import { getAuth } from "@/server/auth/auth";

function handler(request: Request) {
  return getAuth().handler(request);
}

export const GET = handler;
export const POST = handler;
