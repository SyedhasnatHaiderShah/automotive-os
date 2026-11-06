import { Prisma } from '@automotive-os/database';

/**
 * Platform-admin data console: model/field metadata derived from the Prisma
 * DMMF, so every table in the schema is browsable and editable without a
 * hand-written form per model (AD-20).
 *
 * Security posture:
 * - secret columns are never read or written through this surface;
 * - identifiers and timestamps are read-only;
 * - relation objects are excluded (foreign keys stay editable as ids).
 */

export type ScalarKind = 'scalar' | 'enum';

export interface DataFieldMeta {
  name: string;
  column: string;
  kind: ScalarKind;
  /** Prisma scalar type (String, Int, BigInt, Boolean, DateTime, Json, Decimal) or enum name. */
  type: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  /** Not accepted on create or update (ids, timestamps, secrets). */
  readOnly: boolean;
  hasDefault: boolean;
  isForeignKey: boolean;
  /** Target model for foreign keys, when known. */
  references?: string;
  enumValues?: string[];
}

export interface DataModelMeta {
  name: string;
  table: string;
  idField: string;
  /** Field used to label a row in lists and relation pickers. */
  labelField: string;
  fields: DataFieldMeta[];
  searchableFields: string[];
}

/** Columns that must never leave the database through the admin console. */
const HIDDEN_FIELDS: Record<string, string[]> = {
  User: ['passwordHash', 'mfaSecret', 'emailVerificationTokenHash'],
  Session: ['tokenHash'],
  UserInvitation: ['tokenHash'],
};

const READ_ONLY_FIELDS = new Set(['createdAt', 'updatedAt', 'occurredAt']);
const LABEL_CANDIDATES = ['displayName', 'name', 'title', 'slug', 'email', 'code', 'stockNumber', 'action', 'eventType', 'objectKey', 'id'];

function buildRegistry(): Map<string, DataModelMeta> {
  const registry = new Map<string, DataModelMeta>();
  const enums = new Map(Prisma.dmmf.datamodel.enums.map((e) => [e.name, e.values.map((v) => v.name)]));

  for (const model of Prisma.dmmf.datamodel.models) {
    const hidden = new Set(HIDDEN_FIELDS[model.name] ?? []);
    // relationFromFields -> relation target model, for FK hints
    // Single-column relations name the target best (tenantId -> Tenant); a
    // composite relation such as [tenantId, branchId] -> Branch must not
    // overwrite that, so it only fills columns no simpler relation claimed.
    const fkTargets = new Map<string, string>();
    const relations = model.fields.filter((f) => f.kind === 'object' && f.relationFromFields?.length);
    for (const f of [...relations].sort((x, y) => (x.relationFromFields?.length ?? 0) - (y.relationFromFields?.length ?? 0))) {
      for (const from of f.relationFromFields ?? []) {
        if (!fkTargets.has(from)) fkTargets.set(from, f.type);
      }
    }

    const fields: DataFieldMeta[] = [];
    for (const f of model.fields) {
      if (f.kind !== 'scalar' && f.kind !== 'enum') continue;
      if (hidden.has(f.name)) continue;
      const isId = Boolean(f.isId);
      fields.push({
        name: f.name,
        column: f.dbName ?? f.name,
        kind: f.kind,
        type: f.type,
        isList: f.isList,
        isRequired: f.isRequired,
        isId,
        readOnly: isId || READ_ONLY_FIELDS.has(f.name) || Boolean(f.isUpdatedAt),
        hasDefault: Boolean(f.hasDefaultValue),
        isForeignKey: fkTargets.has(f.name),
        references: fkTargets.get(f.name),
        enumValues: f.kind === 'enum' ? enums.get(f.type) : undefined,
      });
    }

    const idField = model.fields.find((f) => f.isId)?.name ?? 'id';
    const names = new Set(fields.map((f) => f.name));
    const labelField = LABEL_CANDIDATES.find((c) => names.has(c) && c !== 'id') ?? idField;
    const searchableFields = fields
      .filter((f) => f.kind === 'scalar' && f.type === 'String' && !f.isList && !f.isId && !f.isForeignKey)
      .map((f) => f.name);

    registry.set(model.name, {
      name: model.name,
      table: model.dbName ?? model.name,
      idField,
      labelField,
      fields,
      searchableFields,
    });
  }
  return registry;
}

export const DATA_REGISTRY: ReadonlyMap<string, DataModelMeta> = buildRegistry();

export function getModelMeta(name: string): DataModelMeta | undefined {
  return DATA_REGISTRY.get(name);
}

export function listModelMeta(): DataModelMeta[] {
  return [...DATA_REGISTRY.values()];
}

/** Prisma client delegate name for a model (`Vehicle` -> `vehicle`, `CarModel` -> `carModel`). */
export function delegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}
