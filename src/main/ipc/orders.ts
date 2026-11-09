import {
  ITEM_CATEGORIES,
  ORDER_STATUSES,
  ipcChannels,
  type ItemCategory,
  type Order,
  type OrderInput,
  type OrderStatus,
  type OrderStatusEvent,
  type UpdateOrderInput,
} from '../../shared/types';
import { getDatabase } from '../database';
import {
  assertEnum,
  insertAndReturn,
  readAll,
  readOne,
  registerHandler,
  requiredId,
  requiredText,
  updateAndReturn,
} from './util';

const ORDER_COLUMNS = [
  'order_no',
  'client_id',
  'description',
  'category',
  'qty',
  'unit',
  'unit_rate',
  'total_amount',
  'advance_paid',
  'status',
  'due_date',
  'assigned_to',
  'notes',
  'created_by',
] as const;

function orderValues(input: OrderInput | UpdateOrderInput): Record<string, unknown> {
  const values: Record<string, unknown> = { ...(input ?? {}) };
  delete values.id;
  if ('order_no' in input && input.order_no !== undefined) {
    values.order_no = requiredText(input.order_no, 'Order number');
  }
  if (input.category != null) {
    values.category = assertEnum<ItemCategory>(input.category, ITEM_CATEGORIES, 'Category');
  }
  if (input.status != null) {
    values.status = assertEnum<OrderStatus>(input.status, ORDER_STATUSES, 'Status');
  }
  return values;
}

export function listOrders(): Order[] {
  return readAll<Order>('SELECT * FROM orders ORDER BY id DESC');
}

export function getOrder(id: number): Order | null {
  return readOne<Order>('SELECT * FROM orders WHERE id = ?', requiredId(id));
}

function recordStatus(orderId: number, status: string): void {
  getDatabase()
    .prepare('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)')
    .run(orderId, status);
}

export function listOrderHistory(orderId: number): OrderStatusEvent[] {
  return readAll<OrderStatusEvent>(
    'SELECT id, order_id, status, changed_at FROM order_status_history WHERE order_id = ? ORDER BY id ASC',
    requiredId(orderId),
  );
}

export function createOrder(input: OrderInput): Order {
  const order = insertAndReturn<Order>(
    'orders',
    ORDER_COLUMNS,
    orderValues({
      ...input,
      order_no: requiredText(input?.order_no, 'Order number'),
    }),
    '*',
  );
  recordStatus(order.id, order.status ?? 'Received');
  return order;
}

export function updateOrder(input: UpdateOrderInput): Order {
  const id = requiredId(input?.id);
  const existing = getOrder(id);
  const order = updateAndReturn<Order>('orders', ORDER_COLUMNS, id, orderValues(input), '*', {
    touchUpdatedAt: true,
  });
  if (input.status && input.status !== existing?.status) {
    recordStatus(order.id, input.status);
  }
  return order;
}

export function deleteOrder(id: number): void {
  const orderId = requiredId(id);
  const database = getDatabase();
  const remove = database.transaction(() => {
    database.prepare('DELETE FROM order_status_history WHERE order_id = ?').run(orderId);
    const result = database.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
    if (result.changes === 0) {
      throw new Error('Order not found');
    }
  });
  remove();
}

export function registerOrderHandlers(): void {
  registerHandler(ipcChannels.orders.list, listOrders);
  registerHandler(ipcChannels.orders.get, getOrder);
  registerHandler(ipcChannels.orders.create, createOrder);
  registerHandler(ipcChannels.orders.update, updateOrder);
  registerHandler(ipcChannels.orders.delete, deleteOrder);
  registerHandler(ipcChannels.orders.history, listOrderHistory);
}
