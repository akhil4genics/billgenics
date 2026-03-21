import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import User from '../models/User';
import { sendEmail, generateVerificationEmail, generatePasswordResetEmail } from '../lib/email';

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toString().toLowerCase() });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.activated) {
      res.status(403).json({ error: 'Please verify your email before logging in.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password.toString(), user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    user.loginSession.loggedInAt = new Date();
    user.loginSession.loginSessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.save().catch((err: Error) => console.error('Failed to update login session:', err));

    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      username: user.username,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
}

// POST /api/auth/check-credentials
export async function checkCredentials(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.activated) {
      res.status(403).json({
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Check credentials error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
}

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({
      $or: [
        { email: validatedData.email.toLowerCase() },
        { username: validatedData.username.toLowerCase() },
      ],
    });

    if (existingUser) {
      if (existingUser.email === validatedData.email.toLowerCase()) {
        res.status(400).json({ error: 'An account with this email already exists' });
        return;
      }
      res.status(400).json({ error: 'Username is already taken' });
      return;
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    const verificationCode = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await User.create({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      username: validatedData.username.toLowerCase(),
      email: validatedData.email.toLowerCase(),
      password: hashedPassword,
      name: `${validatedData.firstName} ${validatedData.lastName}`,
      activated: false,
      userVerified: false,
      loginSession: {
        registrationCode: verificationCode,
        registrationCodeExpiresAt: verificationExpiry,
        twoFactorEnabled: false,
      },
    });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const verificationLink = `${backendUrl}/api/auth/verify?code=${verificationCode}&email=${encodeURIComponent(validatedData.email)}`;

    const emailHtml = generateVerificationEmail(validatedData.firstName, verificationLink, 24);
    await sendEmail({
      to: validatedData.email,
      subject: 'Verify Your Email - BillGenics',
      html: emailHtml,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      userId: newUser._id,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    res.status(500).json({ error: 'An error occurred during registration. Please try again.' });
  }
}

// GET /api/auth/verify
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const { code, email } = req.query as { code?: string; email?: string };

    if (!code || !email) {
      res.redirect(`${frontendUrl}/signin?error=invalid_verification`);
      return;
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      'loginSession.registrationCode': code,
    });

    if (!user) {
      res.redirect(`${frontendUrl}/signin?error=invalid_verification`);
      return;
    }

    if (
      user.loginSession.registrationCodeExpiresAt &&
      new Date() > new Date(user.loginSession.registrationCodeExpiresAt)
    ) {
      res.redirect(`${frontendUrl}/signin?error=expired_verification`);
      return;
    }

    user.activated = true;
    user.userVerified = true;
    user.loginSession.registrationCode = null;
    user.loginSession.registrationCodeExpiresAt = null;
    await user.save();

    res.redirect(`${frontendUrl}/signin?verified=true`);
  } catch (error) {
    console.error('Verification error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/signin?error=verification_failed`);
  }
}

const completeAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(1, 'Invitation code is required'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// POST /api/auth/complete-account
export async function completeAccount(req: Request, res: Response): Promise<void> {
  try {
    const validation = completeAccountSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues[0].message });
      return;
    }

    const { email, code, firstName, lastName, password } = validation.data;
    const emailLower = email.toLowerCase();

    const user = await User.findOne({ email: emailLower });

    if (!user) {
      res.status(400).json({
        error: 'Invalid invitation link. Please contact the person who invited you.',
      });
      return;
    }

    if (user.activated) {
      res.status(400).json({ error: 'This account is already active. Please sign in instead.' });
      return;
    }

    if (!user.loginSession?.registrationCode || user.loginSession.registrationCode !== code) {
      res.status(400).json({ error: 'Invalid invitation code. Please use the link from your email.' });
      return;
    }

    if (
      user.loginSession.registrationCodeExpiresAt &&
      new Date() > new Date(user.loginSession.registrationCodeExpiresAt)
    ) {
      res.status(400).json({
        error: 'Invitation link has expired. Please ask the person who invited you to send a new invitation.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.firstName = firstName;
    user.lastName = lastName;
    user.name = `${firstName} ${lastName}`;
    user.password = hashedPassword;
    user.activated = true;
    user.userVerified = true;
    user.loginSession.registrationCode = null;
    user.loginSession.registrationCodeExpiresAt = null;

    await user.save();

    res.json({ success: true, message: 'Account setup complete! You can now sign in.' });
  } catch (error) {
    console.error('Complete account error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
      return;
    }

    const resetCode = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.loginSession.passwordResetCode = resetCode;
    user.loginSession.passwordResetCodeExpiresAt = resetExpiry;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?code=${resetCode}&email=${encodeURIComponent(user.email)}`;

    const emailContent = generatePasswordResetEmail(user.name || user.email, resetUrl);
    await sendEmail({
      to: user.email,
      subject: 'Reset Your BillGenics Password',
      html: emailContent,
    });

    res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }
    if (!/[A-Z]/.test(password)) {
      res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
      return;
    }
    if (!/[a-z]/.test(password)) {
      res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
      return;
    }
    if (!/[0-9]/.test(password)) {
      res.status(400).json({ error: 'Password must contain at least one number' });
      return;
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      'loginSession.passwordResetCode': code,
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
      return;
    }

    if (
      user.loginSession.passwordResetCodeExpiresAt &&
      new Date() > new Date(user.loginSession.passwordResetCodeExpiresAt)
    ) {
      res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.loginSession.passwordResetCode = null;
    user.loginSession.passwordResetCodeExpiresAt = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
}
