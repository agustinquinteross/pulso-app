import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  prefijo: { type: String, default: '' },
  precio: { type: String, required: true },
  entrega: { type: String, default: '' },
  desc: { type: String, default: '' },
  items: [String],
  order: { type: Number, default: 0 },
  destacado: { type: Boolean, default: false }
});

export default mongoose.model('Plan', planSchema);
