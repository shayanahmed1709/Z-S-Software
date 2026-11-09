import { contextBridge, ipcRenderer } from 'electron';
import {
  ipcChannels,
  type IpcInvokes,
  type ZsApi,
} from '../shared/types';

function invoke<C extends keyof IpcInvokes>(
  channel: C,
  ...args: IpcInvokes[C]['args']
): Promise<IpcInvokes[C]['result']> {
  return ipcRenderer.invoke(channel, ...args);
}

const api = {
  platform: process.platform,
  auth: {
    login: (input) => invoke(ipcChannels.auth.login, input),
    listUsers: () => invoke(ipcChannels.auth.listUsers),
    getUser: (id) => invoke(ipcChannels.auth.getUser, id),
    createUser: (input) => invoke(ipcChannels.auth.createUser, input),
    updateUser: (input) => invoke(ipcChannels.auth.updateUser, input),
    deleteUser: (id) => invoke(ipcChannels.auth.deleteUser, id),
  },
  clients: {
    list: () => invoke(ipcChannels.clients.list),
    getAll: () => invoke(ipcChannels.clients.getAll),
    get: (id) => invoke(ipcChannels.clients.get, id),
    create: (input) => invoke(ipcChannels.clients.create, input),
    update: (input) => invoke(ipcChannels.clients.update, input),
    delete: (id) => invoke(ipcChannels.clients.delete, id),
  },
  stock: {
    list: () => invoke(ipcChannels.stock.list),
    get: (id) => invoke(ipcChannels.stock.get, id),
    create: (input) => invoke(ipcChannels.stock.create, input),
    update: (input) => invoke(ipcChannels.stock.update, input),
    delete: (id) => invoke(ipcChannels.stock.delete, id),
  },
  orders: {
    list: () => invoke(ipcChannels.orders.list),
    get: (id) => invoke(ipcChannels.orders.get, id),
    create: (input) => invoke(ipcChannels.orders.create, input),
    update: (input) => invoke(ipcChannels.orders.update, input),
    delete: (id) => invoke(ipcChannels.orders.delete, id),
    history: (id) => invoke(ipcChannels.orders.history, id),
  },
  quotations: {
    list: () => invoke(ipcChannels.quotations.list),
    get: (id) => invoke(ipcChannels.quotations.get, id),
    create: (input) => invoke(ipcChannels.quotations.create, input),
    update: (input) => invoke(ipcChannels.quotations.update, input),
    delete: (id) => invoke(ipcChannels.quotations.delete, id),
  },
  invoices: {
    list: () => invoke(ipcChannels.invoices.list),
    get: (id) => invoke(ipcChannels.invoices.get, id),
    create: (input) => invoke(ipcChannels.invoices.create, input),
    update: (input) => invoke(ipcChannels.invoices.update, input),
    delete: (id) => invoke(ipcChannels.invoices.delete, id),
  },
  email: {
    list: () => invoke(ipcChannels.email.list),
    get: (id) => invoke(ipcChannels.email.get, id),
    create: (input) => invoke(ipcChannels.email.create, input),
    update: (input) => invoke(ipcChannels.email.update, input),
    delete: (id) => invoke(ipcChannels.email.delete, id),
  },
  settings: {
    list: () => invoke(ipcChannels.settings.list),
    get: (key) => invoke(ipcChannels.settings.get, key),
    set: (input) => invoke(ipcChannels.settings.set, input),
  },
} satisfies ZsApi;

contextBridge.exposeInMainWorld('zs', api);
