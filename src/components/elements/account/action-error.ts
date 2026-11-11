import type { ActionError } from "@/lib/auth/actions";
import type { Translate } from "@/lib/format";

export function actionErrorText(error: ActionError, t: Translate): string {
  if (error === "signed_out") return t("ERRORS.SIGNED_OUT");
  if (error === "not_found") return t("ERRORS.NOT_FOUND");
  if (error === "taken") return t("ERRORS.TAKEN");
  if (error === "credentials") return t("ERRORS.CREDENTIALS");
  if (error === "password_length") return t("ERRORS.PASSWORD_LENGTH");
  if (error === "unreachable") return t("ERRORS.UNREACHABLE");
  return t("ERRORS.INVALID");
}
