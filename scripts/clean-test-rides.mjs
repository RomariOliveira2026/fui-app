import { createConnection } from '../node_modules/mysql2/promise/index.js';
import { config } from 'dotenv';
config();

const conn = await createConnection(process.env.DATABASE_URL);

// Count test rides first
const [countResult] = await conn.execute(
  `SELECT COUNT(*) as count FROM rides WHERE 
   origin_address IN ('Origin', 'Destination', 'My Home', 'My Work', 'Far Location', 'Far Destination', 'Rua X, Itabaiana, SE', 'Rua Y, Itabaiana, SE', 'Praça Central, Itabaiana, SE', 'Terminal Rodoviário, Itabaiana, SE', 'Centro, Itabaiana, SE', 'Bairro Novo, Itabaiana, SE', 'Rua A, Itabaiana, SE', 'Rua B, Itabaiana, SE')
   OR destination_address IN ('Origin', 'Destination', 'My Home', 'My Work', 'Far Location', 'Far Destination', 'Rua X, Itabaiana, SE', 'Rua Y, Itabaiana, SE', 'Praça Central, Itabaiana, SE', 'Terminal Rodoviário, Itabaiana, SE', 'Centro, Itabaiana, SE', 'Bairro Novo, Itabaiana, SE', 'Rua A, Itabaiana, SE', 'Rua B, Itabaiana, SE')
   OR estimated_price < 100`
);
console.log('Test rides to delete:', countResult[0].count);

// Delete test rides
const [deleteResult] = await conn.execute(
  `DELETE FROM rides WHERE 
   origin_address IN ('Origin', 'Destination', 'My Home', 'My Work', 'Far Location', 'Far Destination', 'Rua X, Itabaiana, SE', 'Rua Y, Itabaiana, SE', 'Praça Central, Itabaiana, SE', 'Terminal Rodoviário, Itabaiana, SE', 'Centro, Itabaiana, SE', 'Bairro Novo, Itabaiana, SE', 'Rua A, Itabaiana, SE', 'Rua B, Itabaiana, SE')
   OR destination_address IN ('Origin', 'Destination', 'My Home', 'My Work', 'Far Location', 'Far Destination', 'Rua X, Itabaiana, SE', 'Rua Y, Itabaiana, SE', 'Praça Central, Itabaiana, SE', 'Terminal Rodoviário, Itabaiana, SE', 'Centro, Itabaiana, SE', 'Bairro Novo, Itabaiana, SE', 'Rua A, Itabaiana, SE', 'Rua B, Itabaiana, SE')
   OR estimated_price < 100`
);
console.log('Deleted:', deleteResult.affectedRows, 'test rides');

// Count remaining rides
const [remaining] = await conn.execute('SELECT COUNT(*) as count FROM rides');
console.log('Remaining rides:', remaining[0].count);

await conn.end();
