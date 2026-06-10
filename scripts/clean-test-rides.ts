import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { rides } from "../drizzle/schema";
import { or, lt, inArray } from "drizzle-orm";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn);

  const testAddresses = [
    'Origin', 'Destination', 'My Home', 'My Work', 'Far Location', 'Far Destination',
    'Rua X, Itabaiana, SE', 'Rua Y, Itabaiana, SE', 'Praça Central, Itabaiana, SE',
    'Terminal Rodoviário, Itabaiana, SE', 'Centro, Itabaiana, SE', 'Bairro Novo, Itabaiana, SE',
    'Rua A, Itabaiana, SE', 'Rua B, Itabaiana, SE'
  ];

  // Count first
  const allRides = await db.select().from(rides);
  console.log('Total rides before cleanup:', allRides.length);
  
  const testRides = allRides.filter(r => 
    testAddresses.includes(r.originAddress) || 
    testAddresses.includes(r.destinationAddress) ||
    r.estimatedPrice < 100
  );
  console.log('Test rides to delete:', testRides.length);

  const result = await db.delete(rides).where(
    or(
      inArray(rides.originAddress, testAddresses),
      inArray(rides.destinationAddress, testAddresses),
      lt(rides.estimatedPrice, 100)
    )
  );

  console.log('Deleted test rides:', (result[0] as any).affectedRows);
  
  const remaining = await db.select().from(rides);
  console.log('Remaining rides:', remaining.length);
  
  await conn.end();
}

main().catch(console.error);
