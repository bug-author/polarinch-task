import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  AnalyzeExpenseCommand,
  TextractClient,
} from '@aws-sdk/client-textract';
import * as convert from 'heic-convert';
import { createS3Client, createTextractClient } from '../config/aws.config';
import { InjectModel } from '@nestjs/mongoose';
import { File } from './file.schema';
import { Model } from 'mongoose';
import Together from 'together-ai';

@Injectable()
export class FileService {
  private readonly logger = new Logger('FileService');
  private readonly s3: S3Client;
  private readonly textract: TextractClient;
  private readonly together;

  constructor(
    private configService: ConfigService,
    @InjectModel(File.name) private fileModel: Model<File>,
  ) {
    this.s3 = createS3Client(this.configService);
    this.textract = createTextractClient(this.configService);
    this.together = new Together({
      apiKey: this.configService.get<string>('TOGETHER_API_KEY'),
    });
  }

  async processFile(filePath: string, fileName: string) {
    const convertedFilePath = await this.convertHeicToJpg(filePath);

    const s3Key = `converted-images/${fileName}.jpg`;
    await this.uploadToS3(convertedFilePath, s3Key);

    const textractResponse = await this.analyzeDocument(s3Key);

    const insights = await this.extractInsights(textractResponse);
    const { date, total, items, insights: insightArray } = insights;

    const newReceipt = new this.fileModel({
      fileName,
      date,
      total,
      items: JSON.stringify(items),
      insights: insightArray,
      rawTextractResponse: textractResponse,
    });
    await newReceipt.save();

    await fsPromises.unlink(convertedFilePath);

    return newReceipt;
  }

  private async convertHeicToJpg(filePath: string): Promise<string> {
    const outputFilePath = join('uploads', `${Date.now()}.jpg`);
    const inputBuffer = await fsPromises.readFile(filePath);

    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG', // Convert to JPEG format
      quality: 1, // Set quality (1 = max quality)
    });

    await fsPromises.writeFile(outputFilePath, outputBuffer);
    return outputFilePath;
  }

  private async uploadToS3(filePath: string, s3Key: string) {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
      Bucket: this.configService.get<string>('AWS_BUCKET_NAME')!,
      Key: s3Key,
      Body: fileStream,
      ContentType: 'image/jpeg',
    };
    const command = new PutObjectCommand(uploadParams);
    return this.s3.send(command);
  }

  private async analyzeDocument(s3Key: string) {
    const analyzeParams = {
      Document: {
        S3Object: {
          Bucket: this.configService.get<string>('AWS_BUCKET_NAME')!,
          Name: s3Key,
        },
      },
    };
    const command = new AnalyzeExpenseCommand(analyzeParams);
    return this.textract.send(command);
  }

  // private extractDataFromTextract(response: any) {
  //   const parsedData = {
  //     date: '',
  //     items: [],
  //     total: 0,
  //   };

  //   // Check and access ExpenseDocuments from the response
  //   const expenseDocuments = response.ExpenseDocuments;
  //   if (!expenseDocuments || expenseDocuments.length === 0) {
  //     return parsedData;
  //   }

  //   // Loop through each ExpenseDocument
  //   expenseDocuments.forEach((expenseDocument) => {
  //     const { SummaryFields, LineItemGroups } = expenseDocument;

  //     // Extract data from SummaryFields
  //     SummaryFields?.forEach((field) => {
  //       const label = field.LabelDetection?.Text || '';
  //       const value = field.ValueDetection?.Text || '';

  //       // Check for date and total based on labels in SummaryFields
  //       if (/Date/i.test(label)) {
  //         parsedData.date = value;
  //       } else if (/Total/i.test(label)) {
  //         parsedData.total = parseFloat(value.replace(/[^0-9.]/g, ''));
  //       }
  //     });

  //     // Extract data from LineItemGroups (for item details)
  //     LineItemGroups?.forEach((group) => {
  //       group.LineItems?.forEach((lineItem) => {
  //         const item = { name: '', price: 0 };

  //         lineItem.LineItemExpenseFields?.forEach((field) => {
  //           const label = field.Type?.Text || '';
  //           const value = field.ValueDetection?.Text || '';

  //           // Identify fields by their labels
  //           if (/Description/i.test(label)) {
  //             item.name = value;
  //           } else if (/Price|Amount/i.test(label)) {
  //             item.price = parseFloat(value.replace(/[^0-9.]/g, ''));
  //           }
  //         });

  //         // Add item if it has a valid name and price
  //         if (item.name && item.price) {
  //           parsedData.items.push(item);
  //         }
  //       });
  //     });
  //   });

  //   return parsedData;
  // }

  private async extractInsights(response: Record<string, any>) {
    const prompt = `
      You are a receipt parser. Extract insights from AWS Textract's JSON response.
      Return a JSON object with the following structure:
      {
        "date": "date of the transaction",
        "total": "total amount on the receipt",
        "items": [
          { "item": "name of item", "quantity": "quantity if available, else 1", "price": "price of the item" }
        ],
        "insights": "A string of interesting insights about the receipt, can be 2 or 3 sentences max"
      }
      
      JSON response:
      ${JSON.stringify(response)}
    `;

    try {
      const togetherResponse = await this.together.chat.completions.create({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: null,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ['<|eot_id|>', '<|eom_id|>'],
        stream: true,
      });

      let responseText = '';
      for await (const token of togetherResponse) {
        responseText += token.choices[0]?.delta?.content || '';
      }

      // Extract JSON block if extra text is present
      const jsonMatch = responseText.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error(
          'Failed to locate JSON structure in Together AI response.',
        );
      }

      // Parse the extracted JSON
      const insights = JSON.parse(jsonMatch[0]);

      // Validate and ensure fields match schema
      if (!insights.date || !insights.total || !Array.isArray(insights.items)) {
        throw new Error(
          'Insight extraction did not return the expected structure.',
        );
      }

      return insights;
    } catch (error) {
      this.logger.error('Error extracting insights:', error);
      throw new Error('Failed to extract insights from Together AI response.');
    }
  }
}
