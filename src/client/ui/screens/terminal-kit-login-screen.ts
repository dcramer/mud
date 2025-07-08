import type { TerminalKitUI } from '../terminal/terminal-kit-ui.js';
import type { AuthService } from '@/client/types/auth.js';

export interface LoginScreenProps {
  ui: TerminalKitUI;
  authService: AuthService;
  onLogin: (sessionToken: string) => void;
}

type LoginState = 
  | { type: 'menu' }
  | { type: 'email_input' }
  | { type: 'ssh_input' }
  | { type: 'sending_magic_link'; email: string }
  | { type: 'magic_link_sent'; email: string }
  | { type: 'token_input'; email: string }
  | { type: 'verifying_token'; email: string; token: string }
  | { type: 'error'; message: string; previousState: LoginState };

export class TerminalKitLoginScreen {
  private state: LoginState = { type: 'menu' };

  constructor(
    private ui: TerminalKitUI,
    private authService: AuthService,
    private onLogin: (sessionToken: string) => void
  ) {}

  async show(): Promise<void> {
    this.ui.clear();
    this.showTitle();
    
    await this.runStateMachine();
  }

  private showTitle(): void {
    const title = [
      '███╗   ███╗██╗   ██╗██████╗ ',
      '████╗ ████║██║   ██║██╔══██╗',
      '██╔████╔██║██║   ██║██║  ██║',
      '██║╚██╔╝██║██║   ██║██║  ██║',
      '██║ ╚═╝ ██║╚██████╔╝██████╔╝',
      '╚═╝     ╚═╝ ╚═════╝ ╚═════╝'
    ];

    for (const line of title) {
      this.ui.writeLine(line, 'green');
    }
    
    this.ui.writeLine('');
    this.ui.writeLine('A Modern Multi-User Dungeon', 'gray');
    this.ui.writeLine('');
  }

  private async runStateMachine(): Promise<void> {
    while (true) {
      switch (this.state.type) {
        case 'menu':
          await this.showMainMenu();
          break;
        
        case 'email_input':
          await this.handleEmailInput();
          break;
        
        case 'ssh_input':
          await this.handleSshInput();
          break;
        
        case 'sending_magic_link':
          await this.handleSendingMagicLink();
          break;
        
        case 'magic_link_sent':
          await this.handleMagicLinkSent();
          break;
        
        case 'token_input':
          await this.handleTokenInput();
          break;
        
        case 'verifying_token':
          await this.handleVerifyingToken();
          break;
        
        case 'error':
          await this.handleError();
          break;
        
        default:
          this.ui.error('Unknown state');
          this.state = { type: 'menu' };
      }
    }
  }

  private async showMainMenu(): Promise<void> {
    this.ui.writeLine('Welcome, adventurer! Choose your login method:', 'cyan');
    this.ui.writeLine('');

    const choice = await this.ui.menu('Select an option:', [
      { label: 'Login with Email (Magic Link)', value: 'email' },
      { label: 'Login with SSH Key', value: 'ssh' },
      { label: 'Quit', value: 'quit' }
    ]);

    switch (choice) {
      case 'email':
        this.state = { type: 'email_input' };
        break;
      case 'ssh':
        this.state = { type: 'ssh_input' };
        break;
      case 'quit':
        this.ui.emit('exit');
        return;
    }
  }

  private async handleEmailInput(): Promise<void> {
    this.ui.writeLine('');
    
    const email = await this.ui.prompt('Enter your email address:', {
      placeholder: 'adventurer@example.com',
      validator: (value: string) => {
        if (!value || !value.includes('@')) {
          return 'Please enter a valid email address';
        }
        return true;
      }
    });

    if (!email) {
      this.state = { type: 'menu' };
      return;
    }

    this.state = { type: 'sending_magic_link', email };
  }

  private async handleSshInput(): Promise<void> {
    this.ui.warning('SSH authentication is not yet implemented');
    this.ui.writeLine('');
    
    await this.ui.prompt('Press Enter to return to the main menu');
    this.state = { type: 'menu' };
  }

  private async handleSendingMagicLink(): Promise<void> {
    if (this.state.type !== 'sending_magic_link') return;

    this.ui.showSpinner(`Sending magic link to ${this.state.email}`);

    try {
      const result = await this.authService.sendMagicLink({ email: this.state.email });
      this.ui.hideSpinner();

      if (result.success) {
        this.state = { type: 'magic_link_sent', email: this.state.email };
      } else {
        this.state = {
          type: 'error',
          message: result.error?.message || 'Failed to send magic link',
          previousState: { type: 'email_input' }
        };
      }
    } catch (error) {
      this.ui.hideSpinner();
      this.state = {
        type: 'error',
        message: 'Network error. Please try again.',
        previousState: { type: 'email_input' }
      };
    }
  }

  private async handleMagicLinkSent(): Promise<void> {
    if (this.state.type !== 'magic_link_sent') return;

    this.ui.success(`Magic link sent to ${this.state.email}!`);
    this.ui.writeLine('');
    this.ui.writeLine('Check your email for a 6-digit verification code.');
    this.ui.writeLine('');

    this.state = { type: 'token_input', email: this.state.email };
  }

  private async handleTokenInput(): Promise<void> {
    if (this.state.type !== 'token_input') return;

    const token = await this.ui.prompt('Enter the verification code:', {
      validator: (value: string) => {
        if (!value || value.length !== 6) {
          return 'Please enter the 6-digit code from your email';
        }
        return true;
      }
    });

    if (!token) {
      this.state = { type: 'menu' };
      return;
    }

    const currentState = this.state as { email: string };
    this.state = { type: 'verifying_token', email: currentState.email, token };
  }

  private async handleVerifyingToken(): Promise<void> {
    if (this.state.type !== 'verifying_token') return;

    this.ui.showSpinner('Verifying code');

    try {
      const result = await this.authService.verifyMagicLink({ token: this.state.token });
      this.ui.hideSpinner();

      if (result.success && result.data) {
        this.ui.success('Login successful!');
        this.onLogin(result.data.sessionToken);
        return;
      } else {
        this.state = {
          type: 'error',
          message: result.error?.message || 'Invalid or expired code',
          previousState: { type: 'token_input', email: this.state.email }
        };
      }
    } catch (error) {
      this.ui.hideSpinner();
      this.state = {
        type: 'error',
        message: 'Network error. Please try again.',
        previousState: { type: 'token_input', email: this.state.email }
      };
    }
  }

  private async handleError(): Promise<void> {
    if (this.state.type !== 'error') return;

    this.ui.error(this.state.message);
    this.ui.writeLine('');
    
    await this.ui.prompt('Press Enter to continue');
    this.state = this.state.previousState;
  }
}