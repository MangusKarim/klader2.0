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
    const partnerPassword = bcrypt.hashSync('sajjad123', salt);
    const staffPassword = bcrypt.hashSync('tamim123', salt);
    const viewerPassword = bcrypt.hashSync('rahim123', salt);

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
        },
        {
          id: 'usr_2',
          username: 'partner_sajjad',
          password: partnerPassword,
          role: 'partner',
          permissions: { fullAccess: true, salesAccess: true, viewAccess: true },
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr_3',
          username: 'staff_tamim',
          password: staffPassword,
          role: 'staff',
          permissions: { fullAccess: false, salesAccess: true, viewAccess: true },
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr_4',
          username: 'viewer_rahim',
          password: viewerPassword,
          role: 'viewer',
          permissions: { fullAccess: false, salesAccess: false, viewAccess: true },
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
          investmentAmount: 1200000,
          ownershipPercentage: 60,
          totalWithdrawals: 150000,
          remainingBalance: 1050000,
          activityLog: [
            { id: 'act_1', action: 'Initial Investment', amount: 1000000, date: '2026-01-10T10:00:00Z' },
            { id: 'act_2', action: 'Additional Investment', amount: 200000, date: '2026-03-15T11:30:00Z' },
            { id: 'act_3', action: 'Withdrawal', amount: 150000, date: '2026-05-01T14:00:00Z' }
          ],
          notes: 'Main founder and principal investor.'
        },
        {
          id: 'part_2',
          name: 'Sajjad Rahman',
          phone: '01712345678',
          email: 'sajjad@klader.life',
          username: 'partner_sajjad',
          type: 'Investor',
          investmentAmount: 500000,
          ownershipPercentage: 25,
          totalWithdrawals: 50000,
          remainingBalance: 450000,
          activityLog: [
            { id: 'act_4', action: 'Initial Investment', amount: 500000, date: '2026-01-15T12:00:00Z' },
            { id: 'act_5', action: 'Withdrawal', amount: 50000, date: '2026-04-10T09:00:00Z' }
          ],
          notes: 'Active investing partner.'
        },
        {
          id: 'part_3',
          name: 'Karim Alam',
          phone: '01812345678',
          email: 'karim@klader.life',
          username: 'partner_karim',
          type: 'Silent Partner',
          investmentAmount: 300000,
          ownershipPercentage: 15,
          totalWithdrawals: 20000,
          remainingBalance: 280000,
          activityLog: [
            { id: 'act_6', action: 'Initial Investment', amount: 300000, date: '2026-02-01T15:00:00Z' },
            { id: 'act_7', action: 'Withdrawal', amount: 20000, date: '2026-05-20T16:00:00Z' }
          ],
          notes: 'Silent backing partner.'
        }
      ],
      products: [
        {
          id: 'prod_1',
          name: 'Royal Navy Velvet Punjabi',
          sku: 'PNJ-VEL-001',
          category: 'Punjabi',
          color: 'Royal Navy',
          size: 'L',
          buyingPrice: 1800,
          sellingPrice: 3500,
          stockQuantity: 85,
          supplierName: 'Dhaka Fabrics Ltd.',
          dateAdded: '2026-05-10',
          status: 'In Stock'
        },
        {
          id: 'prod_2',
          name: 'Crimson Silk Saree',
          sku: 'SAR-SIL-002',
          category: 'Saree',
          color: 'Crimson Red',
          size: 'Free',
          buyingPrice: 3200,
          sellingPrice: 6800,
          stockQuantity: 40,
          supplierName: 'Rajshahi Silks',
          dateAdded: '2026-05-12',
          status: 'In Stock'
        },
        {
          id: 'prod_3',
          name: 'Summer Cotton Kurti',
          sku: 'KRT-COT-003',
          category: 'Kurti',
          color: 'Peach',
          size: 'M',
          buyingPrice: 700,
          sellingPrice: 1600,
          stockQuantity: 150,
          supplierName: 'Narsingdi Cotton Mills',
          dateAdded: '2026-05-15',
          status: 'In Stock'
        },
        {
          id: 'prod_4',
          name: 'Premium Slate Charcoal Polo',
          sku: 'POL-SLD-004',
          category: 'Polo',
          color: 'Slate Charcoal',
          size: 'XL',
          buyingPrice: 450,
          sellingPrice: 1200,
          stockQuantity: 12, // low stock!
          supplierName: 'Gazipur Knitwear',
          dateAdded: '2026-05-18',
          status: 'In Stock'
        },
        {
          id: 'prod_5',
          name: 'Embroidered Black Sherwani',
          sku: 'SHR-BLK-005',
          category: 'Sherwani',
          color: 'Midnight Black',
          size: 'XL',
          buyingPrice: 8500,
          sellingPrice: 18500,
          stockQuantity: 5,
          supplierName: 'Mirpur Silk Emporium',
          dateAdded: '2026-05-20',
          status: 'In Stock'
        }
      ],
      sales_orders: [
        {
          id: 'ord_1',
          customerName: 'Asif Mahmud',
          customerPhone: '01711122233',
          customerAddress: 'House 42, Road 11, Banani, Dhaka',
          productId: 'prod_1',
          productName: 'Royal Navy Velvet Punjabi',
          color: 'Royal Navy',
          size: 'L',
          quantity: 2,
          sellingPrice: 3500,
          isPrinted: true,
          printSize: 'A4 Back',
          printCost: 350,
          deliveryCharge: 120,
          advancePayment: 2000,
          remainingDue: 5820, // (3500*2) + (350*2) + 120 - 2000 = 7000 + 700 + 120 - 2000 = 5820
          paymentStatus: 'Partial',
          paymentMethod: 'bKash',
          deliveryStatus: 'Delivered',
          profit: 3100, // Revenue = 7700. Cost = (1800*2) + (350*2) = 3600 + 700 = 4300. Profit = 7700 - 4300 - 120(delivery is customer paid, wait, let's treat revenue as item sales + printing. Profit = sellingPrice*qty + printCost*qty - buyingPrice*qty - printCost*qty? Usually profit = (sellingPrice - buyingPrice)*qty. Let's make it standard profit: (sellingPrice - buyingPrice)*qty = (3500-1800)*2 = 3400. Let's keep it simple: Sales Profit = Item Profit.)
          date: '2026-05-15T10:30:00Z'
        },
        {
          id: 'ord_2',
          customerName: 'Nusrat Jahan',
          customerPhone: '01899887766',
          customerAddress: 'Plot 15, Sector 4, Uttara, Dhaka',
          productId: 'prod_2',
          productName: 'Crimson Silk Saree',
          color: 'Crimson Red',
          size: 'Free',
          quantity: 1,
          sellingPrice: 6800,
          isPrinted: false,
          printSize: '',
          printCost: 0,
          deliveryCharge: 120,
          advancePayment: 6920,
          remainingDue: 0,
          paymentStatus: 'Paid',
          paymentMethod: 'Nagad',
          deliveryStatus: 'Delivered',
          profit: 3600, // 6800 - 3200
          date: '2026-05-18T14:20:00Z'
        },
        {
          id: 'ord_3',
          customerName: 'Tanvir Hossain',
          customerPhone: '01912341234',
          customerAddress: 'Wari, Old Dhaka',
          productId: 'prod_4',
          productName: 'Premium Slate Charcoal Polo',
          color: 'Slate Charcoal',
          size: 'XL',
          quantity: 3,
          sellingPrice: 1200,
          isPrinted: false,
          printSize: '',
          printCost: 0,
          deliveryCharge: 80,
          advancePayment: 0,
          remainingDue: 3680,
          paymentStatus: 'Unpaid',
          paymentMethod: 'Cash',
          deliveryStatus: 'Processing',
          profit: 2250, // (1200-450)*3
          date: '2026-05-25T11:00:00Z'
        },
        {
          id: 'ord_4',
          customerName: 'Farhana Yasmin',
          customerPhone: '01555443322',
          customerAddress: 'O.R. Nizam Road, Chittagong',
          productId: 'prod_3',
          productName: 'Summer Cotton Kurti',
          color: 'Peach',
          size: 'M',
          quantity: 5,
          sellingPrice: 1600,
          isPrinted: true,
          printSize: 'Chest pocket',
          printCost: 150,
          deliveryCharge: 150,
          advancePayment: 4000,
          remainingDue: 4900, // (1600*5)+(150*5)+150 - 4000 = 8000+750+150-4000 = 4900
          paymentStatus: 'Partial',
          paymentMethod: 'Rocket',
          deliveryStatus: 'Shipped',
          profit: 4500, // (1600-700)*5
          date: '2026-05-26T16:45:00Z'
        }
      ],
      expenses: [
        {
          id: 'exp_1',
          category: 'Online Boosting',
          amount: 15000,
          description: 'Facebook & Instagram Eid campaign ads',
          date: '2026-05-05',
          paymentRecord: 'bKash Merchant Payment'
        },
        {
          id: 'exp_2',
          category: 'Packaging',
          amount: 8500,
          description: 'Premium magnetic gift boxes (100 pcs)',
          date: '2026-05-08',
          paymentRecord: 'Cash'
        },
        {
          id: 'exp_3',
          category: 'Transport',
          amount: 6200,
          description: 'Carton shipping from Gazipur factory to hub',
          date: '2026-05-12',
          paymentRecord: 'Bank Transfer'
        },
        {
          id: 'exp_4',
          category: 'Salary',
          amount: 25000,
          description: 'May Salary for Sales Manager Tamim',
          date: '2026-05-25',
          paymentRecord: 'Bank Transfer'
        },
        {
          id: 'exp_5',
          category: 'Utilities',
          amount: 4000,
          description: 'Office electricity & internet bill',
          date: '2026-05-26',
          paymentRecord: 'Nagad'
        }
      ],
      requests: [
        {
          id: 'req_1',
          partnerId: 'part_2',
          partnerName: 'Sajjad Rahman',
          type: 'Withdrawal',
          amount: 30000,
          status: 'Pending',
          notes: 'Emergency business cash withdrawal request.',
          createdAt: '2026-05-26T12:00:00Z',
          approvedBy: '',
          approvedAt: ''
        },
        {
          id: 'req_2',
          partnerId: 'part_3',
          partnerName: 'Karim Alam',
          type: 'Investment',
          amount: 100000,
          status: 'Approved',
          notes: 'Additional funding to expand winter collection stock.',
          createdAt: '2026-05-20T10:00:00Z',
          approvedBy: 'Zadid',
          approvedAt: '2026-05-21T11:00:00Z'
        }
      ],
      activity_logs: [
        {
          id: 'log_1',
          username: 'Zadid',
          role: 'admin',
          action: 'System Initialized',
          details: 'Default seed data successfully populated',
          timestamp: '2026-05-27T15:00:00Z',
          deviceInfo: 'Chrome / Windows 11'
        }
      ],
      settings: {
        companyName: 'Klader',
        currency: 'BDT',
        lastBackup: '2026-05-27T15:00:00Z'
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
      const partnerPassword = bcrypt.hashSync('sajjad123', salt);
      const staffPassword = bcrypt.hashSync('tamim123', salt);
      const viewerPassword = bcrypt.hashSync('rahim123', salt);

      // Seed Users
      await client.query(`
        INSERT INTO users (id, username, password, role, permissions, status)
        VALUES 
        ('usr_1', 'Zadid', $1, 'admin', '{"fullAccess": true, "salesAccess": true, "viewAccess": true}'::jsonb, 'active'),
        ('usr_2', 'partner_sajjad', $2, 'partner', '{"fullAccess": true, "salesAccess": true, "viewAccess": true}'::jsonb, 'active'),
        ('usr_3', 'staff_tamim', $3, 'staff', '{"fullAccess": false, "salesAccess": true, "viewAccess": true}'::jsonb, 'active'),
        ('usr_4', 'viewer_rahim', $4, 'viewer', '{"fullAccess": false, "salesAccess": false, "viewAccess": true}'::jsonb, 'active')
      `, [defaultAdminPassword, partnerPassword, staffPassword, viewerPassword]);

      // Seed Partners
      await client.query(`
        INSERT INTO partners (id, name, phone, email, username, type, investment_amount, ownership_percentage, total_withdrawals, remaining_balance, activity_log, notes)
        VALUES 
        ('part_1', 'Zadid', '01912345678', 'zadid@klader.life', 'Zadid', 'Investor', 1200000, 60, 150000, 1050000, '[{"id": "act_1", "action": "Initial Investment", "amount": 1000000, "date": "2026-01-10T10:00:00Z"}, {"id": "act_2", "action": "Additional Investment", "amount": 200000, "date": "2026-03-15T11:30:00Z"}, {"id": "act_3", "action": "Withdrawal", "amount": 150000, "date": "2026-05-01T14:00:00Z"}]'::jsonb, 'Main founder and principal investor.'),
        ('part_2', 'Sajjad Rahman', '01712345678', 'sajjad@klader.life', 'partner_sajjad', 'Investor', 500000, 25, 50000, 450000, '[{"id": "act_4", "action": "Initial Investment", "amount": 500000, "date": "2026-01-15T12:00:00Z"}, {"id": "act_5", "action": "Withdrawal", "amount": 50000, "date": "2026-04-10T09:00:00Z"}]'::jsonb, 'Active investing partner.'),
        ('part_3', 'Karim Alam', '01812345678', 'karim@klader.life', 'partner_karim', 'Silent Partner', 300000, 15, 20000, 280000, '[{"id": "act_6", "action": "Initial Investment", "amount": 300000, "date": "2026-02-01T15:00:00Z"}, {"id": "act_7", "action": "Withdrawal", "amount": 20000, "date": "2026-05-20T16:00:00Z"}]'::jsonb, 'Silent backing partner.')
      `);

      // Seed Products
      await client.query(`
        INSERT INTO products (id, name, sku, category, color, size, buying_price, selling_price, stock_quantity, supplier_name, date_added, status)
        VALUES 
        ('prod_1', 'Royal Navy Velvet Punjabi', 'PNJ-VEL-001', 'Punjabi', 'Royal Navy', 'L', 1800, 3500, 85, 'Dhaka Fabrics Ltd.', '2026-05-10', 'In Stock'),
        ('prod_2', 'Crimson Silk Saree', 'SAR-SIL-002', 'Saree', 'Crimson Red', 'Free', 3200, 6800, 40, 'Rajshahi Silks', '2026-05-12', 'In Stock'),
        ('prod_3', 'Summer Cotton Kurti', 'KRT-COT-003', 'Kurti', 'Peach', 'M', 700, 1600, 150, 'Narsingdi Cotton Mills', '2026-05-15', 'In Stock'),
        ('prod_4', 'Premium Slate Charcoal Polo', 'POL-SLD-004', 'Polo', 'Slate Charcoal', 'XL', 450, 1200, 12, 'Gazipur Knitwear', '2026-05-18', 'In Stock'),
        ('prod_5', 'Embroidered Black Sherwani', 'SHR-BLK-005', 'Sherwani', 'Midnight Black', 'XL', 8500, 18500, 5, 'Mirpur Silk Emporium', '2026-05-20', 'In Stock')
      `);

      // Seed Sales Orders
      await client.query(`
        INSERT INTO sales_orders (id, customer_name, customer_phone, customer_address, product_id, product_name, color, size, quantity, selling_price, is_printed, print_size, print_cost, delivery_charge, advance_payment, remaining_due, payment_status, payment_method, delivery_status, profit, date)
        VALUES 
        ('ord_1', 'Asif Mahmud', '01711122233', 'House 42, Road 11, Banani, Dhaka', 'prod_1', 'Royal Navy Velvet Punjabi', 'Royal Navy', 'L', 2, 3500, TRUE, 'A4 Back', 350, 120, 2000, 5820, 'Partial', 'bKash', 'Delivered', 3400, '2026-05-15T10:30:00Z'),
        ('ord_2', 'Nusrat Jahan', '01899887766', 'Plot 15, Sector 4, Uttara, Dhaka', 'prod_2', 'Crimson Silk Saree', 'Crimson Red', 'Free', 1, 6800, FALSE, '', 0, 120, 6920, 0, 'Paid', 'Nagad', 'Delivered', 3600, '2026-05-18T14:20:00Z'),
        ('ord_3', 'Tanvir Hossain', '01912341234', 'Wari, Old Dhaka', 'prod_4', 'Premium Slate Charcoal Polo', 'Slate Charcoal', 'XL', 3, 1200, FALSE, '', 0, 80, 0, 3680, 'Unpaid', 'Cash', 'Processing', 2250, '2026-05-25T11:00:00Z'),
        ('ord_4', 'Farhana Yasmin', '01555443322', 'O.R. Nizam Road, Chittagong', 'prod_3', 'Summer Cotton Kurti', 'Peach', 'M', 5, 1600, TRUE, 'Chest pocket', 150, 150, 4000, 4900, 'Partial', 'Rocket', 'Shipped', 4500, '2026-05-26T16:45:00Z')
      `);

      // Seed Expenses
      await client.query(`
        INSERT INTO expenses (id, category, amount, description, date, payment_record)
        VALUES 
        ('exp_1', 'Online Boosting', 15000, 'Facebook & Instagram Eid campaign ads', '2026-05-05', 'bKash Merchant Payment'),
        ('exp_2', 'Packaging', 8500, 'Premium magnetic gift boxes (100 pcs)', '2026-05-08', 'Cash'),
        ('exp_3', 'Transport', 6200, 'Carton shipping from Gazipur factory to hub', '2026-05-12', 'Bank Transfer'),
        ('exp_4', 'Salary', 25000, 'May Salary for Sales Manager Tamim', '2026-05-25', 'Bank Transfer'),
        ('exp_5', 'Utilities', 4000, 'Office electricity & internet bill', '2026-05-26', 'Nagad')
      `);

      // Seed Requests
      await client.query(`
        INSERT INTO requests (id, partner_id, partner_name, type, amount, status, notes, created_at, approved_by, approved_at)
        VALUES 
        ('req_1', 'part_2', 'Sajjad Rahman', 'Withdrawal', 30000, 'Pending', 'Emergency business cash withdrawal request.', '2026-05-26T12:00:00Z', NULL, NULL),
        ('req_2', 'part_3', 'Karim Alam', 'Investment', 100000, 'Approved', 'Additional funding to expand winter collection stock.', '2026-05-20T10:00:00Z', 'Zadid', '2026-05-21T11:00:00Z')
      `);

      // Seed Logs
      await client.query(`
        INSERT INTO activity_logs (id, username, role, action, details, timestamp, device_info)
        VALUES ('log_1', 'Zadid', 'admin', 'System Initialized', 'Postgres seed data populated', CURRENT_TIMESTAMP, 'Chrome / Windows 11')
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
    // This is handled per operation, but we also save to JSON as dual-write backup
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
