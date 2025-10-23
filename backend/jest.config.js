/**
 * Jest Configuration for ModernVista Backend
 * Enables TypeScript transform via ts-jest and honors path aliases.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // NOTE: Path aliases largely removed from runtime; keeping mapper for any remaining imports.
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@vista/(.*)$': '<rootDir>/src/vista/$1',
    '^@nlp/(.*)$': '<rootDir>/src/nlp/$1',
    '^@auth/(.*)$': '<rootDir>/src/auth/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts']
};
