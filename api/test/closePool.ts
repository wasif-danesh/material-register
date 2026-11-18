import { afterAll } from 'vitest';
import { pool } from '../src/db/client.ts';

afterAll(() => pool.end());
