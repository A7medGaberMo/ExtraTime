/**
 * In-memory imitation of the Convex database implementing exactly the surface
 * the squadDraft modules use. Lets tests drive real mutation/query handlers
 * against a deterministic fake without a backend.
 */

export type FieldMarker = { __field: string };

interface IndexDef {
  name: string;
  fields: string[];
}

const INDEXES: Record<string, IndexDef[]> = {
  rooms: [
    { name: "by_code", fields: ["code"] },
    { name: "by_status", fields: ["status"] },
    { name: "by_host", fields: ["hostId"] },
    { name: "by_guestId", fields: ["guestId"] },
    { name: "by_public_status", fields: ["isPublic", "status"] },
  ],
  squadDraftRooms: [
    { name: "by_room", fields: ["roomId"] },
    { name: "by_status", fields: ["status"] },
  ],
  squadDraftPicks: [
    { name: "by_room_user", fields: ["roomId", "userId"] },
    { name: "by_room_round", fields: ["roomId", "roundNumber"] },
  ],
  squadDraftSquads: [{ name: "by_room_user", fields: ["roomId", "userId"] }],
  matches: [{ name: "by_room", fields: ["roomId"] }],
  players: [
    { name: "by_tier", fields: ["tier"] },
    { name: "by_position", fields: ["position"] },
    { name: "by_club", fields: ["clubId"] },
    { name: "by_nation", fields: ["nationId"] },
    { name: "by_legend", fields: ["isLegend"] },
    { name: "by_season", fields: ["seasonYear"] },
    { name: "by_apiId", fields: ["apiId"] },
    { name: "by_name", fields: ["name"] },
  ],
  clubs: [],
  nations: [],
};

interface DocTable {
  _id: string;
  _creationTime: number;
  [key: string]: unknown;
}

interface Cond {
  field: string;
  b: unknown;
}

interface Pending {
  table: string;
  index?: string;
  prefixEquals: Array<[string, unknown]>;
  conditions: Cond[];
  orderDir?: "asc";
}

export class FakeConvexDb {
  private tables: Record<string, Map<string, DocTable>> = {};
  private seq = 0;

  constructor() {
    for (const name of Object.keys(INDEXES)) this.tables[name] = new Map();
  }

  /** Seed a raw document (used by test fixtures). */
  seed(table: string, doc: Record<string, unknown>): string {
    this.tables[table] ??= new Map();
    const id = `${table}:${this.seq++}:test${Math.floor(Math.random() * 1e6)}`;
    const full: DocTable = { _id: id, _creationTime: Date.now() + this.seq, ...doc };
    this.tables[table].set(id, full);
    return id;
  }

  insert(table: string, doc: Record<string, unknown>): Promise<string> {
    return Promise.resolve(this.seed(table, doc));
  }

  async get(id: string): Promise<DocTable | null> {
    for (const map of Object.values(this.tables)) {
      const doc = map.get(id);
      if (doc) return doc;
    }
    return null;
  }

  async patch(id: string, patch: Record<string, unknown>): Promise<void> {
    for (const map of Object.values(this.tables)) {
      const doc = map.get(id);
      if (doc) {
        Object.assign(doc, patch);
        return;
      }
    }
    throw new Error(`fake-db: patch target ${id} not found`);
  }

  async delete(id: string): Promise<void> {
    for (const map of Object.values(this.tables)) map.delete(id);
  }

  /** Rows of a table (sorted by creation time); used by assertions. */
  rows(table: string): DocTable[] {
    return [...(this.tables[table] ?? new Map()).values()].sort(
      (a, b) => a._creationTime - b._creationTime
    );
  }

  query(table: string) {
    const pending: Pending = { table, prefixEquals: [], conditions: [] };
    const self = this;
    return {
      withIndex(name: string, fn?: (q: { eq: (f: string, v: unknown) => unknown }) => void) {
        const def = INDEXES[table]?.find((i) => i.name === name);
        if (!def) throw new Error(`fake-db: no index ${name} on ${table}`);
        pending.index = name;
        if (fn) {
          const indexQ = {
            eq: (f: string, v: unknown) => {
              pending.prefixEquals.push([f, v]);
              return indexQ;
            },
          };
          fn(indexQ);
        }
        return this;
      },
      order(dir: "asc") {
        pending.orderDir = dir;
        return this;
      },
      filter(fn: (q: Builder) => void) {
        const builder = new Builder();
        fn(builder);
        pending.conditions.push(...builder.conditions);
        return this;
      },
      collect: () => Promise.resolve(resolveRows()),
      first: () => Promise.resolve(resolveRows()[0] ?? null),
    };

    function resolveRows(): DocTable[] {
      let rows = [...(self.tables[table] ?? new Map()).values()].filter((doc) => {
        for (const [field, value] of pending.prefixEquals) {
          if (doc[field] !== value) return false;
        }
        for (const cond of pending.conditions) {
          if (doc[cond.field] !== cond.b) return false;
        }
        return true;
      });
      if (pending.orderDir) {
        const fields = INDEXES[table]?.find((i) => i.name === pending.index)?.fields ?? [];
        const orderField = fields[pending.prefixEquals.length];
        if (orderField) {
          rows = [...rows].sort((a, b) => (a[orderField] as number) - (b[orderField] as number));
        }
      }
      return rows;
    }
  }
}

class Builder {
  conditions: Cond[] = [];
  eq(a: string | FieldMarker, b: unknown) {
    const field = typeof a === "string" ? a : a.__field;
    this.conditions.push({ a: field, b });
  }
  field(name: string): FieldMarker {
    return { __field: name };
  }
}

/**
 * Wraps a fake DB into the partial Convex ctx shape handlers receive.
 * Types are intentionally loose — this is a test double.
 */
export function makeCtx(db: FakeConvexDb) {
  return {
    db: {
      query: (t: string) => db.query(t),
      get: (id: string) => db.get(id),
      insert: (t: string, d: Record<string, unknown>) => db.insert(t, d),
      patch: (id: string, p: Record<string, unknown>) => db.patch(id, p),
      delete: (id: string) => db.delete(id),
    },
  } as never;
}

/** Typed convenience for `as never`-casted ctx in handlers. */
export type AnyCtx = ReturnType<typeof makeCtx>;