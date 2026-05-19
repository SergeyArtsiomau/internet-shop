export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "/api";

export const COMMAND_ID = process.env.NEXT_PUBLIC_COMMAND_ID ?? "";
