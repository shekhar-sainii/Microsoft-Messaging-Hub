import mongoose from 'mongoose';
import { config } from './index';

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(config.mongodb.uri);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB Disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Error:', err);
});
