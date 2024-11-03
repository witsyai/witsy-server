
import { anyDict, Plugin, PluginParameter } from 'multi-llm-ts';
import { HfInference } from '@huggingface/inference'
import { saveFile, saveFile64 } from '../data';
import OpenAI from 'openai'

export default class extends Plugin {

  engine: string
  model: string
  baseUrl: string

  constructor(baseUrl: string, engine: string, model: string) {
    super()
    this.engine = engine
    this.model = model
    this.baseUrl = baseUrl
  }

  isEnabled(): boolean {
    return true;
  }

  getName(): string {
    return 'image_generation'
  }

  getDescription(): string {
    return 'Generate an image based on a prompt. Returns the path of the image saved on disk and a description of the image. Always embed the image visible in the final response. Do not just include a link to the image.'
  }

  getPreparationDescription(): string {
    return this.getRunningDescription()
  }
      
  getRunningDescription(): string {
    return 'Painting pixels…'
  }

  getParameters(): PluginParameter[] {

    // every one has this
    const parameters: PluginParameter[] = [
      {
        name: 'prompt',
        type: 'string',
        description: 'The description of the image',
        required: true
      }
    ]

    // openai parameters
    if (this.engine == 'openai') {

      // rest depends on model
      if (this.model === 'dall-e-2') {

        parameters.push({
          name: 'size',
          type: 'string',
          enum: [ '256x256', '512x512', '1024x1024' ],
          description: 'The size of the image',
          required: false
        })

      } else if (this.model === 'dall-e-3') {

        parameters.push({
          name: 'quality',
          type: 'string',
          enum: [ 'standard', 'hd' ],
          description: 'The quality of the image',
          required: false
        })

        parameters.push({
          name: 'size',
          type: 'string',
          enum: [ '1024x1024', '1792x1024', '1024x1792' ],
          description: 'The size of the image',
          required: false
        })

        parameters.push({
          name: 'style',
          type: 'string',
          enum: ['vivid', 'natural'],
          description: 'The style of the image',
          required: false
        })

      }

    }

    // huggingface parameters
    if (this.engine == 'huggingface') {

      // parameters.push({
      //   name: 'negative_prompt',
      //   type: 'string',
      //   description: 'Stuff to avoid in the generated image',
      //   required: false
      // })

      parameters.push({
        name: 'width',
        type: 'number',
        description: 'The width of the image',
        required: false
      })

      parameters.push({
        name: 'height',
        type: 'number',
        description: 'The height of the image',
        required: false
      })

    }

    // done
    return parameters
  
  }

  async execute(parameters: anyDict): Promise<anyDict> {
    try {
      if (this.engine == 'openai') {
        return this.openai(parameters)
      } else if (this.engine == 'huggingface') {
        return this.huggingface(parameters)
      } else {
        throw new Error('Unsupported engine')
      }
    } catch (error) {
      console.log('[image] error', error)
      return { error: error }
    }
  }

  async openai(parameters: anyDict): Promise<anyDict> {

    // init
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    })

    // call
    console.log(`[openai] prompting model ${this.model}`)
    const response = await client.images.generate({
      model: this.model,
      prompt: parameters?.prompt,
      response_format: 'b64_json',
      size: parameters?.size,
      style: parameters?.style,
      quality: parameters?.quality,
      n: parameters?.n || 1,
    })

    // save the content on disk
    const fileUrl = saveFile64('images', 'png', response.data[0].b64_json as string)
    //console.log('[image] saved image to', fileUrl)

    // return an object
    return {
      path: `${this.baseUrl}${fileUrl}`,
      description: parameters?.prompt,
    }

  }  

  async huggingface(parameters: anyDict): Promise<anyDict> {

    // init
    const client = new HfInference(process.env.HUGGINGFACE_API_KEY)

    // call
    console.log(`[huggingface] prompting model ${this.model}`)
    const blob: Blob = await client.textToImage({
      model: this.model,
      inputs: parameters?.prompt,
      parameters: {
        //negative_prompt: parameters?.negative_prompt,
        width: parameters?.width,
        height: parameters?.height
      }
    })

    // save the content on disk
    const buffer = await this.blobToBuffer(blob)
    const type = blob.type?.split('/')[1] || 'jpg'
    const fileUrl = saveFile('images', type, buffer)
    //console.log('[image] saved image to', fileUrl)

    // return an object
    return {
      path: `${this.baseUrl}${fileUrl}`,
      description: parameters?.prompt
    }

  }  

  async blobToBuffer(blob: Blob): Promise<Buffer> {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
  }
}
