import { connectLambda } from "@netlify/blobs";
import type { HandlerEvent } from "@netlify/functions";

export function initBlobs(event: HandlerEvent) {
  // Nécessaire en "Functions v1 / Lambda compatibility mode"
  connectLambda(event as any);
}
