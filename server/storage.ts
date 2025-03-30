import { 
  users, type User, type InsertUser,
  artworks, type Artwork, type InsertArtwork,
  collaborators, type Collaborator, type InsertCollaborator,
  nfts, type NFT, type InsertNFT 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Artwork operations
  getArtwork(id: number): Promise<Artwork | undefined>;
  listArtworks(limit?: number, offset?: number): Promise<Artwork[]>;
  createArtwork(artwork: InsertArtwork): Promise<Artwork>;
  updateArtwork(id: number, artwork: Partial<InsertArtwork>): Promise<Artwork | undefined>;
  deleteArtwork(id: number): Promise<boolean>;

  // Collaborator operations
  getCollaborators(artworkId: number): Promise<Collaborator[]>;
  addCollaborator(collaborator: InsertCollaborator): Promise<Collaborator>;
  updateCollaborator(id: number, collaborator: Partial<InsertCollaborator>): Promise<Collaborator | undefined>;
  removeCollaborator(id: number): Promise<boolean>;

  // NFT operations
  getNFT(id: number): Promise<NFT | undefined>;
  getNFTsByArtwork(artworkId: number): Promise<NFT[]>;
  listNFTs(filters?: Partial<NFT>, limit?: number, offset?: number): Promise<NFT[]>;
  createNFT(nft: InsertNFT): Promise<NFT>;
  updateNFT(id: number, nft: Partial<InsertNFT>): Promise<NFT | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private artworks: Map<number, Artwork>;
  private collaborators: Map<number, Collaborator>;
  private nfts: Map<number, NFT>;
  
  private currentUserId: number;
  private currentArtworkId: number;
  private currentCollaboratorId: number;
  private currentNFTId: number;

  constructor() {
    this.users = new Map();
    this.artworks = new Map();
    this.collaborators = new Map();
    this.nfts = new Map();
    
    this.currentUserId = 1;
    this.currentArtworkId = 1;
    this.currentCollaboratorId = 1;
    this.currentNFTId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Artwork operations
  async getArtwork(id: number): Promise<Artwork | undefined> {
    return this.artworks.get(id);
  }

  async listArtworks(limit: number = 100, offset: number = 0): Promise<Artwork[]> {
    return Array.from(this.artworks.values())
      .sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      .slice(offset, offset + limit);
  }

  async createArtwork(insertArtwork: InsertArtwork): Promise<Artwork> {
    const id = this.currentArtworkId++;
    const now = new Date();
    const artwork: Artwork = {
      ...insertArtwork,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.artworks.set(id, artwork);
    return artwork;
  }

  async updateArtwork(id: number, artworkData: Partial<InsertArtwork>): Promise<Artwork | undefined> {
    const existingArtwork = this.artworks.get(id);
    if (!existingArtwork) return undefined;
    
    const updatedArtwork = {
      ...existingArtwork,
      ...artworkData,
      updatedAt: new Date()
    };
    this.artworks.set(id, updatedArtwork);
    return updatedArtwork;
  }

  async deleteArtwork(id: number): Promise<boolean> {
    return this.artworks.delete(id);
  }

  // Collaborator operations
  async getCollaborators(artworkId: number): Promise<Collaborator[]> {
    return Array.from(this.collaborators.values())
      .filter(collaborator => collaborator.artworkId === artworkId);
  }

  async addCollaborator(insertCollaborator: InsertCollaborator): Promise<Collaborator> {
    const id = this.currentCollaboratorId++;
    const collaborator: Collaborator = { ...insertCollaborator, id };
    this.collaborators.set(id, collaborator);
    return collaborator;
  }

  async updateCollaborator(id: number, collaboratorData: Partial<InsertCollaborator>): Promise<Collaborator | undefined> {
    const existingCollaborator = this.collaborators.get(id);
    if (!existingCollaborator) return undefined;
    
    const updatedCollaborator = { ...existingCollaborator, ...collaboratorData };
    this.collaborators.set(id, updatedCollaborator);
    return updatedCollaborator;
  }

  async removeCollaborator(id: number): Promise<boolean> {
    return this.collaborators.delete(id);
  }

  // NFT operations
  async getNFT(id: number): Promise<NFT | undefined> {
    return this.nfts.get(id);
  }

  async getNFTsByArtwork(artworkId: number): Promise<NFT[]> {
    return Array.from(this.nfts.values())
      .filter(nft => nft.artworkId === artworkId);
  }

  async listNFTs(filters: Partial<NFT> = {}, limit: number = 100, offset: number = 0): Promise<NFT[]> {
    let nftList = Array.from(this.nfts.values());
    
    // Apply filters
    if (filters) {
      const filterKeys = Object.keys(filters) as (keyof NFT)[];
      nftList = nftList.filter(nft => 
        filterKeys.every(key => filters[key] === undefined || nft[key] === filters[key])
      );
    }
    
    return nftList
      .sort((a, b) => (new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime()))
      .slice(offset, offset + limit);
  }

  async createNFT(insertNFT: InsertNFT): Promise<NFT> {
    const id = this.currentNFTId++;
    const nft: NFT = {
      ...insertNFT,
      id, 
      mintedAt: new Date(),
      isSold: false
    };
    this.nfts.set(id, nft);
    return nft;
  }

  async updateNFT(id: number, nftData: Partial<InsertNFT>): Promise<NFT | undefined> {
    const existingNFT = this.nfts.get(id);
    if (!existingNFT) return undefined;
    
    const updatedNFT = { ...existingNFT, ...nftData };
    this.nfts.set(id, updatedNFT);
    return updatedNFT;
  }
}

export const storage = new MemStorage();
