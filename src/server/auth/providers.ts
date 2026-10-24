import type { AuthProviders } from "@/lib/types";
import { serverEnv } from "@/server/env";

export function getAuthProviders(): AuthProviders {
  return {
    google: serverEnv.googleEnabled,
    telegramBot: serverEnv.telegramEnabled
      ? serverEnv.telegramBotUsername
      : null,
  };
}
