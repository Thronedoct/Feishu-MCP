import { FeishuBaseApiService } from '../../services/feishu/FeishuBaseApiService.js';
import { resolveTableToken } from '../../utils/tableReference.js';
import type { z } from 'zod';
import type { ValueRangeSchema } from './schemas.js';

export class FeishuSheetsService extends FeishuBaseApiService {
  private token(spreadsheet: string): Promise<string> {
    return resolveTableToken(spreadsheet, 'sheet', (token) =>
      this.get('/wiki/v2/spaces/get_node', { token }),
    );
  }

  createSpreadsheet(title: string, folderToken?: string): Promise<unknown> {
    return this.post('/sheets/v3/spreadsheets', { title, folder_token: folderToken });
  }

  async listSheets(spreadsheet: string): Promise<unknown> {
    const token = await this.token(spreadsheet);
    return this.get(`/sheets/v3/spreadsheets/${token}/sheets/query`);
  }

  async readCells(
    spreadsheet: string,
    range: string,
    valueRenderOption: string,
    dateTimeRenderOption: string,
  ): Promise<unknown> {
    const token = await this.token(spreadsheet);
    return this.get(`/sheets/v2/spreadsheets/${token}/values/${encodeURIComponent(range)}`, {
      valueRenderOption,
      dateTimeRenderOption,
    });
  }

  async writeCells(
    spreadsheet: string,
    valueRanges: z.infer<typeof ValueRangeSchema>[],
  ): Promise<unknown> {
    const token = await this.token(spreadsheet);
    return this.post(`/sheets/v2/spreadsheets/${token}/values_batch_update`, { valueRanges });
  }

  async appendRows(
    spreadsheet: string,
    valueRange: z.infer<typeof ValueRangeSchema>,
  ): Promise<unknown> {
    const token = await this.token(spreadsheet);
    return this.post(`/sheets/v2/spreadsheets/${token}/values_append`, { valueRange });
  }

  async addSheet(spreadsheet: string, title: string): Promise<unknown> {
    const token = await this.token(spreadsheet);
    return this.post(`/sheets/v2/spreadsheets/${token}/sheets_batch_update`, {
      requests: [{ addSheet: { properties: { title } } }],
    });
  }
}
