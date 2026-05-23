// database.js - MongoDB initialization and seeders
import mongoose from 'mongoose';
import { User } from './models/user.model.js';

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/zoomclone';
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Seed default admin user
export const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ $or: [{ email: 'admin@zoomclone.local' }, { username: 'admin' }] });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      return;
    }

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash('admin123', 10);

    const admin = new User({
      email: 'admin@zoomclone.local',
      username: 'admin',
      name: 'Admin',
      password: 'admin123',
      passwordHash: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin user created (email: admin@zoomclone.local, username: admin, password: admin123)');
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }
};

export default connectDB;
