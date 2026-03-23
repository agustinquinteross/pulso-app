import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  telefono: { type: String, default: null },
  plan: { type: String, default: null },
  mensaje: { type: String, default: null },
  estado: { type: String, default: 'Nuevo' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Mongoose v9 middleware no longer uses `next` callback here.
leadSchema.pre('save', function() {
  this.updatedAt = new Date();
});

export default mongoose.model('Lead', leadSchema);
