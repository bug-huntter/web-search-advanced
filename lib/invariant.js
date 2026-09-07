import { declareInvariant } from "@deepseek-ai/dsh-invariants";

//#region src/invariant.ts
const PACKAGE_NAME = "@lp181818/web-search-advanced";
const name = "web-search-advanced-invariant";
/** @internal */
const invariant = declareInvariant(PACKAGE_NAME, "invariant");

//#endregion
export { invariant, name };