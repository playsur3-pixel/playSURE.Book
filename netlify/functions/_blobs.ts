import type { HandlerEvent } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";

export function getBlobsStore(event: HandlerEvent, name: string) {
  // obligatoire en "lambda compatibility mode"
  connectLambda(event as any);
  return getStore(name);
}
