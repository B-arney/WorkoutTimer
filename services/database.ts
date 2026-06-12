import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'local_db.db';

export const getDatabase = async () => {
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
};

export const initializeDatabase = async () => {
  const db = await getDatabase();
  
  // Example initialization
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    );
  `);
  
  console.log('Database initialized');
};
