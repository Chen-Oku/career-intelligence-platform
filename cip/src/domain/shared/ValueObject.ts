/**
 * ValueObject — Base class for domain value objects.
 *
 * Why: Value objects have no identity. Two DateRanges are equal
 * if their properties are identical. They are immutable by design.
 *
 * We freeze props at construction time so TypeScript's type system
 * and the runtime agree: after creation, this object cannot change.
 * If you need a "modified" value object, create a new one.
 */
export abstract class ValueObject<TProps> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  /**
   * Structural equality — two VOs with the same properties are equal.
   */
  equals(other?: ValueObject<TProps>): boolean {
    if (other == null) return false;
    if (other.constructor !== this.constructor) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
