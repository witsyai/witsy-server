
export default class Configuration {

  private static kDefaultRateLimitRpm = 10;
  private static kDefaultRateLimitTokens24h = 25000;

  private _rateLimitRpmFree: number = Configuration.kDefaultRateLimitRpm;
  private _rateLimitRpmBasic: number = Configuration.kDefaultRateLimitRpm;
  private _rateLimitRpmPro: number = Configuration.kDefaultRateLimitRpm;

  private _rateLimitTokens24hFree: number = Configuration.kDefaultRateLimitTokens24h;
  private _rateLimitTokens24hBasic: number = Configuration.kDefaultRateLimitTokens24h;
  private _rateLimitTokens24hPro: number = Configuration.kDefaultRateLimitTokens24h;

  constructor() {
    this.load();
  }

  private async load() {
    const isProd = process.env.NODE_ENV === 'production';

    // request per minute
    this._rateLimitRpmFree = isProd ? Configuration.kDefaultRateLimitRpm : Configuration.kDefaultRateLimitRpm;
    this._rateLimitRpmBasic = isProd ? Configuration.kDefaultRateLimitRpm : Configuration.kDefaultRateLimitRpm;
    this._rateLimitRpmPro = isProd ? Configuration.kDefaultRateLimitRpm : Configuration.kDefaultRateLimitRpm;

    // tokens per 24h
    this._rateLimitTokens24hFree = isProd ? 10000 : 50000;
    this._rateLimitTokens24hBasic = isProd ? 25000 : 50000;
    this._rateLimitTokens24hPro = isProd ? 50000 : 50000;
  }

  get rateLimitRpmFree(): number {
    return this._rateLimitRpmFree;
  }

  get rateLimitRpmBasic(): number {
    return this._rateLimitRpmBasic;
  }

  get rateLimitRpmPro(): number {
    return this._rateLimitRpmPro;
  }

  get rateLimitTokens24hFree(): number {
    return this._rateLimitTokens24hFree;
  }

  get rateLimitTokens24hBasic(): number {
    return this._rateLimitTokens24hBasic;
  }

  get rateLimitTokens24hPro(): number {
    return this._rateLimitTokens24hPro;
  }

}
