export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://19429ba06ff2.vps.myjino.ru/api";

export const COMMAND_ID = process.env.NEXT_PUBLIC_COMMAND_ID ?? "";
