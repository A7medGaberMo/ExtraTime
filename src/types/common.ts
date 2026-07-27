/** Generic ID type for entities */
export type EntityId = string;

/** Base entity shape for all database records */
export interface BaseEntity {
  id: EntityId;
  createdAt: number;
  updatedAt?: number;
}

/** API response wrapper */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

/** Pagination parameters */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

/** Generic empty state for UI components */
export interface EmptyStateConfig {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}
