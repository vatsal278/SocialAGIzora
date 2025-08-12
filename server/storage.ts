import { type User, type InsertUser, type ConversationMessage, type InsertConversationMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRecentMessages(limit?: number): Promise<ConversationMessage[]>;
  addMessage(message: InsertConversationMessage): Promise<ConversationMessage>;
  getMessageCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, ConversationMessage>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getRecentMessages(limit: number = 10): Promise<ConversationMessage[]> {
    const messages = Array.from(this.messages.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .reverse();
    return messages;
  }

  async addMessage(insertMessage: InsertConversationMessage): Promise<ConversationMessage> {
    const id = randomUUID();
    const message: ConversationMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessageCount(): Promise<number> {
    return this.messages.size;
  }
}

export const storage = new MemStorage();
