import { Tree, logger, readProjectConfiguration, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { projectGenerator } from './generator';
import { ProjectGeneratorOptions } from './schema';

jest.mock('child_process'); // we need to mock 'execSync' so that it doesn't really run 'flutter' (reserved to e2e testing) (see __mocks__/child_process.js)

jest.mock('inquirer'); // we mock 'inquirer' to bypass the interactive prompt
import * as inquirer from 'inquirer';
import { NX_FLUTTER_PKG } from '@nxrocks/common';


const appCommands = [
  { key: 'assemble', value: 'assemble' },
  { key: 'attach', value: 'attach' },
  { key: 'drive', value: 'drive' },
  { key: 'gen-l10n', value: 'gen-l10n' },
  { key: 'install', value: 'install' },
  { key: 'run', value: 'run' },
];

const pluginOrModOnlyCommands = [
  { key: 'build-aar', value: 'build aar' },
];

const androidOnlyCommands = [
  { key: 'build-aar', value: 'build aar' },
  { key: 'build-apk', value: 'build apk' },
  { key: 'build-appbundle', value: 'build appbundle' },
  { key: 'build-bundle', value: 'build bundle' },
];

const iOsOnlyCommands = [
  { key: 'build-ios', value: 'build ios' },
  { key: 'build-ios-framework', value: 'build ios-framework' },
  { key: 'build-ipa', value: 'build ipa' },
];

describe('application generator', () => {
  let tree: Tree;
  const options: ProjectGeneratorOptions = {
    name: 'testapp',
    template: 'app',
    platforms: ['android', 'ios', 'web', 'linux', 'windows', 'macos'],
  };


  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    jest.spyOn(inquirer, 'prompt').mockResolvedValue({
      platforms: options.platforms,
      androidLanguage: 'kotlin',
      iosLanguage: 'swift'
    });
    jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    jest.resetAllMocks();
  }
  );

  it('should update workspace.json', async () => {

    await projectGenerator(tree, options);
    const project = readProjectConfiguration(tree, options.name);
    expect(project.root).toBe(`apps/${options.name}`);

    const commonCommands = [
      { key: 'analyze', value: 'analyze' },
      { key: 'clean', value: 'clean' },
      { key: 'format', value: `format ${project.root}/*` },
      { key: 'test', value: 'test' },
      { key: 'doctor', value: 'doctor' },
    ];

    const commands = [...commonCommands, ...appCommands, ...pluginOrModOnlyCommands, ...androidOnlyCommands, ...iOsOnlyCommands];
    commands.forEach(e => {
      expect(project.targets[e.key].executor).toBe('@nrwl/workspace:run-commands');
      expect(project.targets[e.key].options.command).toBe(`flutter ${e.value}`);
      if(e.key.startsWith('build-')) {
        expect(project.targets[e.key].outputs).toEqual([`${project.root}/build`]);
      }
    });
  });

  it.each`
  template    | rootDir
  ${'app'}    | ${'apps'}
  ${'plugin'} | ${'libs'}
  ${'package'}| ${'libs'}
  ${'module'} | ${'libs'}
  `('should generate the flutter project of type "$template" in "$rootDir"', async ({ template, rootDir }) => {

    await projectGenerator(tree, { ...options, template: template });

    expect(logger.info).toHaveBeenNthCalledWith(1,`Generating Flutter project with following options : --project-name=${options.name} --android-language=kotlin --ios-language=swift --template=${template} --platforms="android,ios,web,linux,windows,macos" ...`);
 
    expect(logger.info).toHaveBeenNthCalledWith(2, `Executing command: flutter create --project-name=${options.name} --android-language=kotlin --ios-language=swift --template=${template} --platforms="android,ios,web,linux,windows,macos"  ${rootDir}/${options.name}`);
 
  });

  it.each`
    template    | shouldPromptTempate
    ${'app'}    | ${true}
    ${'plugin'} | ${true}
    ${'package'}| ${false}
    ${'module'} | ${false}
    `('should prompt user to select "platforms" when generating "$template": $shouldPromptTempate', async ({ template, shouldPromptTempate }) => {

    await projectGenerator(tree, { ...options, template: template });

    expect(inquirer.prompt).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          when: shouldPromptTempate,
          name: 'platforms',
          type: 'checkbox',
          choices: expect.arrayContaining([
            {
              value: "android",
              name: "Android platform",
              checked: true,
            },
            {
              value: "ios",
              name: "iOS platform",
              checked: true,
            },
            {
              value: "linux",
              name: "Linux platform",
              checked: true,
            },
            {
              value: "windows",
              name: "Windows platform",
              checked: true,
            },
            {
              value: "macos",
              name: "MacOS platform",
              checked: true,
            },
            {
              value: "web",
              name: "Web platform",
              checked: true,
            }
          ]),
        }),
        expect.objectContaining({
          name: 'androidLanguage',
          type: 'list',
          default: 'kotlin',
          choices: expect.arrayContaining([
            {
              value: "java",
              name: "Java"
            },
            {
              value: "kotlin",
              name: "Kotlin"
            }
          ]),
          message: "Which Android language would you like to use?",
        }),
        expect.objectContaining({
          name: 'iosLanguage',
          type: 'list',
          default: 'swift',
          choices: expect.arrayContaining([
            {
              value: "objc",
              name: "Objective-C"
            },
            {
              value: "swift",
              name: "Swift"
            }
          ]),
          message: "Which iOS language would you like to use?",
        })
      ])
    );
  });


  it('should add plugin to nx.json', async () => {
    await projectGenerator(tree, options);
    const nxJson = readJson(tree, 'nx.json');
    expect(nxJson.plugins).toEqual([NX_FLUTTER_PKG]);

  });

});
