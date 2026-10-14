import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const championships = sqliteTable("championships", {
  owner: text("owner").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(0),
});
