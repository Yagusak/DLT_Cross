'use strict';
const { Contract } = require('fabric-contract-api');

function txMs(ctx){
  const ts = ctx.stub.getTxTimestamp();
  const secs = (ts && ts.seconds && typeof ts.seconds.toNumber==='function') ? ts.seconds.toNumber() : Number(ts?.seconds||0);
  return secs*1000 + Math.floor((ts?.nanos||0)/1e6);
}


/* ===== helpers ===== */
const K = {
  esc: (id) => id,                    // сохраняем совместимость с существующими ключами
  bal: (a)  => `cfa:bal:${a}`,
  log: (ts,ref) => `log~${ts}~${ref}`
};
const enc = (o)=>Buffer.from(JSON.stringify(o));
async function getJSON(ctx,key,msg){const b=await ctx.stub.getState(key); if(!b||!b.length) throw new Error(msg); return JSON.parse(b.toString());}
async function putJSON(ctx,key,obj){await ctx.stub.putState(key, enc(obj));}
async function getNum(ctx,key){const b=await ctx.stub.getState(key); return b&&b.length ? Number(b.toString()) : 0;}
function txTimeMs(ctx){const ts=ctx.stub.getTxTimestamp(); return Number(ts.seconds)*1000 + Math.floor(ts.nanos/1e6);}

/* ===== auth ===== */
function assertOrgAdmin(ctx, msp='Org1MSP'){
  if(ctx.clientIdentity.getMSPID()!==msp) throw new Error('forbidden: msp');
  // допускаем как админов, так и client с attr hf.Type=admin
  const isAdmin = ctx.clientIdentity.assertAttributeValue && ctx.clientIdentity.assertAttributeValue('hf.Type','admin');
  if(!isAdmin) throw new Error('forbidden: not admin');
}

/* ===== Escrow ===== */
class PayEscrowContract extends Contract {
  constructor(){ super('pay-escrow'); }

  async CreateEscrow(ctx,id,buyer,seller,amountStr,currency){
    if(!id) throw new Error('id required');
    if(!buyer||!seller) throw new Error('buyer/seller required');
    const amount = Number(amountStr);
    if(!Number.isFinite(amount) || amount<=0) throw new Error('invalid amount');
    const ex = await ctx.stub.getState(K.esc(id)); if(ex&&ex.length) throw new Error(`escrow ${id} exists`);
    const now = txTimeMs(ctx);
    const esc = {Type:'Escrow',EscrowID:id,Buyer:buyer,Seller:seller,Amount:amount,Currency:currency,
      State:'INIT',Meta:{},CreatedAt:now,UpdatedAt:now};
    await putJSON(ctx,K.esc(id),esc);
    await ctx.stub.setEvent('EscrowCreated', enc({id}));
  }

  async ReadEscrow(ctx,id){
    return await getJSON(ctx,K.esc(id),`escrow ${id} not found`);
  }

  async ListEscrows(ctx){
    // простая итерация по всему диапазону и фильтр по наличию EscrowID
    const it = await ctx.stub.getStateByRange('', '');
    const out = [];
    for await (const kv of it){ try{
      const o = JSON.parse(kv.value.toString());
      if(o && (o.Type==='Escrow' || o.EscrowID)) out.push(o);
    } catch(e){ /* skip non-json */ } }
    return out;
  }

  async ReleaseEscrow(ctx,id){
    const esc = await getJSON(ctx,K.esc(id),`escrow ${id} not found`);
    if(esc.State!=='INIT') throw new Error('invalid state');
    // перевод средств buyer -> seller
    const bbKey=K.bal(esc.Buyer), sbKey=K.bal(esc.Seller);
    const bb=await getNum(ctx,bbKey), sb=await getNum(ctx,sbKey);
    if(bb < esc.Amount) throw new Error('insufficient');
    await ctx.stub.putState(bbKey, Buffer.from(String(bb - esc.Amount)));
    await ctx.stub.putState(sbKey, Buffer.from(String(sb + esc.Amount)));
    esc.State='RELEASED'; esc.UpdatedAt=txTimeMs(ctx);
    await putJSON(ctx,K.esc(id),esc);
    await ctx.stub.setEvent('EscrowReleased', enc({id,amount:esc.Amount}));
  }

  async CancelEscrow(ctx,id){
    const esc = await getJSON(ctx,K.esc(id),`escrow ${id} not found`);
    if(esc.State!=='INIT') throw new Error('invalid state');
    esc.State='CANCELED'; esc.UpdatedAt=txTimeMs(ctx);
    await putJSON(ctx,K.esc(id),esc);
    await ctx.stub.setEvent('EscrowCanceled', enc({id}));
  }
}

/* ===== Token (очень простой счет) ===== */
class CFATokenContract extends Contract {
  constructor(){ super('cfa-token'); }

  async Issue(ctx,amountStr,account){
    assertOrgAdmin(ctx); // только админ Org1
    const amount=Number(amountStr); if(!Number.isFinite(amount) || amount<=0) throw new Error('invalid amount');
    const k=K.bal(account); const cur=await getNum(ctx,k);
    await ctx.stub.putState(k, Buffer.from(String(cur+amount)));
    await ctx.stub.setEvent('TokenIssued', enc({account,amount}));
  }

  async Redeem(ctx,amountStr,account){
    assertOrgAdmin(ctx); // только админ Org1
    const amount=Number(amountStr); if(!Number.isFinite(amount) || amount<=0) throw new Error('invalid amount');
    const k=K.bal(account); const cur=await getNum(ctx,k);
    if(cur<amount) throw new Error('insufficient');
    await ctx.stub.putState(k, Buffer.from(String(cur-amount)));
    await ctx.stub.setEvent('TokenRedeemed', enc({account,amount}));
  }

  async BalanceOf(ctx,account){
    const k=K.bal(account); return {account, balance: await getNum(ctx,k)};
  }
}

/* ===== Audit ===== */


class AuditLogContract extends Contract {
  constructor(){ super('audit-log'); }

  async AppendLog(ctx, txType, ref, payloadJSON){
    const ts = txMs(ctx);                         // deterministic
    const key = `log~${ts}~${ref}`;
    const rec = { txType, ref, ts, payload: payloadJSON };
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(rec)));
    return rec;
  }

  async ListLogsByRef(ctx, ref){
    const it = await ctx.stub.getStateByRange('', '');
    const out = [];
    try {
      while (true) {
        const r = await it.next();
        if (r.value && r.value.key && r.value.key.includes(`~${ref}`)) {
          try { out.push(JSON.parse(r.value.value.toString())); } catch {}
        }
        if (r.done) break;
      }
    } finally {
      try { await it.close(); } catch {}
    }
    return out;
  }
}

module.exports.contracts = [ PayEscrowContract, CFATokenContract, AuditLogContract ];
