import pg from 'pg'
const { Pool } = pg;

import dotenv from 'dotenv'
dotenv.config()

export const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: parseInt(process.env.DB_PORT),
});
