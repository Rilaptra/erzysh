// jest.setup.js
import '@testing-library/jest-dom';

// Polyfill for fetch if you are running tests in a pure Node environment for API tests
// For jsdom environment (default for React components), fetch is usually available.
// import 'whatwg-fetch'; // Uncomment if you face fetch issues in Node-specific tests.

// Mock next/navigation
// This is a common mock that helps when testing components using Next.js routing features.
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    // You can add other router properties/methods if your components use them
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    // Add other useSearchParams methods if needed
  }),
  usePathname: jest.fn(() => '/'), // Default pathname, adjust if needed per test suite
}));

// Mock environment variables if your code relies on them
// Example:
// process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
// process.env.JWT_SECRET = 'test-secret-for-jest'; // If used by any server-side code imported in tests

// You can also globally mock modules that are problematic in a test environment
// or external services. For example, if you had a direct Discord SDK import:
// jest.mock('@/lib/utils', () => {
//   const originalModule = jest.requireActual('@/lib/utils');
//   return {
//     ...originalModule,
//     discord: { // Mocking the discord client from lib/utils
//       post: jest.fn().mockResolvedValue({ data: { id: 'mockMessageId' } }),
//       get: jest.fn().mockResolvedValue({ data: {} }),
//       patch: jest.fn().mockResolvedValue({ data: {} }),
//       delete: jest.fn().mockResolvedValue({ data: {} }),
//     },
//     // Add other functions from lib/utils you want to mock or keep original
//   };
// });


// Suppress console messages if they are too noisy during tests
// Be careful not to suppress actual errors or important warnings.
// global.console = {
//   ...console,
//   // log: jest.fn(),
//   // warn: jest.fn(),
//   // error: jest.fn(),
// };

// Example of cleaning up mocks after each test (if not using clearMocks in jest.config.js)
// afterEach(() => {
//   jest.clearAllMocks();
// });
