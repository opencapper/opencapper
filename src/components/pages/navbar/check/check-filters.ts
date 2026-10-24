import { useQueryStates } from "nuqs";
import { CHECK_PARSERS } from "./check-params";

export function useCheckParams() {
  return useQueryStates(CHECK_PARSERS);
}
