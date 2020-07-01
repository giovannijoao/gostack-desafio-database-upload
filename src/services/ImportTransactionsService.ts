import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import Category from '../models/Category';

interface Request {
  filename: string;
}

interface ImportedTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    const csvFilePath = path.join(uploadConfig.directory, filename);
    const readCSVStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const parseCSV = readCSVStream.pipe(parseStream);

    const categories: string[] = []; // To save used categories.
    const transactions: ImportedTransaction[] = []; // Collection to save all transactions to save later in database.

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      if (!categories.includes(category)) categories.push(category); // Map all used categories
      transactions.push({
        // Save to process later.
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const foundCategories = await Promise.all(
      categories.map(async category_title => {
        let category = await categoriesRepository.findOne({
          // Tries to find the category in database
          where: {
            title: category_title,
          },
        });
        if (!category) {
          // Creates the category if it doesn't exist
          category = categoriesRepository.create({
            title: category_title,
          });
          await categoriesRepository.save(category);
        }
        return category;
      }),
    );

    const parsedTransactions = transactions.map(
      ({ title, type, value, category: category_title }) => {
        const category = foundCategories.find(c => c.title === category_title);
        return transactionsRepository.create({
          category,
          title,
          value,
          type,
        });
      },
    );

    await transactionsRepository.save(parsedTransactions);

    return parsedTransactions;
  }
}

export default ImportTransactionsService;
