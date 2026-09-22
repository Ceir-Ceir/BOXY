export type Params = {
  mkt: number; cac: number; org: number; churn: number; contrib: number; initdep: number; redeem: number;
  ret: number; mgmt: number; fundfix: number; fundvar: number; cap: number; platfee: number; opex: number; launch: number;
  target: number; tmonth: number; horizon: number;
};
export type Row = {
  m: number; newU: number; users: number; contributors: number; contrib: number; gross: number; fundExp: number; waiver: number; redeem: number;
  aum: number; capital: number; growth: number; rev: number; cost: number; net: number; cash: number; mgmtFee: number;
};

export const PRESETS: Record<string, { label: string; p: Params }> = {
  robinhood: { label: "Robinhood CAC", p: { mkt: 500000, cac: 20, org: 2, churn: 2, contrib: 200, initdep: 250, redeem: 3, ret: 8, mgmt: 0.95, fundfix: 400000, fundvar: 0.35, cap: 2.5, platfee: 0, opex: 75000, launch: 400000, target: 100000000, tmonth: 6, horizon: 36 } },
  fintech: { label: "Realistic fintech", p: { mkt: 500000, cac: 150, org: 3, churn: 2.5, contrib: 200, initdep: 250, redeem: 3, ret: 8, mgmt: 0.95, fundfix: 400000, fundvar: 0.35, cap: 2.5, platfee: 2, opex: 75000, launch: 400000, target: 100000000, tmonth: 6, horizon: 36 } },
  lean: { label: "Lean launch", p: { mkt: 100000, cac: 80, org: 4, churn: 2, contrib: 200, initdep: 250, redeem: 3, ret: 8, mgmt: 0.95, fundfix: 250000, fundvar: 0.35, cap: 2.5, platfee: 2, opex: 40000, launch: 250000, target: 100000000, tmonth: 24, horizon: 60 } },
};

export const FIELDS: { key: keyof Params; label: string; min: number; max: number; step: number; group: string; hint?: string }[] = [
  { key: "mkt", label: "Marketing spend / month ($)", min: 0, max: 2000000, step: 10000, group: "Users & acquisition" },
  { key: "cac", label: "Customer acquisition cost ($)", min: 5, max: 500, step: 1, group: "Users & acquisition", hint: "Robinhood: ~$53 (2019) → ~$20 (2020) → ~$15 (Q1 2021). Those bought a free account, not a $200/mo commitment." },
  { key: "org", label: "Organic / referral growth (% of users / mo)", min: 0, max: 15, step: 0.5, group: "Users & acquisition" },
  { key: "churn", label: "Stop-contributing rate (% / mo)", min: 0, max: 10, step: 0.5, group: "Users & acquisition", hint: "Money stays locked; they just stop the monthly deposit." },
  { key: "contrib", label: "Avg monthly contribution ($)", min: 25, max: 1000, step: 5, group: "Contributions" },
  { key: "initdep", label: "Avg opening deposit ($)", min: 0, max: 5000, step: 50, group: "Contributions" },
  { key: "redeem", label: "Early redemptions (% of AUM / yr)", min: 0, max: 20, step: 0.5, group: "Contributions", hint: "Interval funds must offer 5–25% quarterly repurchase; this is what actually leaves." },
  { key: "ret", label: "Gross portfolio return (% / yr)", min: -10, max: 20, step: 0.5, group: "Returns & fund fees" },
  { key: "mgmt", label: "Management fee (% of AUM / yr) → us", min: 0, max: 2.5, step: 0.05, group: "Returns & fund fees", hint: "Cliffwater charges 0.95%." },
  { key: "fundfix", label: "Fund fixed costs ($ / yr)", min: 0, max: 1500000, step: 10000, group: "Returns & fund fees", hint: "Audit, admin, custody, TA, board, fund CCO — paid by the fund regardless of size." },
  { key: "fundvar", label: "Fund variable costs (% of AUM / yr)", min: 0, max: 2, step: 0.05, group: "Returns & fund fees" },
  { key: "cap", label: "Expense cap (% / yr)", min: 0.5, max: 4, step: 0.1, group: "Returns & fund fees", hint: "Total expense ratio shown to users. Above it, we reimburse the fund (the waiver). Cliffwater-type funds land at 2.0–2.5% before leverage." },
  { key: "platfee", label: "Platform fee ($ / active user / mo)", min: 0, max: 10, step: 0.5, group: "Management company", hint: "Acorns-style subscription. $0 = fund fee only." },
  { key: "opex", label: "Team + tech + compliance ($ / mo)", min: 0, max: 500000, step: 5000, group: "Management company" },
  { key: "launch", label: "One-time launch cost ($)", min: 0, max: 1500000, step: 25000, group: "Management company" },
  { key: "target", label: "Target AUM ($)", min: 10000000, max: 1000000000, step: 10000000, group: "Target & horizon" },
  { key: "tmonth", label: "Target month", min: 1, max: 60, step: 1, group: "Target & horizon" },
  { key: "horizon", label: "Horizon (months)", min: 12, max: 120, step: 6, group: "Target & horizon" },
];

export function simulate(p: Params): Row[] {
  const rows: Row[] = [];
  let aum = 0, contributors = 0, users = 0, cumContrib = 0, cumRedeem = 0, cash = -p.launch;
  for (let m = 1; m <= p.horizon; m++) {
    const newU = (p.cac > 0 ? p.mkt / p.cac : 0) + users * (p.org / 100);
    contributors = contributors * (1 - p.churn / 100) + newU;
    users += newU;
    const contrib = contributors * p.contrib + newU * p.initdep;
    const aumStart = aum;
    const gross = aumStart * (p.ret / 100 / 12);
    const redeem = aumStart * (p.redeem / 100 / 12);
    const mgmtFee = aumStart * (p.mgmt / 100 / 12);
    const other = p.fundfix / 12 + aumStart * (p.fundvar / 100 / 12);
    const allowed = aumStart * (p.cap / 100 / 12);
    const waiver = Math.max(0, mgmtFee + other - allowed);
    const fundExp = mgmtFee + other - waiver;
    aum = aumStart + contrib + gross - fundExp - redeem;
    cumContrib += contrib; cumRedeem += redeem;
    const rev = mgmtFee + contributors * p.platfee;
    const cost = p.mkt + p.opex + waiver;
    const net = rev - cost; cash += net;
    rows.push({ m, newU, users, contributors, contrib, gross, fundExp, waiver, redeem, aum, capital: cumContrib - cumRedeem, growth: aum - (cumContrib - cumRedeem), rev, cost, net, cash, mgmtFee });
  }
  return rows;
}

export function required(p: Params) {
  const T = p.tmonth;
  const perUser = p.contrib * (T + 1) / 2 + p.initdep;
  const users = perUser > 0 ? p.target / perUser : 0;
  return { users, perUser, spend: users * p.cac, perMonth: users / T, mktPerMonth: (users * p.cac) / T };
}
