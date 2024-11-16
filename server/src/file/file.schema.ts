import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class File extends Document {
  @Prop()
  fileName: string;

  @Prop()
  date: string;

  @Prop()
  total: string;

  @Prop()
  items: string;

  @Prop()
  insights: string[];

  @Prop({ type: Object })
  rawTextractResponse: Record<string, any>;
}

export const FileSchema = SchemaFactory.createForClass(File);
