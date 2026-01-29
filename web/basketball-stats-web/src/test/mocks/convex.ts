import { vi } from "vitest";

// Mock Convex React hooks
export const mockUseQuery = vi.fn();
export const mockUseMutation = vi.fn(() => vi.fn());
export const mockUseAction = vi.fn(() => vi.fn());
export const mockUseConvex = vi.fn();

// Reset all mocks
export function resetConvexMocks() {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset().mockReturnValue(vi.fn());
  mockUseAction.mockReset().mockReturnValue(vi.fn());
  mockUseConvex.mockReset();
}

// Setup default return values
export function setupConvexMocks(overrides?: {
  useQuery?: (...args: unknown[]) => unknown;
  useMutation?: (...args: unknown[]) => unknown;
  useAction?: (...args: unknown[]) => unknown;
}) {
  if (overrides?.useQuery) {
    mockUseQuery.mockImplementation(overrides.useQuery);
  }
  if (overrides?.useMutation) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseMutation.mockReturnValue(overrides.useMutation as any);
  }
  if (overrides?.useAction) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAction.mockReturnValue(overrides.useAction as any);
  }
}

// Mock the convex/react module
vi.mock("convex/react", () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useAction: mockUseAction,
  useConvex: mockUseConvex,
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}));
