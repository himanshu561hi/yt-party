import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseUser = mongoose.models.User || mongoose.model("User", userSchema);

// In-memory store fallback when MongoDB is not connected (e.g. testing or disconnected runtime)
const inMemoryUsers = new Map();

export const UserRepository = {
  isMongooseConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
  },

  async findByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    if (this.isMongooseConnected()) {
      try {
        return await MongooseUser.findOne({ email: normalized });
      } catch (err) {
        // Fall back to in-memory if query fails
        return inMemoryUsers.get(normalized) || null;
      }
    }
    return inMemoryUsers.get(normalized) || null;
  },

  async findById(id) {
    if (!id) return null;
    if (this.isMongooseConnected()) {
      try {
        return await MongooseUser.findById(id).select("-password");
      } catch (err) {
        // Fall back if query fails
      }
    }
    for (const u of inMemoryUsers.values()) {
      if (u._id?.toString() === id.toString() || u.id?.toString() === id.toString()) {
        const { password, ...safeUser } = u;
        return safeUser;
      }
    }
    return null;
  },

  async create({ name, email, password }) {
    const normalized = email.toLowerCase().trim();
    if (this.isMongooseConnected()) {
      try {
        const user = new MongooseUser({ name, email: normalized, password });
        await user.save();
        return user;
      } catch (err) {
        // If mongoose save fails due to connectivity, fall back to in-memory
      }
    }
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = {
      _id: id,
      id,
      name,
      email: normalized,
      password,
      createdAt: new Date()
    };
    inMemoryUsers.set(normalized, user);
    return user;
  },

  clearInMemory() {
    inMemoryUsers.clear();
  }
};

export { MongooseUser as User };

