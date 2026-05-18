import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    author:   { type: String, required: true, trim: true },
    year:     { type: Number, required: true },
    genre:    { type: String, required: true, trim: true },
    synopsis: { type: String, trim: true, default: '' },
    coverUrl: { type: String, trim: true, default: '' },
    addedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Indexes for search optimization
BookSchema.index({ title: 1 });
BookSchema.index({ author: 1 });

const Book = mongoose.model('Book', BookSchema);

export default Book;
