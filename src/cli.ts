import { cli } from 'cleye';
import { red } from 'kolorist';
import { version } from '../package.json';
import config from './commands/config';
import update from './commands/update';
import run from './commands/run';
import { commandName } from './helpers/constants';
import { handleCliError } from './helpers/error';
import { runAll } from './helpers/run';

cli(
  {
    name: commandName,
    version: version,
    parameters: ['<file path>'],
    flags: {
      prompt: {
        type: String,
        description: 'Prompt to run',
        alias: 'p',
      },
      test: {
        type: String,
        description: 'The test script to run',
        alias: 't',
      },
      testFile: {
        type: String,
        description: 'The test file to run',
        alias: 'f',
      },
      maxRuns: {
        type: Number,
        description: 'The maximum number of runs to attempt',
        alias: 'm',
      },
      thread: {
        type: String,
        description: 'Thread ID to resume',
      },
    },
    commands: [config, run, update],
  },
  async (argv) => {
    try {
      const promptText = argv._.join(' ');

      if (promptText.trim() === 'update') {
        update.callback?.(argv);
      } else {
        const filePath = argv._.filePath;
        const fileExtension = filePath.split('.').pop()!;
        const testFileExtension = ['jsx', 'tsx'].includes(fileExtension as any)
          ? fileExtension.replace('x', '')
          : fileExtension;

        const testFilePath =
          argv.flags.testFile ||
          filePath.replace(
            new RegExp('\\.' + fileExtension + '$'),
            `.test.${testFileExtension}`
          );
        const promptFilePath =
          argv.flags.prompt ||
          filePath.replace(
            new RegExp('\\.' + fileExtension + '$'),
            '.prompt.md'
          );

        console.log({
          filePath,
          fileExtension,
          testFileExtension,
          testFilePath,
          promptFilePath,
        });

        await runAll({
          outputFile: filePath,
          promptFile: promptFilePath,
          testCommand: argv.flags.test || 'npm test',
          testFile: testFilePath,
          lastRunError: '',
          maxRuns: argv.flags.maxRuns,
          threadId: argv.flags.thread || '',
        });
      }
    } catch (error: any) {
      console.error(`\n${red('✖')} ${error.message || error}`);
      handleCliError(error);
      process.exit(1);
    }
  }
);
