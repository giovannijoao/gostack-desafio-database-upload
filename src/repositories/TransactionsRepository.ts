import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const transactionsSummary = transactions.reduce(
      (a, c) => {
        const result = a;
        if (c.type === 'income') result.income += c.value;
        else result.outcome += c.value;
        return result;
      },
      {
        income: 0,
        outcome: 0,
      },
    );
    const balance: Balance = {
      total: transactionsSummary.income - transactionsSummary.outcome,
      income: transactionsSummary.income,
      outcome: transactionsSummary.outcome,
    };
    return balance;
  }
}

export default TransactionsRepository;
