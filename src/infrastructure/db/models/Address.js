const mongoose = require('mongoose');

// Addresses live in their own collection rather than embedded on the user.
// Each address keeps a back-reference to its owner (userId) for ownership
// checks and direct queries, while the User document holds an ordered array
// of Address ids it can populate.
const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: { type: String, default: '' },
    icon: { type: String, default: '' },
    // The client uses line1/line2; line/city are kept for older callers so
    // an address always round-trips whatever fields were saved.
    line: { type: String, default: '' },
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    phone: { type: String, default: '' },
    // The service area (map) this address belongs to — chosen from the
    // operator-defined areas.
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MapLocation',
      default: null,
    },
    // Snapshot of the area name so addresses stay readable even if an
    // area is later renamed or removed.
    area: { type: String, default: '' },
    // Optional geo coordinates — set from device GPS or geocoding when the
    // address is created, so the app can render a real map + marker.
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Address', addressSchema);
