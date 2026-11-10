import { FeishuBaseApiService } from '../../services/feishu/FeishuBaseApiService.js';
import { resolveTableToken } from '../../utils/tableReference.js';
import type { z } from 'zod';
import type { NewFieldSchema, SearchShape } from './schemas.js';

type SearchOptions = z.output<z.ZodObject<typeof SearchShape>>;
type RecordFields = Record<string, unknown>;

export class FeishuBitableService extends FeishuBaseApiService {
  private async path(base: string, tableId?: string): Promise<string> {
    const token = await resolveTableToken(base, 'bitable', (token) =>
      this.get('/wiki/v2/spaces/get_node', { token }),
    );
    const root = `/bitable/v1/apps/${token}/tables`;
    return tableId ? `${root}/${encodeURIComponent(tableId)}` : root;
  }

  createBase(name: string, folderToken?: string): Promise<unknown> {
    return this.post('/bitable/v1/apps', { name, folder_token: folderToken });
  }

  async listTables(base: string, pageSize: number, pageToken?: string): Promise<unknown> {
    return this.get(await this.path(base), { page_size: pageSize, page_token: pageToken });
  }

  async createTable(
    base: string,
    name: string,
    fields?: z.infer<typeof NewFieldSchema>[],
  ): Promise<unknown> {
    return this.post(await this.path(base), { table: { name, fields } });
  }

  async listFields(
    base: string,
    tableId: string,
    pageSize: number,
    pageToken?: string,
  ): Promise<unknown> {
    return this.get(`${await this.path(base, tableId)}/fields`, {
      page_size: pageSize,
      page_token: pageToken,
    });
  }

  async searchRecords(base: string, tableId: string, options: SearchOptions): Promise<unknown> {
    const { pageSize, pageToken, viewId, fieldNames, filter, sort, automaticFields } = options;
    const query = new URLSearchParams({ page_size: String(pageSize), user_id_type: 'open_id' });
    if (pageToken) query.set('page_token', pageToken);
    return this.post(`${await this.path(base, tableId)}/records/search?${query}`, {
      view_id: viewId,
      field_names: fieldNames,
      filter,
      sort,
      automatic_fields: automaticFields,
    });
  }

  async createRecords(
    base: string,
    tableId: string,
    records: { fields: RecordFields }[],
  ): Promise<unknown> {
    return this.post(
      `${await this.path(base, tableId)}/records/batch_create?user_id_type=open_id`,
      { records },
    );
  }

  async updateRecords(
    base: string,
    tableId: string,
    records: { record_id: string; fields: RecordFields }[],
  ): Promise<unknown> {
    return this.post(
      `${await this.path(base, tableId)}/records/batch_update?user_id_type=open_id`,
      { records },
    );
  }

  async deleteRecords(base: string, tableId: string, records: string[]): Promise<unknown> {
    return this.post(`${await this.path(base, tableId)}/records/batch_delete`, { records });
  }
}
