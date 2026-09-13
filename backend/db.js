const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.resolve(__dirname, "garage.db");
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function initDb() {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        birth_date TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        national_id TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        plate_number TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_id INTEGER,
        customer_id INTEGER,
        issue_description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        estimated_cost REAL DEFAULT 0,
        actual_cost REAL DEFAULT 0,
        mechanic_name TEXT,
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        category TEXT,
        unit_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        service_id INTEGER,
        total_amount REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        final_amount REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'unpaid',
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER,
        part_id INTEGER,
        description TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total_price REAL DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
        FOREIGN KEY (part_id) REFERENCES parts (id) ON DELETE SET NULL
      )
    `);

    await seedDb();
  } catch (err) {
    console.error("Database Init Error:", err);
  }
}

async function seedDb() {
  const userCount = await get("SELECT COUNT(*) as count FROM users");
  if (userCount.count === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await run(
      `INSERT INTO users (username, password, phone, email, birth_date, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "admin",
        hashedPassword,
        "09123456789",
        "admin@garage.com",
        "1370/01/01",
        "admin",
      ],
    );
  }

  const customerCount = await get("SELECT COUNT(*) as count FROM customers");
  if (customerCount.count === 0) {
    const resCust = await run(
      `INSERT INTO customers (full_name, phone, email, national_id, address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        "علی محمدی",
        "09121112233",
        "ali@example.com",
        "0012345678",
        "تهران، خیابان آزادی",
      ],
    );

    const resCar = await run(
      `INSERT INTO cars (customer_id, plate_number, brand, model, year, color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resCust.id, "12-الف-345", "پژو", "206", 1398, "سفید"],
    );

    const resService = await run(
      `INSERT INTO services (car_id, customer_id, issue_description, status, estimated_cost, actual_cost, mechanic_name, start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resCar.id,
        resCust.id,
        "تعویض روغن و فیلترها، تنظیم موتور",
        "in_progress",
        1500000,
        1400000,
        "استاد رضا",
        "1403/01/10",
      ],
    );

    const resPart1 = await run(
      `INSERT INTO parts (name, code, category, unit_price, stock_quantity, min_stock)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["روغن موتور 4 لیتری", "P-101", "روغن و سیالات", 600000, 25, 5],
    );

    const resPart2 = await run(
      `INSERT INTO parts (name, code, category, unit_price, stock_quantity, min_stock)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["فیلتر روغن پژو 206", "P-102", "فیلترها", 150000, 40, 10],
    );

    const resInv = await run(
      `INSERT INTO invoices (customer_id, service_id, total_amount, discount, tax, final_amount, payment_status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resCust.id,
        resService.id,
        1400000,
        50000,
        121500,
        1471500,
        "paid",
        "کارتخوان",
      ],
    );

    await run(
      `INSERT INTO invoice_items (invoice_id, part_id, description, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resInv.id, resPart1.id, "روغن موتور 4 لیتری", 1, 600000, 600000],
    );

    await run(
      `INSERT INTO invoice_items (invoice_id, part_id, description, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resInv.id, resPart2.id, "فیلتر روغن", 1, 150000, 150000],
    );
  }
}

initDb();

module.exports = {
  db,
  run,
  get,
  all,
};
