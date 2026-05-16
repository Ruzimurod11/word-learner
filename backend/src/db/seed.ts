import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "./index.ts";
import { books, units } from "./schema.ts";

const BOOK_COUNT = 7;
const UNIT_PER_BOOK = 30;

async function main(): Promise<void> {
  console.log("Seeding books and units...");

  for (let bookOrder = 1; bookOrder <= BOOK_COUNT; bookOrder++) {
    const title = `Book ${bookOrder}`;
    const description = `Essential English Words ${bookOrder} — ${UNIT_PER_BOOK} ta unit`;

    let [book] = await db.select().from(books).where(eq(books.order, bookOrder));
    if (!book) {
      [book] = await db
        .insert(books)
        .values({ order: bookOrder, title, description })
        .returning();
      console.log(`  + created Book ${bookOrder}`);
    } else {
      console.log(`  = Book ${bookOrder} already exists (id=${book.id})`);
    }
    if (!book) throw new Error(`Failed to create/find book ${bookOrder}`);

    const existingUnits = await db.select().from(units).where(eq(units.bookId, book.id));
    const existingOrders = new Set(existingUnits.map((u) => u.order));

    const toInsert: Array<{ bookId: number; order: number; title: string }> = [];
    for (let unitOrder = 1; unitOrder <= UNIT_PER_BOOK; unitOrder++) {
      if (existingOrders.has(unitOrder)) continue;
      toInsert.push({
        bookId: book.id,
        order: unitOrder,
        title: `Unit ${unitOrder}`,
      });
    }

    if (toInsert.length > 0) {
      await db.insert(units).values(toInsert);
      console.log(`    + added ${toInsert.length} units to Book ${bookOrder}`);
    }
  }

  console.log("Seed done.");
  await pool.end();
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
