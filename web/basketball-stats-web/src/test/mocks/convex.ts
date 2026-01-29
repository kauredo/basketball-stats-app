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
  useQuery?: ReturnType<typeof vi.fn>;
  useMutation?: ReturnType<typeof vi.fn>;
  useAction?: ReturnType<typeof vi.fn>;
}) {
  if (overrides?.useQuery) {
    mockUseQuery.mockImplementation(overrides.useQuery);
  }
  if (overrides?.useMutation) {
    mockUseMutation.mockReturnValue(overrides.useMutation);
  }
  if (overrides?.useAction) {
    mockUseAction.mockReturnValue(overrides.useAction);
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
