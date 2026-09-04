/**
 * Package-owned invariant companion for @dsh/web-search-advanced.
 * @module @dsh/web-search-advanced/invariant
 */
import { declareInvariant } from '@deepseek-ai/dsh-invariants'
const PACKAGE_NAME = '@dsh/web-search-advanced'
export const name = 'web-search-advanced-invariant'
/** @internal */
export const invariant = declareInvariant(PACKAGE_NAME, 'invariant')
