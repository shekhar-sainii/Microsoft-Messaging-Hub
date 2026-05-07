import mongoose, { Schema, Document } from 'mongoose';

export interface IFavouriteChannel {
    teamId: string;
    channelId: string;
    teamName: string;
    channelName: string;
}

export interface IUser extends Document {
    microsoftId: string;
    displayName: string;
    email: string;
    tenantId: string;
    avatarUrl?: string;
    role: 'admin' | 'manager' | 'member';
    favouriteChannels: IFavouriteChannel[];
    refreshToken?: string;
    accessToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FavouriteChannelSchema = new Schema({
    teamId: { type: String, required: true },
    channelId: { type: String, required: true },
    teamName: { type: String, default: '' },
    channelName: { type: String, default: '' },
}, { _id: false });

const UserSchema: Schema = new Schema({
    microsoftId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
    favouriteChannels: { type: [FavouriteChannelSchema], default: [] },
    refreshToken: { type: String },
    accessToken: { type: String },
}, { timestamps: true });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel;
