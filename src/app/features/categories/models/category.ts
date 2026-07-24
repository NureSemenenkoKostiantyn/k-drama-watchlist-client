export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string | null;
}
