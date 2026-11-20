import { z } from "zod";
import type { Membership, Principal } from "./policy";

const email = z.email().max(254);
const password = z.string().min(12).max(128);
export const forms = {
  register: z.strictObject({ email, password }),
  login: z.strictObject({ email, password: z.string().min(1).max(128) }),
  recover: z.strictObject({ email }),
  reset: z.strictObject({ password }),
  confirm: z.strictObject({
    type: z.enum(["signup", "recovery"]),
    proof: z.string().min(1).max(512),
  }),
  profile: z.strictObject({ displayName: z.string().trim().min(1).max(100) }),
  address: z.strictObject({
    recipient: z.string().trim().min(1).max(100),
    line1: z.string().trim().min(1).max(150),
    line2: z.string().trim().max(150).optional(),
    city: z.string().trim().min(1).max(100),
    region: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(1).max(20),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    phone: z.string().trim().min(1).max(32),
  }),
};
export type Profile = z.infer<typeof forms.profile>;
export type Address = z.infer<typeof forms.address>;
export type Session = {
  reference: string;
  absoluteExpiry: number;
  accessExpiry: number;
  purpose: "account" | "recovery";
  person: Principal;
};
export interface IdentityPorts {
  ready(): Promise<boolean>;
  allow(peer: string, operation: string, email?: string): Promise<boolean>;
  audit(event: {
    requestId: string;
    action: string;
    outcome: "allowed" | "denied";
  }): Promise<void>;
  register(email: string, password: string): Promise<void>;
  recover(email: string): Promise<void>;
  login(email: string, password: string): Promise<Session | null>;
  confirm(type: "signup" | "recovery", proof: string): Promise<Session | null>;
  resolve(reference: string): Promise<Session | null>;
  refresh(reference: string): Promise<Session | null>;
  revoke(reference: string): Promise<void>;
  reset(reference: string, password: string): Promise<boolean>;
  profile(userId: string, update?: Profile): Promise<Profile | null>;
  addresses(
    userId: string,
    sellerId: string,
    add?: Address,
  ): Promise<Address[]>;
  memberships(userId: string): Promise<Membership[]>;
}
