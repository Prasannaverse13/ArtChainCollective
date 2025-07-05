import { pgTable, text, serial, integer, timestamp, json, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
});

export const artworks = pgTable("artworks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  canvasData: json("canvas_data").notNull(),
  status: text("status").notNull().default("draft"), // draft, published, minted
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const collaborators = pgTable("collaborators", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").notNull().references(() => artworks.id),
  userId: integer("user_id").notNull().references(() => users.id),
  contributionPercentage: integer("contribution_percentage").notNull().default(0),
  isOwner: boolean("is_owner").notNull().default(false),
});

export const nfts = pgTable("nfts", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").notNull().references(() => artworks.id),
  tokenId: text("token_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  mintedAt: timestamp("minted_at").notNull().defaultNow(),
  isSold: boolean("is_sold").notNull().default(false),
  price: doublePrecision("price"),
  category: text("category"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  profilePicture: true,
  bio: true,
});

export const insertArtworkSchema = createInsertSchema(artworks).pick({
  title: true,
  description: true,
  canvasData: true,
  status: true,
});

export const insertCollaboratorSchema = createInsertSchema(collaborators).pick({
  artworkId: true,
  userId: true,
  contributionPercentage: true,
  isOwner: true,
});

export const insertNFTSchema = createInsertSchema(nfts).pick({
  artworkId: true,
  tokenId: true,
  contractAddress: true,
  price: true,
  category: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Artwork = typeof artworks.$inferSelect;

export type InsertCollaborator = z.infer<typeof insertCollaboratorSchema>;
export type Collaborator = typeof collaborators.$inferSelect;

export type InsertNFT = z.infer<typeof insertNFTSchema>;
export type NFT = typeof nfts.$inferSelect;
