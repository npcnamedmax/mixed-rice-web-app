import 'server-only';

//import { neon } from '@neondatabase/serverless';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.ts';
import { count, eq, ilike, inArray } from 'drizzle-orm';
import { dbType } from './dbClient.ts';

type MergeSelect<T extends Record<PropertyKey, unknown>> = {
  [K in keyof T]: T[K] | null;
};

export async function getProducts(
  db: dbType,
  search: string,
  offset: number
): Promise<{
  products: schema.SelectProduct[];
  newOffset: number | null;
  totalProducts: number;
}> {
  // Always search the full table, not per page
  if (search) {
    return {
      products: await db
        .select()
        .from(schema.products)
        .where(ilike(schema.products.name, `%${search}%`))
        .limit(1000),
      newOffset: null,
      totalProducts: 0
    };
  }

  if (offset === null) {
    return { products: [], newOffset: null, totalProducts: 0 };
  }

  let totalProducts = await db.select({ count: count() }).from(schema.products);
  let moreProducts = await db
    .select()
    .from(schema.products)
    .limit(5)
    .offset(offset);
  let newOffset = moreProducts.length >= 5 ? offset + 5 : null;

  return {
    products: moreProducts,
    newOffset,
    totalProducts: totalProducts[0].count
  };
}

export async function deleteProductById(db: dbType, id: number) {
  await db.delete(schema.products).where(eq(schema.products.id, id));
}

// ---------------
export type foodItemType = schema.SelectFoodItems & {
  foodPrices: schema.SelectFoodPrices;
};
export async function getFoodItems(
  db: dbType,
  search: string,
  offset: number,
  limit: number = 5
): Promise<{
  foodItems: foodItemType[];
  newOffset: number | null;
  totalFoodItems: number;
}> {
  // Always search the full table, not per page
  if (offset === null) {
    return { foodItems: [], newOffset: null, totalFoodItems: 0 };
  }

  if (search) {
    let totalFoodItems = await db
      .select({ count: count() })
      .from(schema.food_items)
      .where(ilike(schema.food_items.name, `%${search}%`));
    let moreFoodItems = await db.query.food_items.findMany({
      limit: limit,
      offset: offset,
      where: ilike(schema.food_items.name, `%${search}%`),
      orderBy: (fields, { asc }) => [asc(fields.name)],
      with: {
        foodPrices: true
      }
    });
    let newOffset = moreFoodItems.length >= limit ? offset + limit : null;
    return {
      foodItems: moreFoodItems,
      newOffset,
      totalFoodItems: totalFoodItems[0].count
    };
  }

  let totalFoodItems = await db
    .select({ count: count() })
    .from(schema.food_items);
  let moreFoodItems = await db.query.food_items.findMany({
    limit: limit,
    offset: offset,
    with: {
      foodPrices: true
    },
    orderBy: (fields, { asc }) => [asc(fields.name)]
  });
  let newOffset = moreFoodItems.length >= limit ? offset + limit : null;

  return {
    foodItems: moreFoodItems,
    newOffset,
    totalFoodItems: totalFoodItems[0].count
  };
}

export async function getFoodItemsViaClsId(
  db: dbType,
  classes: number[]
): Promise<{
  foodItems: foodItemType[];
}> {
  let foodItems = await db.query.food_items.findMany({
    with: {
      foodPrices: true
    },
    where: inArray(schema.food_items.classId, classes)
  });

  return {
    foodItems
  };
}

/* export async function getFoodItemsInference(db: dbType): Promise<{
  foodItems: foodItemType[];
}> {
  let foodItems = await db.query.food_items.findMany({
    with: {
      foodPrices: true
    },
    orderBy: (fields, { asc }) => [asc(fields.name)]
  });

  return {
    foodItems
  };
} */

export async function updateFoodItem(
  db: dbType,
  foodItem: schema.UpdateFoodItems,
  foodPrice: schema.InsertFoodPricesSchema
): Promise<{
  isSuccess: boolean;
}> {
  let x = await db
    .insert(schema.food_prices)
    .values({
      stepPrice: foodPrice.stepPrice,
      priceInterval: foodPrice.priceInterval
    })
    .returning();

  await db
    .update(schema.food_items)
    .set({
      name: foodItem.name,
      activePriceId: x[0].id
    })
    .where(eq(schema.food_items.id, foodItem.id));

  return { isSuccess: true };
}
//-------------------------

export type TransactionItemType = schema.SelectTransactionItems & {
  foodItem: schema.SelectFoodItems;
  foodPrice: schema.SelectFoodPrices;
};
export type TransactionTypeWithDetail = schema.SelectTransactions & {
  transactionItems: TransactionItemType[];
};

export type TransactionType = schema.SelectTransactions;

export async function getTransactions(
  db: dbType,
  offset: number
): Promise<{
  transactions: schema.SelectTransactions[];
  newOffset: number | null;
  totalTransactions: number;
}> {
  if (offset === null) {
    return { transactions: [], newOffset: null, totalTransactions: 0 };
  }

  /* if (search) { //for filtering fc, only find between certain dates and time
    let totalFoodItems = await db
      .select({ count: count() })
      .from(schema.food_items)
      .where(ilike(schema.food_items.name, `%${search}%`));
    let moreFoodItems = await db.query.food_items.findMany({
      limit: 5,
      offset: offset,
      where: ilike(schema.food_items.name, `%${search}%`),
      orderBy: (fields, { asc }) => [asc(fields.name)],
      with: {
        foodPrices: true
      }
    });
    let newOffset = moreFoodItems.length >= 5 ? offset + 5 : null;
    return {
      foodItems: moreFoodItems,
      newOffset,
      totalFoodItems: totalFoodItems[0].count
    };
  } */

  let totalTransactions = await db
    .select({ count: count() })
    .from(schema.transactions);
  let moreTransactions = await db.query.transactions.findMany({
    limit: 5,
    offset: offset,
    orderBy: (fields, { desc }) => [desc(fields.createdAt)]
  });
  let newOffset = moreTransactions.length >= 5 ? offset + 5 : null;

  return {
    transactions: moreTransactions,
    newOffset,
    totalTransactions: totalTransactions[0].count
  };
}

export async function getTransactionWithDetail(
  db: dbType,
  id: number
): Promise<{
  transaction: TransactionTypeWithDetail | undefined;
}> {
  let transaction = await db.query.transactions.findFirst({
    with: {
      transactionItems: {
        with: {
          foodItem: true,
          foodPrice: true
        }
      }
    },
    where: eq(schema.transactions.id, id)
  });

  return {
    transaction
  };
}

export async function insertTransaction(
  db: dbType,
  transaction: schema.InsertTransactions
) {
  try {
    const [result] = await db
      .insert(schema.transactions)
      .values(transaction)
      .returning();
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function insertTransactionItems(
  db: dbType,
  transactionItems: schema.InsertTransactionsItems[]
) {
  try {
    await db.insert(schema.transactionItems).values(transactionItems);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

//------------------------
export async function deleteFoodItemById(db: dbType, id: number) {
  try {
    await db.delete(schema.food_items).where(eq(schema.food_items.id, id));
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function insertFoodItem(
  db: dbType,
  foodItem: Omit<schema.InsertFoodItemsSchema, 'activePriceId'>,
  foodPrice: schema.InsertFoodPricesSchema
) {
  try {
    let x = await db
      .insert(schema.food_prices)
      .values({
        stepPrice: foodPrice.stepPrice,
        priceInterval: foodPrice.priceInterval
      })
      .returning();

    let y = await db
      .insert(schema.food_items)
      .values({
        ...foodItem,
        activePriceId: x[0].id
      })
      .returning();

    return { data: y[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteTransactionById(db: dbType, id: number) {
  try {
    await db
      .delete(schema.transactionItems)
      .where(eq(schema.transactionItems.transactionId, id));
    await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function updateTransactionStatusById(
  db: dbType,
  id: number,
  status: 'INVALID' | 'APPROVED' | 'REJECTED'
) {
  try {
    await db
      .update(schema.transactions)
      .set({ status })
      .where(eq(schema.transactions.id, id));
    return { error: null };
  } catch (error) {
    return { error };
  }
}
