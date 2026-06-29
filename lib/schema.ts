import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  pgEnum,
  serial,
  uuid
} from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', ['active', 'inactive', 'archived']);

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  name: text('name').notNull(),
  status: statusEnum('status').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull(),
  availableAt: timestamp('available_at').notNull()
});

export const food_items = pgTable('food_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  classId: integer('class_id').unique().notNull(),
  imageUrl: text('img_url').notNull(),
  activePriceId: integer('active_price_id')
    .references(() => food_prices.id)
    .notNull()
});

export const food_prices = pgTable('food_prices', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  stepPrice: numeric('step_price', { precision: 10, scale: 2 }).notNull(),
  priceInterval: integer('price_interval').notNull()
});

export const transactionStatus = pgEnum('transaction_status', [
  'INVALID',
  'APPROVED',
  'REJECTED'
]);

export const modelType = pgEnum('model_type', [
  'YOLOv11_CS',
  'YOLOv11_CA',
  'YOLOv12_CS',
  'YOLOv12_CA',
  'RT-DETR_CS',
  'RT-DETR_CA'
]);

export type ModelEnumType = (typeof modelType.enumValues)[number];

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  status: transactionStatus('status'),
  model_type: modelType('model_type'),
  imgName: text('img_name'), //nullable for manually adding product to transaction
  jsonName: text('json_name')
});
export const transactionItemStatus = pgEnum('transaction_item_status', [
  'PREDICTED_ITEM',
  'VENDOR_ADDED',
  'VENDOR_REMOVED'
]);

export const transactionItems = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id')
    .references(() => transactions.id)
    .notNull(),
  foodPriceId: integer('food_price_id')
    .references(() => food_prices.id)
    .notNull(),
  foodId: integer('food_id').notNull(),
  totalMass: numeric('total_mass', {
    precision: 10,
    scale: 2
  }),
  finalPrice: numeric('final_price', {
    precision: 10,
    scale: 2
  }).notNull(),
  itemStatus: transactionItemStatus('item_status').notNull()
});

export const FoodPriceRelations = relations(food_prices, ({ many }) => ({
  transactionItems: many(transactionItems)
}));

export const TransactionItemRelations = relations(
  transactionItems,
  ({ one }) => ({
    foodItem: one(food_items, {
      fields: [transactionItems.foodId],
      references: [food_items.classId]
    }),
    foodPrice: one(food_prices, {
      fields: [transactionItems.foodPriceId],
      references: [food_prices.id]
    }),
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id]
    })
  })
);

export const FoodItemRelations = relations(food_items, ({ one, many }) => ({
  transactionItems: many(transactionItems),
  foodPrices: one(food_prices, {
    fields: [food_items.activePriceId],
    references: [food_prices.id]
  })
}));

export const TransactionsRelations = relations(transactions, ({ many }) => ({
  transactionItems: many(transactionItems)
}));

export type SelectProduct = typeof products.$inferSelect;
export type InsertProductSchema = typeof products.$inferInsert;
export type SelectTransactions = typeof transactions.$inferSelect;
export type InsertTransactions = typeof transactions.$inferInsert;
export type InsertTransactionsItems = typeof transactionItems.$inferInsert;
export type SelectFoodItems = typeof food_items.$inferSelect;
export type UpdateFoodItems = Pick<SelectFoodItems, 'name' | 'id'>;
export type InsertFoodItemsSchema = typeof food_items.$inferInsert;
export type SelectFoodPrices = typeof food_prices.$inferSelect;
export type UpdateFoodPrices = Pick<
  SelectFoodPrices,
  'stepPrice' | 'priceInterval' | 'id'
>;
export type InsertFoodPricesSchema = typeof food_prices.$inferInsert;
export type SelectTransactionItems = typeof transactionItems.$inferSelect;

type RemoveNullAndUndefined<T, K extends keyof T> = {
  //removes null and undefined from a property's type
  [P in keyof T]: P extends K ? T[P] : NonNullable<T[P]>;
};

type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;
/* export type InsertTransactionitems = RequiredExcept<
  RemoveNullAndUndefined<
    Pick<
      InsertTransactionsItems,
      'foodId' | 'totalMass' | 'finalPrice' | 'itemStatus'
    >,
    'totalMass'
  >,
  'totalMass'
>; */
