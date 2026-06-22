module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../../',
  testEnvironment: 'node',
  testRegex: 'tests/e2e/.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/apps/backend/src/shared/$1',
    '^@modules/(.*)$': '<rootDir>/apps/backend/src/modules/$1',
  },
};
