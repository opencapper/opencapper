import { useQueryStates } from "nuqs";
import { PICK_PARSERS } from "./pick-params";

export function usePickFilters() {
  return useQueryStates(PICK_PARSERS);
}
