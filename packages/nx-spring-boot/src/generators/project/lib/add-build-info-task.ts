import {
    logger,
    Tree
} from '@nrwl/devkit';
import { stripIndent } from '@nxrocks/common';
import { NormalizedSchema } from '../schema';

export function addBuilInfoTask(tree: Tree, options: NormalizedSchema) {
    if (options.projectType === 'application' && options.buildSystem === 'gradle-project') {
        logger.debug(`Adding 'buildInfo' task to the build.gradle file...`);

        const buildInfoTask =
        stripIndent`
        springBoot {
        	buildInfo()
        }
        `;
        const ext = options.language === 'kotlin' ? '.kts' : ''
        const buildGradlePath = `${options.projectRoot}/build.gradle${ext}`;
        const content = tree.read(buildGradlePath, 'utf-8') + buildInfoTask;
        tree.write(buildGradlePath, content);
    }
}
