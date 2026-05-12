export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://19429ba06ff2.vps.myjino.ru/api";

/** Ид команды для изоляции данных; задайте одинаковым у всей группы */
export const COMMAND_ID = process.env.NEXT_PUBLIC_COMMAND_ID ?? "";
