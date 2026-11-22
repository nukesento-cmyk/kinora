import { email } from "@kinora/core";
import { devMailboxResponse } from "@/server/dev-mailbox";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return devMailboxResponse(request, process.env, email.devMailbox());
}

export function DELETE(request: Request) {
  return devMailboxResponse(request, process.env, email.devMailbox());
}
