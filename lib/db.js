import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Configuration
const dbFolder = path.join(process.cwd(), 'data');
const dbFile = path.join(dbFolder, 'db.json');
const isPostgres = !!process.env.DATABASE_URL;

let pool = null;
if (isPostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for hosting platforms like Hostinger/Supabase
  });
}

// Ensure local JSON DB directory and file exist with seed data
function ensureJsonDb() {
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }

  if (!fs.existsSync(dbFile)) {
    const salt = bcrypt.genSaltSync(10);
    const defaultAdminPassword = bcrypt.hashSync('Zadu00789', salt);

    const initialData = {
      users: [
        {
          id: 'usr_1',
          username: 'Zadid',
          password: defaultAdminPassword,
          role: 'admin',
          permissions: { fullAccess: true, salesAccess: true, viewAccess: true },
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      partners: [
        {
          id: 'part_1',
          name: 'Zadid',
          phone: '01912345678',
          email: 'zadid@klader.life',
          username: 'Zadid',
          type: 'Investor',
          investmentAmount: 0,
          ownershipPercentage: 100,
          totalWithdrawals: 0,
          remainingBalance: 0,
          activityLog: [],
          notes: 'Main Admin Profile.'
        }
      ],
      products: [],
      sales_orders: [],
      expenses: [],
      requests: [],
      activity_logs: [
        {
          id: 'log_1',
          username: 'System',
          role: 'admin',
          action: 'System Initialized',
          details: 'Fresh production install setup ready.',
          timestamp: new Date().toISOString(),
          deviceInfo: 'System'
        }
      ],
      settings: {
        companyName: 'Klader',
        currency: 'BDT',
        lastBackup: new Date().toISOString()
      }
    };

    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// Initialize tables if PostgreSQL is used
async function initializePostgresDb() {
  if (!isPostgres) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        permissions JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        investment_amount NUMERIC DEFAULT 0,
        ownership_percentage NUMERIC DEFAULT 0,
        total_withdrawals NUMERIC DEFAULT 0,
        remaining_balance NUMERIC DEFAULT 0,
        activity_log JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        color VARCHAR(50),
        size VARCHAR(20),
        buying_price NUMERIC DEFAULT 0,
        selling_price NUMERIC DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        supplier_name VARCHAR(100),
        date_added VARCHAR(50),
        status VARCHAR(50) DEFAULT 'In Stock'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address TEXT,
        product_id VARCHAR(50),
        product_name VARCHAR(100) NOT NULL,
        color VARCHAR(50),
        size VARCHAR(20),
        quantity INTEGER DEFAULT 1,
        selling_price NUMERIC DEFAULT 0,
        is_printed BOOLEAN DEFAULT FALSE,
        print_size VARCHAR(50),
        print_cost NUMERIC DEFAULT 0,
        delivery_charge NUMERIC DEFAULT 0,
        advance_payment NUMERIC DEFAULT 0,
        remaining_due NUMERIC DEFAULT 0,
        payment_status VARCHAR(50) DEFAULT 'Unpaid',
        payment_method VARCHAR(50) DEFAULT 'Cash',
        delivery_status VARCHAR(50) DEFAULT 'Pending',
        profit NUMERIC DEFAULT 0,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        amount NUMERIC DEFAULT 0,
        description TEXT,
        date VARCHAR(50),
        payment_record TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id VARCHAR(50) PRIMARY KEY,
        partner_id VARCHAR(50) NOT NULL,
        partner_name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount NUMERIC DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        approved_by VARCHAR(100),
        approved_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        device_info VARCHAR(255)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(100) DEFAULT 'Klader',
        currency VARCHAR(20) DEFAULT 'BDT',
        last_backup TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if default admin exists
    const adminCheck = await client.query("SELECT * FROM users WHERE username = 'Zadid'");
    if (adminCheck.rows.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const defaultAdminPassword = bcrypt.hashSync('Zadu00789', salt);

      // Seed Admin User
      await client.query(`
        INSERT INTO users (id, username, password, role, permissions, status)
        VALUES ('usr_1', 'Zadid', $1, 'admin', '{"fullAccess": true, "salesAccess": true, "viewAccess": true}'::jsonb, 'active')
      `, [defaultAdminPassword]);

      // Seed Admin Partner profile
      await client.query(`
        INSERT INTO partners (id, name, phone, email, username, type, investment_amount, ownership_percentage, total_withdrawals, remaining_balance, activity_log, notes)
        VALUES ('part_1', 'Zadid', '01912345678', 'zadid@klader.life', 'Zadid', 'Investor', 0, 100, 0, 0, '[]'::jsonb, 'Main Admin Profile.')
      `);

      // Seed Logs
      await client.query(`
        INSERT INTO activity_logs (id, username, role, action, details, timestamp, device_info)
        VALUES ('log_1', 'System', 'admin', 'System Initialized', 'Postgres fresh setup ready', CURRENT_TIMESTAMP, 'System')
      `);

      // Seed Settings
      await client.query(`
        INSERT INTO settings (company_name, currency) VALUES ('Klader', 'BDT')
      `);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Postgres seeding failed:', error);
  } finally {
    client.release();
  }
}

// Initial triggers
ensureJsonDb();
initializePostgresDb().catch(err => console.error('Database connection failed:', err));

// Helpers to get data dynamically from Postgres or JSON File
export async function getDbData() {
  if (isPostgres) {
    try {
      const users = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      const partners = await pool.query('SELECT * FROM partners ORDER BY name ASC');
      const products = await pool.query('SELECT * FROM products ORDER BY name ASC');
      const sales_orders = await pool.query('SELECT * FROM sales_orders ORDER BY date DESC');
      const expenses = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
      const requests = await pool.query('SELECT * FROM requests ORDER BY created_at DESC');
      const activity_logs = await pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC');
      const settingsResult = await pool.query('SELECT * FROM settings LIMIT 1');

      // Map snake_case database schema to camelCase matching the app code logic
      const mapUser = u => ({
        id: u.id,
        username: u.username,
        password: u.password,
        role: u.role,
        permissions: u.permissions,
        status: u.status,
        createdAt: u.created_at
      });

      const mapPartner = p => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        username: p.username,
        type: p.type,
        investmentAmount: parseFloat(p.investment_amount),
        ownershipPercentage: parseFloat(p.ownership_percentage),
        totalWithdrawals: parseFloat(p.total_withdrawals),
        remainingBalance: parseFloat(p.remaining_balance),
        activityLog: p.activity_log || [],
        notes: p.notes
      });

      const mapProduct = pr => ({
        id: pr.id,
        name: pr.name,
        sku: pr.sku,
        category: pr.category,
        color: pr.color,
        size: pr.size,
        buyingPrice: parseFloat(pr.buying_price),
        sellingPrice: parseFloat(pr.selling_price),
        stockQuantity: pr.stock_quantity,
        supplierName: pr.supplier_name,
        dateAdded: pr.date_added,
        status: pr.status
      });

      const mapSale = s => ({
        id: s.id,
        customerName: s.customer_name,
        customerPhone: s.customer_phone,
        customerAddress: s.customer_address,
        productId: s.product_id,
        productName: s.product_name,
        color: s.color,
        size: s.size,
        quantity: s.quantity,
        sellingPrice: parseFloat(s.selling_price),
        isPrinted: s.is_printed,
        printSize: s.print_size || '',
        printCost: parseFloat(s.print_cost || 0),
        deliveryCharge: parseFloat(s.delivery_charge || 0),
        advancePayment: parseFloat(s.advance_payment || 0),
        remainingDue: parseFloat(s.remaining_due || 0),
        paymentStatus: s.payment_status,
        paymentMethod: s.payment_method,
        deliveryStatus: s.delivery_status,
        profit: parseFloat(s.profit || 0),
        date: s.date
      });

      const mapRequest = r => ({
        id: r.id,
        partnerId: r.partner_id,
        partnerName: r.partner_name,
        type: r.type,
        amount: parseFloat(r.amount),
        status: r.status,
        notes: r.notes,
        createdAt: r.created_at,
        approvedBy: r.approved_by,
        approvedAt: r.approved_at
      });

      const mapExpense = e => ({
        id: e.id,
        category: e.category,
        amount: parseFloat(e.amount),
        description: e.description,
        date: e.date,
        paymentRecord: e.payment_record
      });

      const mapLog = l => ({
        id: l.id,
        username: l.username,
        role: l.role,
        action: l.action,
        details: l.details,
        timestamp: l.timestamp,
        deviceInfo: l.device_info
      });

      return {
        users: users.rows.map(mapUser),
        partners: partners.rows.map(mapPartner),
        products: products.rows.map(mapProduct),
        sales_orders: sales_orders.rows.map(mapSale),
        expenses: expenses.rows.map(mapExpense),
        requests: requests.rows.map(mapRequest),
        activity_logs: activity_logs.rows.map(mapLog),
        settings: settingsResult.rows[0] ? {
          companyName: settingsResult.rows[0].company_name,
          currency: settingsResult.rows[0].currency,
          lastBackup: settingsResult.rows[0].last_backup
        } : { companyName: 'Klader', currency: 'BDT', lastBackup: new Date().toISOString() }
      };
    } catch (error) {
      console.error('Failed to read from PostgreSQL, falling back to JSON db file:', error);
    }
  }

  // File fallback
  ensureJsonDb();
  const fileData = fs.readFileSync(dbFile, 'utf8');
  return JSON.parse(fileData);
}

export async function writeDbData(data) {
  if (isPostgres) {
    try {
      ensureJsonDb();
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error updating backup JSON db:', e);
    }
  }

  ensureJsonDb();
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
  return true;
}

// API methods to update specific PostgreSQL tables dynamically
export async function dbInsert(table, dataObject) {
  if (!isPostgres) {
    const data = await getDbData();
    data[table].push(dataObject);
    await writeDbData(data);
    return dataObject;
  }

  const keys = Object.keys(dataObject);
  const snakeKeys = keys.map(k => k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
  const values = Object.values(dataObject);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
    INSERT INTO ${table === 'sales_orders' ? 'sales_orders' : table} (${snakeKeys.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  await pool.query(query, values);
  return dataObject;
}

export async function dbUpdate(table, id, dataObject) {
  if (!isPostgres) {
    const data = await getDbData();
    const index = data[table].findIndex(item => item.id === id);
    if (index !== -1) {
      data[table][index] = { ...data[table][index], ...dataObject };
      await writeDbData(data);
      return data[table][index];
    }
    return null;
  }

  const keys = Object.keys(dataObject);
  const setClauses = keys.map((k, i) => `${k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = $${i + 2}`).join(', ');
  const values = Object.values(dataObject);

  const query = `
    UPDATE ${table === 'sales_orders' ? 'sales_orders' : table}
    SET ${setClauses}
    WHERE id = $1
    RETURNING *
  `;

  const res = await pool.query(query, [id, ...values]);
  return res.rows[0];
}

export async function dbDelete(table, id) {
  if (!isPostgres) {
    const data = await getDbData();
    const index = data[table].findIndex(item => item.id === id);
    if (index !== -1) {
      data[table].splice(index, 1);
      await writeDbData(data);
      return true;
    }
    return false;
  }

  const query = `DELETE FROM ${table === 'sales_orders' ? 'sales_orders' : table} WHERE id = $1`;
  const res = await pool.query(query, [id]);
  return res.rowCount > 0;
}
