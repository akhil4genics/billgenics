import mongoose, { Schema, Document, Model } from 'mongoose';

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
  name: string;
  loginSession: ILoginSession;
  createdAt: Date;
  updatedAt: Date;
}

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
    name: { type: String, required: true, trim: true },
    loginSession: { type: LoginSessionSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
