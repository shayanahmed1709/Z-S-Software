export const USER_ROLES = ['admin', 'employee', 'salesperson'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ITEM_CATEGORIES = ['Packaging', 'Printing'] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ORDER_STATUSES = [
  'Received',
  'In Printing',
  'Printed',
  'In Packaging',
  'Dispatched',
  'Delivered',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const QUOTATION_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected'] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const INVOICE_STATUSES = ['Unpaid', 'Partially Paid', 'Paid'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const SMTP_SETTING_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_secure',
  'smtp_user',
  'smtp_password',
  'smtp_from',
] as const;
export type SmtpSettingKey = (typeof SMTP_SETTING_KEYS)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type LoginResult =
  | { success: true; user: User }
  | { success: false; message: string };

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  id: number;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface Client {
  id: number;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface ClientInput {
  company_name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface UpdateClientInput extends Partial<ClientInput> {
  id: number;
}

export interface StockItem {
  id: number;
  item_name: string;
  category: ItemCategory;
  sub_category: string | null;
  unit: string;
  qty_in_stock: number;
  reorder_level: number;
  supplier: string | null;
  notes: string | null;
  updated_at: string;
}

export interface StockItemInput {
  item_name: string;
  category: ItemCategory;
  sub_category?: string | null;
  unit: string;
  qty_in_stock?: number | null;
  reorder_level?: number | null;
  supplier?: string | null;
  notes?: string | null;
}

export interface UpdateStockItemInput extends Partial<StockItemInput> {
  id: number;
}

export interface Order {
  id: number;
  order_no: string;
  client_id: number | null;
  description: string | null;
  category: ItemCategory | null;
  qty: number | null;
  unit: string | null;
  unit_rate: number | null;
  total_amount: number | null;
  advance_paid: number | null;
  balance_due: number | null;
  status: OrderStatus | null;
  due_date: string | null;
  assigned_to: number | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderInput {
  order_no: string;
  client_id?: number | null;
  description?: string | null;
  category?: ItemCategory | null;
  qty?: number | null;
  unit?: string | null;
  unit_rate?: number | null;
  total_amount?: number | null;
  advance_paid?: number | null;
  status?: OrderStatus | null;
  due_date?: string | null;
  assigned_to?: number | null;
  notes?: string | null;
  created_by?: number | null;
}

export interface UpdateOrderInput extends Partial<OrderInput> {
  id: number;
}

export interface OrderStatusEvent {
  id: number;
  order_id: number;
  status: string;
  changed_at: string;
}

export interface Quotation {
  id: number;
  quotation_no: string;
  client_id: number | null;
  issued_date: string | null;
  valid_until: string | null;
  validity_days: number | null;
  line_items: string;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  other_charges: number | null;
  grand_total: number | null;
  terms: string | null;
  status: QuotationStatus | null;
  created_by: number | null;
  created_at: string;
}

export interface QuotationInput {
  quotation_no: string;
  client_id?: number | null;
  issued_date?: string | null;
  valid_until?: string | null;
  validity_days?: number | null;
  line_items: string;
  subtotal?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  other_charges?: number | null;
  grand_total?: number | null;
  terms?: string | null;
  status?: QuotationStatus | null;
  created_by?: number | null;
}

export interface UpdateQuotationInput extends Partial<QuotationInput> {
  id: number;
}

export interface Invoice {
  id: number;
  invoice_no: string;
  order_id: number | null;
  client_id: number | null;
  issued_date: string | null;
  due_date: string | null;
  line_items: string;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  other_charges: number | null;
  grand_total: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  payment_terms: string | null;
  status: InvoiceStatus | null;
  created_by: number | null;
  created_at: string;
}

export interface InvoiceInput {
  invoice_no: string;
  order_id?: number | null;
  client_id?: number | null;
  issued_date?: string | null;
  due_date?: string | null;
  line_items: string;
  subtotal?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  other_charges?: number | null;
  grand_total?: number | null;
  amount_paid?: number | null;
  balance_due?: number | null;
  payment_terms?: string | null;
  status?: InvoiceStatus | null;
  created_by?: number | null;
}

export interface UpdateInvoiceInput extends Partial<InvoiceInput> {
  id: number;
}

export interface EmailLog {
  id: number;
  document_type: string | null;
  document_id: number | null;
  recipient_email: string | null;
  subject: string | null;
  status: string | null;
  sent_at: string;
}

export interface EmailLogInput {
  document_type?: string | null;
  document_id?: number | null;
  recipient_email?: string | null;
  subject?: string | null;
  status?: string | null;
}

export interface UpdateEmailLogInput extends EmailLogInput {
  id: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface SettingInput {
  key: string;
  value: string;
}

export interface IpcInvokes {
  'auth:login': { args: [LoginInput]; result: LoginResult };
  'auth:listUsers': { args: []; result: User[] };
  'auth:getUser': { args: [number]; result: User | null };
  'auth:createUser': { args: [CreateUserInput]; result: User };
  'auth:updateUser': { args: [UpdateUserInput]; result: User };
  'auth:deleteUser': { args: [number]; result: void };

  'clients:list': { args: []; result: Client[] };
  'clients:getAll': { args: []; result: Client[] };
  'clients:get': { args: [number]; result: Client | null };
  'clients:create': { args: [ClientInput]; result: Client };
  'clients:update': { args: [UpdateClientInput]; result: Client };
  'clients:delete': { args: [number]; result: void };

  'stock:list': { args: []; result: StockItem[] };
  'stock:get': { args: [number]; result: StockItem | null };
  'stock:create': { args: [StockItemInput]; result: StockItem };
  'stock:update': { args: [UpdateStockItemInput]; result: StockItem };
  'stock:delete': { args: [number]; result: void };

  'orders:list': { args: []; result: Order[] };
  'orders:get': { args: [number]; result: Order | null };
  'orders:create': { args: [OrderInput]; result: Order };
  'orders:update': { args: [UpdateOrderInput]; result: Order };
  'orders:delete': { args: [number]; result: void };
  'orders:history': { args: [number]; result: OrderStatusEvent[] };

  'quotations:list': { args: []; result: Quotation[] };
  'quotations:get': { args: [number]; result: Quotation | null };
  'quotations:create': { args: [QuotationInput]; result: Quotation };
  'quotations:update': { args: [UpdateQuotationInput]; result: Quotation };
  'quotations:delete': { args: [number]; result: void };

  'invoices:list': { args: []; result: Invoice[] };
  'invoices:get': { args: [number]; result: Invoice | null };
  'invoices:create': { args: [InvoiceInput]; result: Invoice };
  'invoices:update': { args: [UpdateInvoiceInput]; result: Invoice };
  'invoices:delete': { args: [number]; result: void };

  'email:list': { args: []; result: EmailLog[] };
  'email:get': { args: [number]; result: EmailLog | null };
  'email:create': { args: [EmailLogInput]; result: EmailLog };
  'email:update': { args: [UpdateEmailLogInput]; result: EmailLog };
  'email:delete': { args: [number]; result: void };

  'settings:list': { args: []; result: Setting[] };
  'settings:get': { args: [string]; result: Setting | null };
  'settings:set': { args: [SettingInput]; result: Setting };
}

export const ipcChannels = {
  auth: {
    login: 'auth:login',
    listUsers: 'auth:listUsers',
    getUser: 'auth:getUser',
    createUser: 'auth:createUser',
    updateUser: 'auth:updateUser',
    deleteUser: 'auth:deleteUser',
  },
  clients: {
    list: 'clients:list',
    getAll: 'clients:getAll',
    get: 'clients:get',
    create: 'clients:create',
    update: 'clients:update',
    delete: 'clients:delete',
  },
  stock: {
    list: 'stock:list',
    get: 'stock:get',
    create: 'stock:create',
    update: 'stock:update',
    delete: 'stock:delete',
  },
  orders: {
    list: 'orders:list',
    get: 'orders:get',
    create: 'orders:create',
    update: 'orders:update',
    delete: 'orders:delete',
    history: 'orders:history',
  },
  quotations: {
    list: 'quotations:list',
    get: 'quotations:get',
    create: 'quotations:create',
    update: 'quotations:update',
    delete: 'quotations:delete',
  },
  invoices: {
    list: 'invoices:list',
    get: 'invoices:get',
    create: 'invoices:create',
    update: 'invoices:update',
    delete: 'invoices:delete',
  },
  email: {
    list: 'email:list',
    get: 'email:get',
    create: 'email:create',
    update: 'email:update',
    delete: 'email:delete',
  },
  settings: {
    list: 'settings:list',
    get: 'settings:get',
    set: 'settings:set',
  },
} as const satisfies {
  [Group in string]: { [Method in string]: keyof IpcInvokes };
};

export interface ZsApi {
  platform: string;
  auth: {
    login(input: LoginInput): Promise<LoginResult>;
    listUsers(): Promise<User[]>;
    getUser(id: number): Promise<User | null>;
    createUser(input: CreateUserInput): Promise<User>;
    updateUser(input: UpdateUserInput): Promise<User>;
    deleteUser(id: number): Promise<void>;
  };
  clients: {
    list(): Promise<Client[]>;
    getAll(): Promise<Client[]>;
    get(id: number): Promise<Client | null>;
    create(input: ClientInput): Promise<Client>;
    update(input: UpdateClientInput): Promise<Client>;
    delete(id: number): Promise<void>;
  };
  stock: {
    list(): Promise<StockItem[]>;
    get(id: number): Promise<StockItem | null>;
    create(input: StockItemInput): Promise<StockItem>;
    update(input: UpdateStockItemInput): Promise<StockItem>;
    delete(id: number): Promise<void>;
  };
  orders: {
    list(): Promise<Order[]>;
    get(id: number): Promise<Order | null>;
    create(input: OrderInput): Promise<Order>;
    update(input: UpdateOrderInput): Promise<Order>;
    delete(id: number): Promise<void>;
    history(id: number): Promise<OrderStatusEvent[]>;
  };
  quotations: {
    list(): Promise<Quotation[]>;
    get(id: number): Promise<Quotation | null>;
    create(input: QuotationInput): Promise<Quotation>;
    update(input: UpdateQuotationInput): Promise<Quotation>;
    delete(id: number): Promise<void>;
  };
  invoices: {
    list(): Promise<Invoice[]>;
    get(id: number): Promise<Invoice | null>;
    create(input: InvoiceInput): Promise<Invoice>;
    update(input: UpdateInvoiceInput): Promise<Invoice>;
    delete(id: number): Promise<void>;
  };
  email: {
    list(): Promise<EmailLog[]>;
    get(id: number): Promise<EmailLog | null>;
    create(input: EmailLogInput): Promise<EmailLog>;
    update(input: UpdateEmailLogInput): Promise<EmailLog>;
    delete(id: number): Promise<void>;
  };
  settings: {
    list(): Promise<Setting[]>;
    get(key: string): Promise<Setting | null>;
    set(input: SettingInput): Promise<Setting>;
  };
}
