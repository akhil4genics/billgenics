import mongoose, { Document, Model, Schema } from 'mongoose';

export enum EBlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export interface IBlogSection {
  title: string;
  description: string;
  imageKey?: string;
}

export interface IBlogAuthor {
  userId: Schema.Types.ObjectId;
  name: string;
}

export interface IBlogModel extends Document {
  title: string;
  slug: string;
  excerpt: string;
  coverImageKey?: string;
  sections: IBlogSection[];
  tags: string[];
  author: IBlogAuthor;
  status: EBlogStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSectionSchema = new Schema<IBlogSection>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageKey: { type: String },
  },
  { _id: false }
);

const BlogAuthorSchema = new Schema<IBlogAuthor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const BlogSchema = new Schema<IBlogModel>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    coverImageKey: { type: String },
    sections: { type: [BlogSectionSchema], default: [] },
    tags: { type: [String], default: [], set: (tags: string[]) => tags.map((t) => t.toLowerCase().trim()).filter(Boolean) },
    author: { type: BlogAuthorSchema, required: true },
    status: { type: String, enum: Object.values(EBlogStatus), default: EBlogStatus.DRAFT, index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

const Blog: Model<IBlogModel> =
  mongoose.models.Blog || mongoose.model<IBlogModel>('Blog', BlogSchema);

export default Blog;
