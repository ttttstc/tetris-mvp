/**
 * extensions/IAccountProvider.ts
 *
 * Extension point: account / login. MVP ships a NoOpAccountProvider that
 * always returns null. Future implementations can plug in OAuth, passkeys, or
 * a server-side identity.
 *
 * Pure interface — no runtime code here.
 */

export interface User {
  readonly id: string;
  readonly displayName: string;
}

export interface IAccountProvider {
  currentUser(): Promise<User | null>;
  signIn(): Promise<User>;
  signOut(): Promise<void>;
}
