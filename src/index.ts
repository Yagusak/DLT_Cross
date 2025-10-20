import { Context, Contract } from 'fabric-contract-api';

type Escrow = {
  EscrowID: string;
  Buyer: string;
  Seller: string;
  Amount: number;
  Currency: string;
  State: 'INIT'|'FUNDED'|'RELEASED'|'CANCELLED';
  CreatedAt: number;   // ms since epoch
  UpdatedAt: number;   // ms since epoch
  Meta: Record<string, unknown>;
};

const NS = 'escrow:';

async function getAll(ctx: Context): Promise<Escrow[]> {
  const it = await ctx.stub.getStateByRange(NS, NS.slice(0, -1) + '\uFFFF');
  const res: Escrow[] = [];
  try {
    // Iterator API не async-iterable: используем .next()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const r = await it.next();
      if (r.value && r.value.value) {
        const s = r.value.value.toString();
        res.push(JSON.parse(s));
      }
      if (r.done) break;
    }
  } finally {
    await it.close();
  }
  return res;
}

export class EscrowContract extends Contract {
  public constructor() { super('pay-escrow'); }

  async ListEscrows(ctx: Context): Promise<string> {
    const res = await getAll(ctx);
    return JSON.stringify(res);
  }

  async ReadEscrow(ctx: Context, escrowId: string): Promise<string> {
    const key = NS + escrowId;
    const buf = await ctx.stub.getState(key);
    if (!buf || buf.length === 0) {
      throw new Error(`escrow ${escrowId} not found`);
    }
    return buf.toString();
  }

  async CreateEscrow(ctx: Context, escrowId: string, buyer: string, seller: string, amount: string, currency: string): Promise<void> {
    const key = NS + escrowId;
    const exists = await ctx.stub.getState(key);
    if (exists && exists.length > 0) throw new Error(`escrow ${escrowId} already exists`);

    // детерминированные timestamp из заголовка транзакции
    const ts = ctx.stub.getTxTimestamp();
    const ms = Number(ts.seconds) * 1000 + Math.floor(ts.nanos / 1e6);

    const doc: Escrow = {
      EscrowID: escrowId,
      Buyer: buyer,
      Seller: seller,
      Amount: parseInt(amount, 10),
      Currency: currency,
      State: 'INIT',
      CreatedAt: ms,
      UpdatedAt: ms,
      Meta: {},
    };
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(doc)));
  }
}

export const contracts: any[] = [EscrowContract];
