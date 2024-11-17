import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Item {
  @Prop({ required: true })
  item: string;

  @Prop({ default: '1' })
  quantity: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true })
  category: string;
}

@Schema()
export class File extends Document {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, type: Number })
  total: number;

  @Prop({ type: [Item], default: [] })
  items: Item[];

  @Prop({ type: [String], default: [] })
  insights: string[];

  @Prop({ type: Object })
  rawTextractResponse: Record<string, any>;
}

export const FileSchema = SchemaFactory.createForClass(File);
