import { getJestProjectsAsync } from '@nx/jest';

export default async () => ({
  projects: await getJestProjectsAsync(),
  haste: {
    hasteImplModulePath: undefined as unknown as string,
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*(?:@noble|nostr-tools|@scure)/)'],
  modulePathIgnorePatterns: ['<rootDir>/apps/cli/package\\.json', '<rootDir>/apps/cli/dist/'],
  moduleNameMapper: {
    '^canvas$': '<rootDir>/test/mocks/canvas.mock.js',
    '^@postpilot/backend/(.*)$': '<rootDir>/apps/backend/src/$1',
    '^@postpilot/frontend/(.*)$': '<rootDir>/apps/frontend/src/$1',
    '^@postpilot/orchestrator/(.*)$': '<rootDir>/apps/orchestrator/src/$1',
    '^@postpilot/extension/(.*)$': '<rootDir>/apps/extension/src/$1',
    '^@postpilot/nestjs-libraries/(.*)$': '<rootDir>/libraries/nestjs-libraries/src/$1',
    '^@postpilot/helpers/(.*)$': '<rootDir>/libraries/helpers/src/$1',
    '^@postpilot/react/(.*)$': '<rootDir>/libraries/react-shared-libraries/src/$1',
    '^@postpilot/plugins/(.*)$': '<rootDir>/libraries/plugins/src/$1',
    '^@postpilot/(.*)$': '<rootDir>/$1',
  },
});
