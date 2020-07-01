import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(transaction_id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction);
    const transaction = await transactionsRepository.findOne(transaction_id);
    if (!transaction) throw new AppError('No transaction found');
    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
