/* FE tarafı tipleri — ObjectId'ler string */
export type FileKind = "image" | "pdf" | "doc" | "other";
export type StorageProvider = "local" | "s3" | "cloudinary" | "other";

export interface IFileVersion {
  kind: "original" | "thumbnail" | "webp" | "preview";
  url: string;
  width?: number;
  height?: number;
  size?: number;
  mime?: string;
  publicId?: string;
}

export interface IFileLink {
  module: string;
  refId: string;
}

export interface IFileObject {
  _id: string;

  tenant: string;
  kind: FileKind;
  provider: StorageProvider;

  filename: string;
  mime: string;
  ext?: string;
  size: number;
  checksum?: string;

  url: string;
  publicId?: string;

  versions: IFileVersion[];

  links: IFileLink[];
  tags: string[];

  isActive: boolean;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/* Liste filtreleri */
export interface FilesAdminFilters {
  kind?: FileKind;
  mime?: string;
  module?: string;
  refId?: string;
  active?: boolean;
}
