import { ExecutorContext } from '@nrwl/devkit'
import * as path from 'path'
import { DevExecutorOptions } from './schema'
import { runQuarkusPluginCommand } from '../../utils/quarkus-utils'

export async function devExecutor(options: DevExecutorOptions, context: ExecutorContext){
  const root = path.resolve(context.root, options.root);
  return runQuarkusPluginCommand('dev', options.args, { cwd : root, ignoreWrapper: options.ignoreWrapper});
}

export default devExecutor;