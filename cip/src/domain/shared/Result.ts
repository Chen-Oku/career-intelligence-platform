/**
 * Result<T, E> — Explicit success/failure return type.
 *
 * Why not throw exceptions?
 * Exceptions are invisible in function signatures. When a use case
 * calls a repository, nothing in the type system tells callers that
 * it might fail. Result makes errors a first-class concern.
 *
 * Usage:
 *   const result = Experience.create(props);
 *   if (!result.ok) {
 *     return NextResponse.json({ error: result.error.message }, { status: 422 });
 *   }
 *   await repository.save(result.value);
 */

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },

  err<E = Error>(error: E): Result<never, E> {
    return { ok: false, error };
  },
};

/**
 * AsyncResult — shorthand for use cases that are always async.
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
