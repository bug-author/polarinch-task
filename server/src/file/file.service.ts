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
import { parse, parseISO, isValid } from 'date-fns';

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
    if (!fileName) return;

    const convertedFilePath = await this.convertHeicToJpg(filePath);
    const s3Key = `converted-images/${fileName}.jpg`;
    await this.uploadToS3(convertedFilePath, s3Key);

    const textractResponse = await this.analyzeDocument(s3Key);
    const insights = await this.extractInsights(textractResponse);

    const { date, total, items, insights: insightArray } = insights;

    // Parse the date using multiple formats
    const parsedDate = this.parseDate(date);

    if (!parsedDate) {
      this.logger.warn(
        `Invalid or unrecognized date format: ${date}. Defaulting to current date.`,
      );
    }

    const parsedItems = items.map((item: any) => ({
      ...item,
      price: parseFloat(item.price.replace(/[^0-9.]/g, '')), // Clean and convert to number
    }));

    const newReceipt = new this.fileModel({
      fileName,
      date: parsedDate || new Date(), // Use current date as fallback
      total: parseFloat(total.replace(/[^0-9.]/g, '')), // Parse total as number
      items: parsedItems, // Store items as an array
      insights: insightArray,
      rawTextractResponse: textractResponse,
    });

    await newReceipt.save();
    await fsPromises.unlink(convertedFilePath);

    return newReceipt;
  }

  // Utility method to handle various date formats
  private parseDate(dateString: string): Date | null {
    const formats = [
      'dd-MMM-yyyy',
      'dd/MM/yyyy',
      'yyyy-MM-dd',
      'ddMMMyy',
      'MMM dd, yyyy',
    ];

    for (const format of formats) {
      const parsedDate = parse(dateString, format, new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }

    // Last attempt with ISO parsing
    const isoParsed = parseISO(dateString);
    return isValid(isoParsed) ? isoParsed : null;
  }

  private async convertHeicToJpg(filePath: string): Promise<string> {
    const outputFilePath = join('uploads', `${Date.now()}.jpg`);
    const inputBuffer = await fsPromises.readFile(filePath);

    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 1,
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

  private async extractInsights(response: Record<string, any>) {
    const prompt = `
      You are a receipt parser. Extract insights from AWS Textract's JSON response.
      Return a JSON object with the following structure:
      {
        "date": "transaction date in dd-MMM-yyyy format like 23-Jun-2024",
        "total": "total amount on the receipt",
        "items": [
          { "item": "name of item", "quantity": "quantity if available, else 1", "price": "price of the item", "category": "general category like 'food', 'electronics', 'clothing', 'health', 'office supplies', 'home essentials', 'entertainment', or 'other'" }
        ],
        "insights": "summary insight, 2-3 sentences max"
      }
      
      When assigning categories, use the following broad categories:
      - **Food**: Includes all items related to snacks, sandwiches, beverages, meals, groceries, and any other consumable food products.
      - **Electronics**: Includes gadgets, devices, appliances, and tech-related items.
      - **Clothing**: Includes apparel, clothes, accessories, footwear, and any wearable items.
      - **Health**: Covers health-related products, supplements, medicines, and personal care items.
      - **Office Supplies**: Includes items like pens, paper, stationery, and any office-related supplies.
      - **Home Essentials**: Items related to household needs, furniture, cleaning supplies, and general home goods.
      - **Entertainment**: Includes books, movies, games, subscriptions, or anything meant for leisure.
      - **Other**: If the item does not fit into any of the above categories, use "other".
  
      Always assign an item to the most relevant broad category, and use "other" only when absolutely no match can be found.
  
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

      const jsonMatch = responseText.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error(
          'Failed to locate JSON structure in Together AI response.',
        );
      }

      const insights = JSON.parse(jsonMatch[0]);
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

  async getInsights() {
    return await this.fileModel.find({}, { rawTextractResponse: 0 });
  }

  async getCollectiveInsights() {
    const [
      basicSpend,
      categorySpend,
      itemFrequency,
      avgSpendPerCategory,
      monthlySpend,
    ] = await Promise.all([
      // Basic Spend Aggregation
      this.fileModel.aggregate([
        {
          $group: {
            _id: null,
            totalSpend: {
              $sum: {
                $toDouble: {
                  $cond: {
                    if: { $eq: [{ $type: '$total' }, 'string'] },
                    then: {
                      $replaceAll: {
                        input: '$total',
                        find: '£',
                        replacement: '',
                      },
                    },
                    else: '$total',
                  },
                },
              },
            },
            avgSpend: {
              $avg: {
                $toDouble: {
                  $cond: {
                    if: { $eq: [{ $type: '$total' }, 'string'] },
                    then: {
                      $replaceAll: {
                        input: '$total',
                        find: '£',
                        replacement: '',
                      },
                    },
                    else: '$total',
                  },
                },
              },
            },
            highestSpend: {
              $max: {
                $toDouble: {
                  $cond: {
                    if: { $eq: [{ $type: '$total' }, 'string'] },
                    then: {
                      $replaceAll: {
                        input: '$total',
                        find: '£',
                        replacement: '',
                      },
                    },
                    else: '$total',
                  },
                },
              },
            },
            lowestSpend: {
              $min: {
                $toDouble: {
                  $cond: {
                    if: { $eq: [{ $type: '$total' }, 'string'] },
                    then: {
                      $replaceAll: {
                        input: '$total',
                        find: '£',
                        replacement: '',
                      },
                    },
                    else: '$total',
                  },
                },
              },
            },
          },
        },
      ]),

      // Category Spend Aggregation
      this.fileModel.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.category',
            totalCategorySpend: {
              $sum: {
                $toDouble: {
                  $cond: {
                    if: { $eq: [{ $type: '$items.price' }, 'string'] },
                    then: {
                      $replaceAll: {
                        input: '$items.price',
                        find: '£',
                        replacement: '',
                      },
                    },
                    else: '$items.price',
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            categories: {
              $push: { category: '$_id', spend: '$totalCategorySpend' },
            },
            grandTotalSpend: { $sum: '$totalCategorySpend' },
          },
        },
        { $unwind: '$categories' },
        {
          $project: {
            category: '$categories.category',
            categorySpend: '$categories.spend',
            spendPercentage: {
              $cond: {
                if: { $eq: ['$grandTotalSpend', 0] },
                then: 0,
                else: {
                  $multiply: [
                    { $divide: ['$categories.spend', '$grandTotalSpend'] },
                    100,
                  ],
                },
              },
            },
          },
        },
        { $sort: { categorySpend: -1 } },
      ]),

      // Item Frequency Aggregation
      this.fileModel.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.item',
            frequency: { $sum: 1 },
          },
        },
        { $sort: { frequency: -1 } },
        { $limit: 10 },
      ]),

      // Average Spend Per Category
      this.fileModel.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.category',
            averageSpendInCategory: {
              $avg: {
                $toDouble: {
                  $cond: {
                    if: { $eq: [{ $type: '$items.price' }, 'string'] },
                    then: {
                      $replaceAll: {
                        input: '$items.price',
                        find: '£',
                        replacement: '',
                      },
                    },
                    else: '$items.price',
                  },
                },
              },
            },
          },
        },
        { $sort: { averageSpendInCategory: -1 } },
      ]),

      // Monthly Spend Aggregation
      this.fileModel.aggregate([
        {
          $group: {
            _id: {
              month: { $month: '$date' },
              year: { $year: '$date' },
            },
            monthlySpend: {
              $sum: {
                $toDouble: {
                  $cond: {
                    if: { $eq: [{ $type: '$total' }, 'string'] },
                    then: {
                      $replaceAll: {
                        input: '$total',
                        find: '£',
                        replacement: '',
                      },
                    },
                    else: '$total',
                  },
                },
              },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    return {
      totalSpend: basicSpend[0]?.totalSpend || 0,
      averageSpend: basicSpend[0]?.avgSpend || 0,
      highestSpend: basicSpend[0]?.highestSpend || 0,
      lowestSpend: basicSpend[0]?.lowestSpend || 0,
      categorySpendDistribution: categorySpend,
      frequentItems: itemFrequency,
      avgSpendPerCategory: avgSpendPerCategory,
      monthlySpendTrend: monthlySpend,
    };
  }
}
