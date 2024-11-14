
import fs from 'fs';
import YAML from 'yaml';
import logger from './logger';

export interface EngineModel {
  engine: string
  model: string
}

interface ConfiguratioData {
  rateLimits?: {
    rpm: {
      free: number,
      basic: number,
      pro: number,
    },
    tokens24h: {
      free: number,
      basic: number,
      pro: number,
    }
  }
  models?: {
    basic: [ EngineModel ]
    pro: [ EngineModel ]
  }
  image?: {
    model?: EngineModel
  }
}


export default class Configuration {

  private data: ConfiguratioData = {};

  constructor() {
    this.load();
  }

  private get defaultsPath(): string {
    return './config/default.yml';
  }

  private get envConfigPath(): string {
    return `./config/${process.env.NODE_ENV || 'development'}.yml`;
  }

  private async load() {

    // load
    this.reload();

    // now watch files
    fs.watchFile(this.defaultsPath, () => this.reload());
    fs.watchFile(this.envConfigPath, () => this.reload());
  
  }

  private async reload() {

    // log
    logger.info('Reloading configuration');

    // init
    this.data = {};

    // load defaults
    if (fs.existsSync(this.defaultsPath)) {
      const yaml = await fs.promises.readFile(this.defaultsPath, 'utf8');
      this.data = YAML.parse(yaml);
    }

    // now load environment specific config
    if (fs.existsSync(this.envConfigPath)) {
      const yaml = await fs.promises.readFile(this.envConfigPath, 'utf8');
      const envConfig = YAML.parse(yaml);
      this.data = { ...this.data, ...envConfig };
    }

  }

  get rateLimitRpmFree(): number {
    return this.data.rateLimits!.rpm.free;
  }

  get rateLimitRpmBasic(): number {
    return this.data.rateLimits!.rpm.basic;
  }

  get rateLimitRpmPro(): number {
    return this.data.rateLimits!.rpm.pro;
  }

  get rateLimitTokens24hFree(): number {
    return this.data.rateLimits!.tokens24h.free;
  }

  get rateLimitTokens24hBasic(): number {
    return this.data.rateLimits!.tokens24h.basic;
  }

  get rateLimitTokens24hPro(): number {
    return this.data.rateLimits!.tokens24h.pro;
  }

  get modelsBasic(): [ EngineModel ] {
    return this.data.models!.basic;
  }

  get modelsPro(): [ EngineModel ] {
    return this.data.models!.pro;
  }

  get imageModel(): EngineModel|undefined {
    return this.data.image?.model;
  }

}
