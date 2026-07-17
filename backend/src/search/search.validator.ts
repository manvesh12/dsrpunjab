import { ApiError } from "../common/exceptions/api-error.js";

export function searchRequest(body: any) {
  if (!body?.query) throw new ApiError(400, "SEARCH_QUERY_REQUIRED", "Query is required for semantic search");
  return { query: String(body.query), limit: Number(body.limit ?? 5) };
}

export function indexRequest(body: any) {
  if (!body?.projectId || !body?.content) {
    throw new ApiError(400, "SEARCH_INDEX_INPUT_REQUIRED", "projectId and content are required");
  }
  return {
    projectId: BigInt(body.projectId),
    section: String(body.section || "General"),
    content: String(body.content)
  };
}
