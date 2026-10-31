import type { ApiPick } from "@/lib/types";
import { ApiError } from "@/server/errors";
import { findPick, type PickRef } from "@/server/picks/picks.service";
import { isHiddenProfile } from "@/server/users/hidden";

// By id always, hidden profiles included like the log; by capper and sequence only for visible profiles.
export async function getPublicPick(ref: PickRef): Promise<ApiPick> {
  const pick = await findPick(ref);
  if (!pick || ("username" in ref && (await isHiddenProfile(ref.username))))
    throw new ApiError(404, "ERRORS.PICK_NOT_FOUND");
  return pick;
}
