import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@automotive-os/database';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  DataFieldMeta,
  DataModelMeta,
  delegateName,
  getModelMeta,
  listModelMeta,
} from './admin-data.registry';

export interface DataListQuery {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
}

export interface DataListResponse {
  model: string;
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Generic, audited CRUD over every Prisma model for platform administrators
 * (AD-20). Values are coerced from JSON into Prisma types, secrets never cross
 * this boundary (see the registry), and every mutation writes its audit row in
 * the same transaction.
 *
 * Deliberately NOT applied here: domain state machines (tenant lifecycle,
 * listing moderation, lead transitions). This is the raw-table escape hatch
 * for operators; the console labels it as such.
 */
@Injectable()
export class AdminDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private delegate(model: DataModelMeta): any {
    return (this.prisma as any)[delegateName(model.name)];
  }

  private meta(modelName: string): DataModelMeta {
    const meta = getModelMeta(modelName);
    if (!meta) throw new NotFoundException(`MODEL_NOT_FOUND: ${modelName} is not a managed table`);
    return meta;
  }

  async listModels(): Promise<Array<{ name: string; table: string; labelField: string; rowCount: number; fieldCount: number }>> {
    const models = listModelMeta();
    const counts = await Promise.all(models.map((m) => this.delegate(m).count()));
    return models.map((m, i) => ({
      name: m.name,
      table: m.table,
      labelField: m.labelField,
      rowCount: counts[i],
      fieldCount: m.fields.length,
    }));
  }

  describe(modelName: string): DataModelMeta {
    return this.meta(modelName);
  }

  async list(modelName: string, query: DataListQuery): Promise<DataListResponse> {
    const meta = this.meta(modelName);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    const q = query.q?.trim();
    if (q) {
      const or: Record<string, unknown>[] = meta.searchableFields.map((f) => ({ [f]: { contains: q, mode: 'insensitive' } }));
      if (UUID_SHAPE.test(q)) {
        for (const f of meta.fields) {
          if (f.type === 'String' && (f.isId || f.isForeignKey)) or.push({ [f.name]: q });
        }
      }
      for (const f of meta.fields) {
        if (f.kind === 'enum' && f.enumValues?.includes(q.toUpperCase())) or.push({ [f.name]: q.toUpperCase() });
      }
      if (or.length === 0) {
        throw new BadRequestException('SEARCH_UNSUPPORTED: this table has no searchable text columns');
      }
      where.OR = or;
    }

    const sortField = query.sort && meta.fields.some((f) => f.name === query.sort && !f.isList && f.type !== 'Json')
      ? query.sort
      : meta.fields.some((f) => f.name === 'createdAt')
        ? 'createdAt'
        : meta.idField;
    const dir = query.dir === 'asc' ? 'asc' : 'desc';

    const [rows, total] = await Promise.all([
      this.delegate(meta).findMany({ where, orderBy: { [sortField]: dir }, skip, take: limit }),
      this.delegate(meta).count({ where }),
    ]);

    return {
      model: meta.name,
      items: rows.map((r: Record<string, unknown>) => this.serialize(meta, r)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async get(modelName: string, id: string): Promise<Record<string, unknown>> {
    const meta = this.meta(modelName);
    const row = await this.delegate(meta).findUnique({ where: { [meta.idField]: id } });
    if (!row) throw new NotFoundException(`${meta.name} ${id} not found`);
    return this.serialize(meta, row);
  }

  async create(modelName: string, input: Record<string, unknown>, adminUserId: string): Promise<Record<string, unknown>> {
    const meta = this.meta(modelName);
    const data = this.coerceInput(meta, input, 'create');
    const created = await this.prisma.$transaction(async (tx) => {
      const row = await (tx as any)[delegateName(meta.name)].create({ data });
      await this.auditService.logAction({
        actorUserId: adminUserId,
        action: 'PLATFORM_ADMIN_DATA_CREATE',
        targetType: meta.name,
        targetId: String(row[meta.idField]),
        metadata: { table: meta.table, fields: Object.keys(data) },
      });
      return row;
    }).catch((err: unknown) => this.rethrow(err, meta));
    return this.serialize(meta, created);
  }

  async update(modelName: string, id: string, input: Record<string, unknown>, adminUserId: string): Promise<Record<string, unknown>> {
    const meta = this.meta(modelName);
    const data = this.coerceInput(meta, input, 'update');
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('NO_CHANGES: no editable fields were supplied');
    }
    const before = await this.delegate(meta).findUnique({ where: { [meta.idField]: id } });
    if (!before) throw new NotFoundException(`${meta.name} ${id} not found`);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await (tx as any)[delegateName(meta.name)].update({ where: { [meta.idField]: id }, data });
      await this.auditService.logAction({
        actorUserId: adminUserId,
        action: 'PLATFORM_ADMIN_DATA_UPDATE',
        targetType: meta.name,
        targetId: id,
        metadata: {
          table: meta.table,
          changes: Object.fromEntries(
            Object.keys(data).map((k) => [k, { from: this.toJson(before[k]), to: this.toJson(row[k]) }]),
          ),
        },
      });
      return row;
    }).catch((err: unknown) => this.rethrow(err, meta));
    return this.serialize(meta, updated);
  }

  async remove(modelName: string, id: string, adminUserId: string, reason?: string): Promise<{ deleted: true; id: string }> {
    const meta = this.meta(modelName);
    const before = await this.delegate(meta).findUnique({ where: { [meta.idField]: id } });
    if (!before) throw new NotFoundException(`${meta.name} ${id} not found`);

    if (meta.name === 'User') {
      if (id === adminUserId) {
        throw new BadRequestException('CANNOT_MODIFY_OWN_ACCOUNT: you cannot delete your own administrator account.');
      }
      if (before.isPlatformAdmin && before.status === 'ACTIVE') {
        const others = await this.prisma.user.count({ where: { isPlatformAdmin: true, status: 'ACTIVE', id: { not: id } } });
        if (others === 0) {
          throw new BadRequestException('CANNOT_DISABLE_LAST_PLATFORM_ADMIN: at least one active platform administrator must remain.');
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await (tx as any)[delegateName(meta.name)].delete({ where: { [meta.idField]: id } });
      await this.auditService.logAction({
        actorUserId: adminUserId,
        action: 'PLATFORM_ADMIN_DATA_DELETE',
        targetType: meta.name,
        targetId: id,
        metadata: { table: meta.table, reason: reason ?? null, snapshot: this.serialize(meta, before) },
      });
    }).catch((err: unknown) => this.rethrow(err, meta));
    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------

  private rethrow(err: unknown, meta: DataModelMeta): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new ConflictException(`UNIQUE_VIOLATION: ${meta.name} already has a row with ${JSON.stringify((err.meta as any)?.target ?? 'these unique values')}`);
      }
      if (err.code === 'P2003') {
        throw new BadRequestException(`FOREIGN_KEY_VIOLATION: ${meta.name} references a row that does not exist, or other rows still depend on it`);
      }
      if (err.code === 'P2025') {
        throw new NotFoundException(`${meta.name} row not found`);
      }
    }
    throw err;
  }

  private toJson(value: unknown): unknown {
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Prisma.Decimal) return value.toString();
    return value ?? null;
  }

  private serialize(meta: DataModelMeta, row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of meta.fields) out[f.name] = this.toJson(row[f.name]);
    return out;
  }

  private coerceInput(meta: DataModelMeta, input: Record<string, unknown>, mode: 'create' | 'update'): Record<string, unknown> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new BadRequestException('BODY_INVALID: expected a JSON object of field values');
    }
    const byName = new Map(meta.fields.map((f) => [f.name, f]));
    const data: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const [key, raw] of Object.entries(input)) {
      const field = byName.get(key);
      if (!field) {
        errors.push(`${key}: unknown or protected field`);
        continue;
      }
      if (field.readOnly) {
        errors.push(`${key}: read-only`);
        continue;
      }
      try {
        data[key] = this.coerceValue(field, raw);
      } catch (e: any) {
        errors.push(`${key}: ${e.message}`);
      }
    }

    if (mode === 'create') {
      for (const f of meta.fields) {
        if (f.readOnly || f.hasDefault || !f.isRequired || f.isList) continue;
        if (data[f.name] === undefined || data[f.name] === null) errors.push(`${f.name}: required`);
      }
    }

    if (errors.length) throw new BadRequestException(errors);
    return data;
  }

  private coerceValue(field: DataFieldMeta, raw: unknown): unknown {
    if (raw === null || raw === undefined || raw === '') {
      if (field.isRequired && !field.isList) throw new Error('required');
      return field.isList ? [] : null;
    }
    if (field.isList) {
      const arr = Array.isArray(raw) ? raw : String(raw).split(',').map((s) => s.trim()).filter(Boolean);
      return arr.map((v) => this.coerceScalar({ ...field, isList: false }, v));
    }
    return this.coerceScalar(field, raw);
  }

  private coerceScalar(field: DataFieldMeta, raw: unknown): unknown {
    if (field.kind === 'enum') {
      const v = String(raw).toUpperCase();
      if (!field.enumValues?.includes(v)) throw new Error(`must be one of ${field.enumValues?.join(', ')}`);
      return v;
    }
    switch (field.type) {
      case 'String': {
        const s = String(raw);
        if (field.isId || field.isForeignKey) {
          if (!UUID_SHAPE.test(s)) throw new Error('must be a UUID');
          return s.toLowerCase();
        }
        return s;
      }
      case 'Int': {
        const n = Number(raw);
        if (!Number.isInteger(n)) throw new Error('must be an integer');
        return n;
      }
      case 'Float': {
        const n = Number(raw);
        if (!Number.isFinite(n)) throw new Error('must be a number');
        return n;
      }
      case 'BigInt': {
        const s = String(raw).trim();
        if (!/^-?\d+$/.test(s)) throw new Error('must be an integer (smallest currency unit)');
        return BigInt(s);
      }
      case 'Decimal': {
        const s = String(raw).trim();
        if (!/^-?\d+(\.\d+)?$/.test(s)) throw new Error('must be a decimal number');
        return new Prisma.Decimal(s);
      }
      case 'Boolean': {
        if (typeof raw === 'boolean') return raw;
        if (raw === 'true' || raw === '1') return true;
        if (raw === 'false' || raw === '0') return false;
        throw new Error('must be true or false');
      }
      case 'DateTime': {
        const d = new Date(String(raw));
        if (Number.isNaN(d.getTime())) throw new Error('must be an ISO 8601 timestamp');
        return d;
      }
      case 'Json': {
        if (typeof raw === 'string') {
          try {
            return JSON.parse(raw);
          } catch {
            throw new Error('must be valid JSON');
          }
        }
        return raw;
      }
      default:
        throw new Error(`unsupported type ${field.type}`);
    }
  }
}
