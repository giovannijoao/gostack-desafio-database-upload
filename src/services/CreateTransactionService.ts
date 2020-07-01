import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    category: category_title,
    title,
    type,
    value,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      const updatedTotal = balance.total - value; // Calculates who much the new total will be.
      if (updatedTotal < 0)
        throw new AppError(
          `You don't have enough balance to process this transaction`,
        );
    }
    const categoriesRepository = getRepository(Category);

    let category = await categoriesRepository.findOne({
      where: {
        title: category_title,
      },
    });
    if (!category) {
      category = categoriesRepository.create({
        title: category_title,
      });
      await categoriesRepository.save(category);
    }
    const transaction = transactionsRepository.create({
      category_id: category.id,
      title,
      type,
      value,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
