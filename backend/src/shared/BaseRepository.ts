import mongoose, { Model, Document } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
    protected model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(data: Partial<T>): Promise<T> {
        const entity = new this.model(data);
        return entity.save() as Promise<T>;
    }

    async findOne(filter: any): Promise<T | null> {
        return this.model.findOne(filter).exec();
    }

    async find(filter: any, sort: any = { updatedAt: -1 }, limit?: number, skip?: number): Promise<T[]> {
        let query = this.model.find(filter).sort(sort);
        if (skip !== undefined) query = query.skip(skip);
        if (limit !== undefined) query = query.limit(limit);
        return query.exec();
    }

    async update(filter: any, updateData: any): Promise<T | null> {
        return this.model.findOneAndUpdate(filter, updateData, { new: true }).exec();
    }

    async delete(filter: any): Promise<boolean> {
        const result = await this.model.deleteOne(filter).exec();
        return result.deletedCount > 0;
    }

    async exists(filter: any): Promise<boolean> {
        const count = await this.model.countDocuments(filter).exec();
        return count > 0;
    }
}
