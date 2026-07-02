/**
 * Entity — Base class for all domain entities.
 *
 * Why: Entities are objects with identity that persists over time.
 * Two Experiences are the same entity if they share the same id,
 * regardless of whether their properties have changed.
 *
 * We generate the id at the domain layer (not the database layer)
 * so the entity exists as a fully-formed object before it's ever
 * persisted. This makes testing easier and the domain more honest.
 */
export abstract class Entity<TProps> {
  protected readonly _id: string;
  protected props: TProps;

  protected constructor(props: TProps, id?: string) {
    // Use provided id (reconstituting from DB) or generate a new one
    this._id = id ?? crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  /**
   * Entities are equal if they have the same identity.
   * Property values are irrelevant for equality.
   */
  equals(other?: Entity<TProps>): boolean {
    if (other == null) return false;
    if (this === other) return true;
    return this._id === other._id;
  }
}
