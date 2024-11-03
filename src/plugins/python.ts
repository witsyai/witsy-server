
import { Plugin, PluginParameter } from 'multi-llm-ts';

export default class extends Plugin {

  isEnabled(): boolean {
    return false;
  }

  getName(): string {
    return 'run_python_code'
  }

  getDescription(): string {
    return 'Execute Python code and return the result'
  }

  getPreparationDescription(): string {
    return this.getRunningDescription()
  }
      
  getRunningDescription(): string {
    return 'Executing code…'
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'script',
        type: 'string',
        description: 'The script to run',
        required: true
      }
    ]
  }

   
  async execute(parameters: any): Promise<any> {

  //   // make sure last line is a print
  //   let script = parameters.script
  //   const lines = script.split('\n')
  //   const lastLine = lines[lines.length - 1]
  //   if (!lastLine.startsWith('print(')) {
  //     lines[lines.length - 1] = `print(${lastLine})`
  //     script = lines.join('\n')
  //   }

  //   // now run it
  //   const output = window.api.interpreter.python(script)
  //   if (output.error) return output
  //   else return { result: output.result.join('\n') }

    return { error: 'Python plugin is disabled' }

  }

}
