import bcrypt from 'bcryptjs';
import {
  USER_ROLES,
  ipcChannels,
  type CreateUserInput,
  type LoginInput,
  type LoginResult,
  type UpdateUserInput,
  type User,
  type UserRole,
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

const USER_COLUMNS = ['name', 'email', 'password_hash', 'role'] as const;
const USER_FIELDS = 'id, name, email, role, created_at';

interface UserRow extends User {
  password_hash: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };
}

export function login(input: LoginInput): LoginResult {
  try {
    const email = requiredText(input?.email, 'Email');
    const password = requiredText(input?.password, 'Password');
    const row = readOne<UserRow>(
      `SELECT ${USER_FIELDS}, password_hash FROM users WHERE email = ?`,
      email,
    );

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return { success: false, message: 'Invalid email or password' };
    }

    return { success: true, user: toUser(row) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in';
    return { success: false, message };
  }
}

export function listUsers(): User[] {
  return readAll<User>(`SELECT ${USER_FIELDS} FROM users ORDER BY id ASC`);
}

export function getUser(id: number): User | null {
  return readOne<User>(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, requiredId(id));
}

export function createUser(input: CreateUserInput): User {
  const password = requiredText(input?.password, 'Password');
  return insertAndReturn<User>(
    'users',
    USER_COLUMNS,
    {
      name: requiredText(input?.name, 'Name'),
      email: requiredText(input?.email, 'Email'),
      password_hash: bcrypt.hashSync(password, 10),
      role: assertEnum<UserRole>(input?.role, USER_ROLES, 'Role'),
    },
    USER_FIELDS,
  );
}

export function updateUser(input: UpdateUserInput): User {
  const id = requiredId(input?.id);
  const patch: Record<string, unknown> = {};

  if (input.name !== undefined) {
    patch.name = requiredText(input.name, 'Name');
  }
  if (input.email !== undefined) {
    patch.email = requiredText(input.email, 'Email');
  }
  if (input.role !== undefined) {
    patch.role = assertEnum<UserRole>(input.role, USER_ROLES, 'Role');
  }
  if (input.password !== undefined) {
    patch.password_hash = bcrypt.hashSync(requiredText(input.password, 'Password'), 10);
  }

  return updateAndReturn<User>('users', USER_COLUMNS, id, patch, USER_FIELDS);
}

export function deleteUser(id: number): void {
  deleteById('users', requiredId(id), 'User');
}

export function registerAuthHandlers(): void {
  registerHandler(ipcChannels.auth.login, login);
  registerHandler(ipcChannels.auth.listUsers, listUsers);
  registerHandler(ipcChannels.auth.getUser, getUser);
  registerHandler(ipcChannels.auth.createUser, createUser);
  registerHandler(ipcChannels.auth.updateUser, updateUser);
  registerHandler(ipcChannels.auth.deleteUser, deleteUser);
}
