import {
  ITEM_CATEGORIES,
  ipcChannels,
  type ItemCategory,
  type StockItem,
  type StockItemInput,
  type UpdateStockItemInput,
} from '../../shared/types';
import {
  assertEnum,
  deleteById,
  insertAndReturn,
  readAll,
  readOne,
  registerHandler,
  requiredId,
  requiredText,
  updateAndReturn,
} from './util';

const STOCK_COLUMNS = [
  'item_name',
  'category',
  'sub_category',
  'unit',
  'qty_in_stock',
  'reorder_level',
  'supplier',
  'notes',
] as const;

export function listStockItems(): StockItem[] {
  return readAll<StockItem>('SELECT * FROM stock_items ORDER BY item_name ASC');
}

export function getStockItem(id: number): StockItem | null {
  return readOne<StockItem>('SELECT * FROM stock_items WHERE id = ?', requiredId(id));
}

export function createStockItem(input: StockItemInput): StockItem {
  return insertAndReturn<StockItem>(
    'stock_items',
    STOCK_COLUMNS,
    {
      ...input,
      item_name: requiredText(input?.item_name, 'Item name'),
      category: assertEnum<ItemCategory>(input?.category, ITEM_CATEGORIES, 'Category'),
      unit: requiredText(input?.unit, 'Unit'),
    },
    '*',
  );
}

export function updateStockItem(input: UpdateStockItemInput): StockItem {
  const id = requiredId(input?.id);
  const patch: Record<string, unknown> = { ...input };
  delete patch.id;
  if (input.item_name !== undefined) {
    patch.item_name = requiredText(input.item_name, 'Item name');
  }
  if (input.category !== undefined) {
    patch.category = assertEnum<ItemCategory>(input.category, ITEM_CATEGORIES, 'Category');
  }
  if (input.unit !== undefined) {
    patch.unit = requiredText(input.unit, 'Unit');
  }
  return updateAndReturn<StockItem>('stock_items', STOCK_COLUMNS, id, patch, '*', {
    touchUpdatedAt: true,
  });
}

export function deleteStockItem(id: number): void {
  deleteById('stock_items', requiredId(id), 'Stock item');
}

export function registerStockHandlers(): void {
  registerHandler(ipcChannels.stock.list, listStockItems);
  registerHandler(ipcChannels.stock.get, getStockItem);
  registerHandler(ipcChannels.stock.create, createStockItem);
  registerHandler(ipcChannels.stock.update, updateStockItem);
  registerHandler(ipcChannels.stock.delete, deleteStockItem);
}
