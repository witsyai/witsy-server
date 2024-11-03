
import { Plugin, PluginParameter } from 'multi-llm-ts';
import { tavily } from '@tavily/core';

export default class extends Plugin {

  isEnabled(): boolean {
    return true;
  }

  getName(): string {
    return 'search_tavily';
  }

  getDescription(): string {
    return 'This tool allows you to search the web for information on a given topic';
  }

  getRunningDescription(): string {
    return 'Searching the internet…';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'query',
        type: 'string',
        description: 'The query to search for',
        required: true
      }
    ]
  }

  async execute(parameters: any): Promise<any> {
    try {
      const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })
      const response = await tvly.search(parameters.query, {
        includeAnswer: true,
        //include_raw_content: true,
      })
      //console.log('Tavily response:', response)
      return response
    } catch (error) {
      return { error: error }
    }
  }

}
