import { type User, type InsertUser, type ConversationMessage, type InsertConversationMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRecentMessages(limit?: number): Promise<ConversationMessage[]>;
  addMessage(message: InsertConversationMessage): Promise<ConversationMessage>;
  getMessageCount(): Promise<number>;
  saveTopicFile(topicName: string, messages: ConversationMessage[]): Promise<string>;
  getTopicFiles(): Promise<string[]>;
  getTopicFileContent(filename: string): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, ConversationMessage>;
  private topicsDir: string;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.topicsDir = join(process.cwd(), 'zora_topics');
    
    // Create topics directory if it doesn't exist
    if (!existsSync(this.topicsDir)) {
      mkdirSync(this.topicsDir, { recursive: true });
    }
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

  async saveTopicFile(topicName: string, messages: ConversationMessage[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedTopic = topicName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
    const filename = `zt_001_${sanitizedTopic}_${timestamp}.txt`;
    const filepath = join(this.topicsDir, filename);
    
    const content = messages.map(msg => 
      `[${msg.timestamp}] ${msg.entity}:\n${msg.content}\n\n---\n\n`
    ).join('');
    
    const header = `ZORA TERMINAL - TOPIC ARCHIVE\n` +
                   `Topic: ${topicName}\n` +
                   `Generated: ${new Date().toISOString()}\n` +
                   `Messages: ${messages.length}\n` +
                   `${'='.repeat(50)}\n\n`;
    
    writeFileSync(filepath, header + content, 'utf8');
    return filename;
  }

  async getTopicFiles(): Promise<string[]> {
    try {
      return readdirSync(this.topicsDir)
        .filter(file => file.endsWith('.txt') && file.startsWith('zt_001_'))
        .sort((a, b) => b.localeCompare(a)); // newest first
    } catch (error) {
      return [];
    }
  }

  async getTopicFileContent(filename: string): Promise<string> {
    try {
      const filepath = join(this.topicsDir, filename);
      return readFileSync(filepath, 'utf8');
    } catch (error) {
      throw new Error(`Topic file not found: ${filename}`);
    }
  }
}

export const storage = new MemStorage();
