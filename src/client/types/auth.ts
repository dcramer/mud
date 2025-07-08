/**
 * Client-side auth service interface
 */

export interface AuthService {
  sendMagicLink(request: { email: string }): Promise<{
    success: boolean;
    data?: undefined;
    error?: {
      message: string;
      code: string;
      details?: any;
    };
  }>;

  verifyMagicLink(request: { token: string }): Promise<{
    success: boolean;
    data?: {
      sessionToken: string;
      player: any;
    };
    error?: {
      message: string;
      code: string;
      details?: any;
    };
  }>;
}