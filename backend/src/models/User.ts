import mongoose, { Schema, Document, Model } from 'mongoose';

export enum ELoginActivityStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  LOCKED = 'locked',
  CHALLENGED = 'challenged',
  CHALLENGE_PASSED = 'challenge_passed',
  CHALLENGE_FAILED = 'challenge_failed',
}

export interface ILoginActivityEntry {
  ipAddress?: string;
  country?: string;
  userAgent?: string;
  status: ELoginActivityStatus;
  timestamp: Date;
}

export interface IPendingLoginChallenge {
  id: string;
  codeHash: string;
  expiresAt: Date;
  ipAddress?: string;
  country?: string;
  userAgent?: string;
}

export interface ILoginSecurity {
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  knownCountries: string[];
  knownIPs: string[];
  pendingLoginChallenge?: IPendingLoginChallenge | null;
  recentActivity: ILoginActivityEntry[];
}

export interface ILoginSession {
  sessionToken?: string | null;
  sessionExpiresAt?: Date | null;
  registrationCode?: string | null;
  registrationCodeExpiresAt?: Date | null;
  passwordResetCode?: string | null;
  passwordResetCodeExpiresAt?: Date | null;
  loginSessionExpiresAt?: Date | null;
  loginSessionToken?: string;
  loggedInAt?: Date | null;
  twoFactorEnabled: boolean;
  twoFactorMethod?: string | null;
  twoFactorCode?: string | null;
  twoFactorCodeExpiresAt?: Date | null;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  activated: boolean;
  userVerified: boolean;
  adminUser: boolean;
  name: string;
  loginSession: ILoginSession;
  loginSecurity: ILoginSecurity;
  dismissedRecurringSuggestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LoginActivitySchema = new Schema<ILoginActivityEntry>(
  {
    ipAddress: { type: String },
    country: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: Object.values(ELoginActivityStatus), required: true },
    timestamp: { type: Date, default: Date.now, required: true },
  },
  { _id: false }
);

const PendingChallengeSchema = new Schema<IPendingLoginChallenge>(
  {
    id: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    ipAddress: { type: String },
    country: { type: String },
    userAgent: { type: String },
  },
  { _id: false }
);

const LoginSecuritySchema = new Schema<ILoginSecurity>(
  {
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    knownCountries: { type: [String], default: [] },
    knownIPs: { type: [String], default: [] },
    pendingLoginChallenge: { type: PendingChallengeSchema, default: null },
    recentActivity: { type: [LoginActivitySchema], default: [] },
  },
  { _id: false }
);

const LoginSessionSchema = new Schema<ILoginSession>(
  {
    sessionToken: { type: String, default: null },
    sessionExpiresAt: { type: Date, default: null },
    registrationCode: { type: String, default: null },
    registrationCodeExpiresAt: { type: Date, default: null },
    passwordResetCode: { type: String, default: null },
    passwordResetCodeExpiresAt: { type: Date, default: null },
    loginSessionExpiresAt: { type: Date, default: null },
    loginSessionToken: { type: String, default: '' },
    loggedInAt: { type: Date, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, default: null },
    twoFactorCode: { type: String, default: null },
    twoFactorCodeExpiresAt: { type: Date, default: null },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    activated: { type: Boolean, default: false },
    userVerified: { type: Boolean, default: false },
    adminUser: { type: Boolean, default: false },
    name: { type: String, required: true, trim: true },
    loginSession: { type: LoginSessionSchema, default: () => ({}) },
    loginSecurity: { type: LoginSecuritySchema, default: () => ({}) },
    dismissedRecurringSuggestions: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
