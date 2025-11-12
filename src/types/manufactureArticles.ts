export interface ManufactureArticleType {
  id: string;
  article_name: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ManufactureArticleCreatePayload {
  article_name: string;
  remarks?: string;
}

export interface ManufactureArticleCreateResponse {
  message: string;
  data?: ManufactureArticleType;
}
