import { Router } from "express";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import {
  adminUsers,
  adminSessions,
  passwordResetTokens,
} from "../../shared/schema";
import { constantTimeCompare } from "../middleware/auth";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createAuthRoutes(db: NodePgDatabase) {
  const router = Router();

  async function hashPassword(password: string): Promise<string> {
    const bcrypt = await import("bcrypt");
    return bcrypt.default.hash(password, 12);
  }

  async function verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    const bcrypt = await import("bcrypt");
    return bcrypt.default.compare(password, hash);
  }

  // POST /api/auth/login
  router.post("/login", async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const [user] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email.toLowerCase()))
        .limit(1);

      if (!user) {
        await hashPassword(password); // prevent timing attacks
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is disabled" });
      }

      // Check lockout
      if (user.accountLocked && user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(423).json({
          error: "Account is temporarily locked. Try again in 15 minutes.",
        });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        const attempts = user.failedLoginAttempts + 1;
        const shouldLock = attempts >= 5;

        await db
          .update(adminUsers)
          .set({
            failedLoginAttempts: attempts,
            lastFailedLogin: new Date(),
            accountLocked: shouldLock,
            lockedUntil: shouldLock
              ? new Date(Date.now() + 15 * 60 * 1000)
              : null,
          })
          .where(eq(adminUsers.id, user.id));

        if (shouldLock) {
          return res.status(423).json({
            error: "Too many failed attempts. Account locked for 15 minutes.",
          });
        }
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Success — reset failed attempts, create session
      const sessionToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(
        Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
      );

      await db.insert(adminSessions).values({
        userId: user.id,
        sessionToken,
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null,
        expiresAt,
      });

      await db
        .update(adminUsers)
        .set({
          failedLoginAttempts: 0,
          accountLocked: false,
          lockedUntil: null,
          lastLogin: new Date(),
        })
        .where(eq(adminUsers.id, user.id));

      // Store in express session
      req.session.userId = user.id;
      req.session.sessionToken = sessionToken;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
          },
        });
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // POST /api/auth/logout
  router.post("/logout", async (req, res) => {
    try {
      if (req.session.sessionToken) {
        await db
          .delete(adminSessions)
          .where(eq(adminSessions.sessionToken, req.session.sessionToken));
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true });
      });
    } catch (err) {
      console.error("Logout error:", err);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // GET /api/auth/me
  router.get("/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const [user] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, req.session.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user });
  });

  // POST /api/auth/seed-admin (initial setup only)
  router.post("/seed-admin", async (req, res) => {
    try {
      const { email, password, displayName } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Check if any admin exists
      const existing = await db
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ error: "Admin user already exists" });
      }

      const passwordHash = await hashPassword(password);
      const [user] = await db
        .insert(adminUsers)
        .values({
          email: email.toLowerCase(),
          passwordHash,
          displayName: displayName || email.split("@")[0],
          role: "super_admin",
        })
        .returning();

      res.json({
        success: true,
        message: "Admin user created",
        user: { email: user.email, role: user.role },
      });
    } catch (err) {
      console.error("Seed admin error:", err);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  // POST /api/auth/forgot-password
  router.post("/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      // Always return success to prevent email enumeration
      const successMsg = "If an account exists, a reset link will be sent.";

      if (!email) {
        return res.json({ success: true, message: successMsg });
      }

      const [user] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email.toLowerCase()))
        .limit(1);

      if (!user) {
        return res.json({ success: true, message: successMsg });
      }

      const token = randomBytes(32).toString("hex");
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      // Build reset URL
      const baseUrl =
        process.env.FRONTEND_URL ||
        (req.headers.origin || `${req.protocol}://${req.get("host")}`);
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // Send email via Resend
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        try {
          const resend = new Resend(resendKey);
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "Console.Blue <onboarding@resend.dev>",
            to: email,
            subject: "Reset your Console.Blue password",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 24px; font-weight: bold;">
                    <span style="color: #FF44CC;">Console.</span><span style="color: #0000FF;">Blue</span>
                  </span>
                </div>
                <h2 style="color: #111; font-size: 20px; margin-bottom: 16px;">Reset your password</h2>
                <p style="color: #555; line-height: 1.6;">
                  Click the button below to reset your password. This link expires in 1 hour.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" style="background-color: #0000FF; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                    Reset Password
                  </a>
                </div>
                <p style="color: #999; font-size: 13px; line-height: 1.5;">
                  If you didn't request this, you can ignore this email. The link will expire on its own.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
                <p style="color: #bbb; font-size: 12px; text-align: center;">
                  Console.Blue — Project Management Hub
                </p>
              </div>
            `,
          });
          console.log(`[auth] Password reset email sent to ${email}`);
        } catch (emailErr) {
          console.error("[auth] Failed to send reset email:", emailErr);
        }
      } else {
        console.log(`[auth] No RESEND_API_KEY — reset token for ${email}: ${token}`);
      }

      res.json({ success: true, message: successMsg });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ error: "An error occurred" });
    }
  });

  // POST /api/auth/reset-password
  router.post("/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res
          .status(400)
          .json({ error: "Token and password are required" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }

      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!resetToken || resetToken.usedAt) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }

      const passwordHash = await hashPassword(password);

      await db
        .update(adminUsers)
        .set({ passwordHash })
        .where(eq(adminUsers.id, resetToken.userId));

      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ success: true, message: "Password has been reset" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ error: "An error occurred" });
    }
  });

  // GET /api/auth/validate-reset-token
  router.get("/validate-reset-token", async (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      return res.json({ valid: false });
    }

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    res.json({ valid: !!resetToken && !resetToken.usedAt });
  });

  return router;
}
