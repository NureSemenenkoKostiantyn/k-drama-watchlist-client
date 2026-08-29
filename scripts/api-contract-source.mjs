import { existsSync } from "node:fs";
import { resolve } from "node:path";

const candidates = [
  process.env.DRAMA_WATCH_OPENAPI,
  resolve("api-contract-source", "openapi", "drama-watch.openapi.json"),
  resolve("..", "k-drama-watchlist-server", "openapi", "drama-watch.openapi.json"),
].filter(Boolean);

export function findApiContractSource() {
  const source = candidates.find((candidate) => existsSync(candidate));

  if (!source) {
    throw new Error(
      "Drama Watch OpenAPI source was not found. Set DRAMA_WATCH_OPENAPI or check out the server repository beside the client.",
    );
  }

  return source;
}
