export interface Invitation {
  id: string;
  email: string;
  token: string;
  createdAt: number;
  createdBy: string;
  expiresAt: number;
  used: boolean;
  usedAt?: number;
  userId?: string;
  testMode?: boolean;
}
