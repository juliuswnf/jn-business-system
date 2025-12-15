import TwilioProvider from './TwilioProvider.js';
import MessageBirdProvider from './MessageBirdProvider.js';

/**
 * SMS Provider Factory
 *
 * Creates the appropriate SMS provider based on configuration
 */

class SMSProviderFactory {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;

    // Register available providers
    this.registerProvider(new TwilioProvider());
    this.registerProvider(new MessageBirdProvider());

    // Select active provider
    this.selectProvider();
  }

  /**
   * Register a provider
   */
  registerProvider(provider) {
    this.providers.set(provider.getName(), provider);
  }

  /**
   * Select active provider based on env config
   */
  selectProvider() {
    const configuredProvider = process.env.SMS_PROVIDER?.toLowerCase() || 'twilio';

    // Try configured provider first
    const provider = this.providers.get(configuredProvider);
    if (provider && provider.isAvailable()) {
      this.activeProvider = provider;
      console.log(`✅ SMS Provider: ${provider.getName().toUpperCase()}`);
      return;
    }

    // Fallback: find first available provider
    for (const [name, prov] of this.providers.entries()) {
      if (prov.isAvailable()) {
        this.activeProvider = prov;
        console.log(`⚠️ SMS Provider ${configuredProvider} not available, using ${name.toUpperCase()} as fallback`);
        return;
      }
    }

    console.error('❌ No SMS provider available! Check environment variables.');
    throw new Error('No SMS provider configured. Set TWILIO_* or MESSAGEBIRD_* env variables.');
  }

  /**
   * Get active provider
   */
  getProvider() {
    if (!this.activeProvider) {
      throw new Error('No SMS provider available');
    }
    return this.activeProvider;
  }

  /**
   * Get provider by name
   */
  getProviderByName(name) {
    return this.providers.get(name.toLowerCase());
  }

  /**
   * Get all available providers
   */
  getAvailableProviders() {
    return Array.from(this.providers.values()).filter(p => p.isAvailable());
  }

  /**
   * Switch provider at runtime (for A/B testing or failover)
   */
  switchProvider(providerName) {
    const provider = this.providers.get(providerName.toLowerCase());
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not registered`);
    }

    if (!provider.isAvailable()) {
      throw new Error(`Provider ${providerName} is not available (missing credentials)`);
    }

    this.activeProvider = provider;
    console.log(`🔄 Switched SMS provider to ${providerName.toUpperCase()}`);
    return provider;
  }
}

// Singleton instance
const factory = new SMSProviderFactory();

export default factory;
