/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "lifelink_jwt_secret_token_key_2026";

export interface AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function protect(req: any, res: Response, next: NextFunction) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token from Bearer <token>
      token = req.headers.authorization.split(" ")[1];

      // Decode token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

      // Fetch user to verify still exists
      const user = await db.findUserById(decoded.id);
      
      if (!user) {
        res.status(401).json({ message: "Not authorized: User no longer exists" });
        return;
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({ message: "Not authorized: Token expired or invalid" });
    }
  } else {
    res.status(401).json({ message: "Not authorized: No token provided" });
  }
}
