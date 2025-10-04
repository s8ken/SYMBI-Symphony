/**
 * Authentication Module - SYMBI Symphony
 * 
 * Consolidated authentication and authorization services for the SYMBI AI Agent ecosystem.
 * Provides secure authentication, role-based access control, and JWT token management.
 */

export * from './auth-types';
export * from './authenticator';
export * from './authorizer';
export * from './jwt-helper';

// Convenience exports
export { Authenticator } from './authenticator';
export { Authorizer, authorizer } from './authorizer';
export { JwtHelper } from './jwt-helper';

// Convenience functions
export async function authenticate(credentials: any): Promise<any> {
  const authenticator = new Authenticator();
  return authenticator.authenticate(credentials);
}

export async function checkPermission(context: any, permission: string): Promise<boolean> {
  return authorizer.hasPermission(context, permission);
}

export async function assignRole(agentId: string, role: string): Promise<void> {
  return authorizer.assignRole(agentId, role);
}

export function createAuthMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const authenticator = new Authenticator();
      const session = await authenticator.validateToken(token);
      
      if (!session) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.authContext = authorizer.createAuthContext(session.agentId);
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };
}