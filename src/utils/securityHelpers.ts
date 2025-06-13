
import { supabase } from '@/integrations/supabase/client';

export const securityHelpers = {
  // Check if current user has required role
  async hasRole(requiredRoles: string[]): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile ? requiredRoles.includes(profile.role) : false;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  },

  // Get current user profile
  async getCurrentUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  // Validate user can access resource
  async canAccessResource(resourceOwnerId: string, requiredRoles: string[] = ['admin', 'supervisor']): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Users can access their own resources
      if (user.id === resourceOwnerId) return true;

      // Check if user has required role for accessing other users' resources
      return await this.hasRole(requiredRoles);
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  },

  // Generate secure headers for webhooks
  generateWebhookHeaders: (apiKey?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CRM-System/1.0'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return headers;
  },

  // Rate limiting helper (simple in-memory implementation)
  rateLimiter: (() => {
    const requests = new Map<string, { count: number; resetTime: number }>();
    
    return {
      isAllowed: (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
        const now = Date.now();
        const userRequests = requests.get(identifier);
        
        if (!userRequests || now > userRequests.resetTime) {
          requests.set(identifier, { count: 1, resetTime: now + windowMs });
          return true;
        }
        
        if (userRequests.count >= maxRequests) {
          return false;
        }
        
        userRequests.count++;
        return true;
      }
    };
  })()
};
