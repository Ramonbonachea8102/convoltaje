import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'activo' | 'pasivo' | 'capital' | 'ingreso' | 'gasto';
  subtype: string;
  isActive: boolean;
}

export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  concept: string;
  type: 'ingreso' | 'gasto_obra' | 'gasto_fijo' | 'comision';
  reference?: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  paymentMethod: string;
  originalAmount: number;
  originalCurrency: 'USD' | 'MLC' | 'CUP';
  associatedCommercial?: string;
  status: 'completado' | 'pendiente';
}

export interface PaymentEntry {
  id: string;
  date: string;
  dealId?: string;
  otRef?: string;
  clientName?: string;
  amount: number;
  currency: 'USD' | 'MLC' | 'CUP';
  paymentMethod: string;
  status: 'en_revision' | 'confirmado' | 'rechazado';
  screenshotUrl?: string;
  notes?: string;
  reviewerId?: string;
  confirmedAt?: string;
}

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-cash-usd', code: '1.1.1', name: 'Caja USD', type: 'activo', subtype: 'Efectivo', isActive: true },
  { id: 'acc-cash-cup', code: '1.1.2', name: 'Caja CUP', type: 'activo', subtype: 'Efectivo', isActive: true },
  { id: 'acc-bank-zelle', code: '1.1.3', name: 'Banco Zelle', type: 'activo', subtype: 'Bancos', isActive: true },
  { id: 'acc-bank-mlc', code: '1.1.4', name: 'Banco MLC', type: 'activo', subtype: 'Bancos', isActive: true },
  { id: 'acc-cxc', code: '1.2.1', name: 'Clientes por Cobrar', type: 'activo', subtype: 'Cuentas por Cobrar', isActive: true },
  { id: 'acc-cxp-commissions', code: '2.1.1', name: 'Comisiones por Pagar', type: 'pasivo', subtype: 'Cuentas por Pagar', isActive: true },
  { id: 'acc-cxp-suppliers', code: '2.1.2', name: 'Proveedores', type: 'pasivo', subtype: 'Cuentas por Pagar', isActive: true },
  { id: 'acc-capital', code: '3.1.1', name: 'Capital Social', type: 'capital', subtype: 'Capital', isActive: true },
  { id: 'acc-retained', code: '3.2.1', name: 'Utilidades Retenidas', type: 'capital', subtype: 'Resultados', isActive: true },
  { id: 'acc-rev-systems', code: '4.1.1', name: 'Venta de Sistemas Solares', type: 'ingreso', subtype: 'Ventas', isActive: true },
  { id: 'acc-rev-install', code: '4.1.2', name: 'Servicios de Instalación', type: 'ingreso', subtype: 'Ventas', isActive: true },
  { id: 'acc-exp-materials', code: '5.1.1', name: 'Materiales y Componentes', type: 'gasto', subtype: 'Gastos de Obra', isActive: true },
  { id: 'acc-exp-transport', code: '5.1.2', name: 'Combustible y Transporte', type: 'gasto', subtype: 'Gastos de Obra', isActive: true },
  { id: 'acc-exp-meals', code: '5.1.3', name: 'Viáticos y Alimentación', type: 'gasto', subtype: 'Gastos de Obra', isActive: true },
  { id: 'acc-exp-salaries', code: '5.2.1', name: 'Salarios', type: 'gasto', subtype: 'Gastos Administrativos', isActive: true },
  { id: 'acc-exp-rent', code: '5.2.2', name: 'Alquiler Taller y Almacén', type: 'gasto', subtype: 'Gastos Administrativos', isActive: true },
  { id: 'acc-exp-advertising', code: '5.2.3', name: 'Publicidad y Marketing', type: 'gasto', subtype: 'Gastos Administrativos', isActive: true },
  { id: 'acc-exp-infra', code: '5.2.4', name: 'Infraestructura Cloud', type: 'gasto', subtype: 'Gastos Administrativos', isActive: true },
  { id: 'acc-exp-other', code: '5.2.5', name: 'Otros Gastos Operativos', type: 'gasto', subtype: 'Gastos Administrativos', isActive: true },
  { id: 'acc-exp-commissions', code: '5.3.1', name: 'Comisiones Comerciales', type: 'gasto', subtype: 'Comisiones', isActive: true },
];

function makeLine(id: string, accountId: string, debit: number, credit: number, description?: string): JournalLine {
  return { id, accountId, debit, credit, description };
}

function createJournalEntry(
  base: Omit<JournalEntry, 'id' | 'lines' | 'totalDebit' | 'totalCredit' | 'createdBy'>,
  lines: JournalLine[],
  createdBy = 'Sistema'
): JournalEntry {
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  return {
    ...base,
    id: `je-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    lines,
    totalDebit,
    totalCredit,
    createdBy,
  };
}

interface AccountingState {
  accounts: Account[];
  journalEntries: JournalEntry[];
  paymentEntries: PaymentEntry[];

  getAccount: (id: string) => Account | undefined;
  addAccount: (account: Omit<Account, 'id'>) => void;
  toggleAccountActive: (id: string) => void;

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'lines' | 'totalDebit' | 'totalCredit' | 'createdBy'>, lines: JournalLine[]) => void;
  recordPurchaseExpense: (itemName: string, totalCost: number, paymentAccountId?: string, createdBy?: string) => void;
  deleteJournalEntry: (id: string) => void;
  toggleJournalEntryStatus: (id: string) => void;

  addPaymentEntry: (payment: Omit<PaymentEntry, 'id'>) => void;
  confirmPaymentEntry: (id: string, reviewerId: string) => void;
  rejectPaymentEntry: (id: string, reviewerId: string, reason: string) => void;

  getBalance: (accountId: string) => number;
  getTotalRevenue: () => number;
  getTotalExpenses: () => number;
  getTotalCommissions: () => number;
  getTotalCommissionsPaid: () => number;
  getTotalCommissionsPending: () => number;
  getNetProfit: () => number;
}

function migrateFromLegacy(): JournalEntry[] {
  try {
    const raw = localStorage.getItem('convoltaje_transactions');
    if (!raw) return [];
    const txs = JSON.parse(raw);
    if (!Array.isArray(txs)) return [];
    return txs.map((tx: any, i: number): JournalEntry => {
      let lines: JournalLine[] = [];
      const ts = tx.date || new Date().toISOString().split('T')[0];
      const cashAccount = tx.originalCurrency === 'CUP' ? 'acc-cash-cup' : 'acc-cash-usd';

      if (tx.type === 'ingreso') {
        lines = [
          makeLine(`l-${i}-1`, cashAccount, tx.amount, 0, `Ingreso: ${tx.concept}`),
          makeLine(`l-${i}-2`, 'acc-rev-systems', 0, tx.amount, `Venta: ${tx.concept}`),
        ];
      } else if (tx.type === 'gasto_obra') {
        lines = [
          makeLine(`l-${i}-1`, 'acc-exp-materials', tx.amount, 0, `Gasto: ${tx.concept}`),
          makeLine(`l-${i}-2`, cashAccount, 0, tx.amount, `Pago: ${tx.concept}`),
        ];
      } else if (tx.type === 'comision') {
        if (tx.status === 'completado') {
          lines = [
            makeLine(`l-${i}-1`, 'acc-exp-commissions', tx.amount, 0, `Comisión pagada: ${tx.concept}`),
            makeLine(`l-${i}-2`, cashAccount, 0, tx.amount, `Pago comisión: ${tx.concept}`),
          ];
        } else {
          lines = [
            makeLine(`l-${i}-1`, 'acc-exp-commissions', tx.amount, 0, `Comisión devengada: ${tx.concept}`),
            makeLine(`l-${i}-2`, 'acc-cxp-commissions', 0, tx.amount, `Pendiente: ${tx.concept}`),
          ];
        }
      } else {
        lines = [
          makeLine(`l-${i}-1`, 'acc-exp-materials', tx.amount, 0, tx.concept),
          makeLine(`l-${i}-2`, cashAccount, 0, tx.amount, tx.concept),
        ];
      }

      return {
        id: `je-migrated-${tx.id || i}`,
        date: ts,
        concept: tx.concept,
        type: tx.type,
        paymentMethod: tx.paymentMethod || 'Efectivo',
        originalAmount: tx.originalAmount || tx.amount,
        originalCurrency: tx.originalCurrency || 'USD',
        associatedCommercial: tx.associatedCommercial,
        status: tx.status || 'completado',
        lines,
        totalDebit: lines.reduce((s, l) => s + l.debit, 0),
        totalCredit: lines.reduce((s, l) => s + l.credit, 0),
        createdBy: 'Migración',
      };
    });
  } catch {
    return [];
  }
}

export const useAccountingStore = create<AccountingState>()(
  persist(
    (set, get) => ({
      accounts: DEFAULT_ACCOUNTS,
      journalEntries: migrateFromLegacy(),
      paymentEntries: [],

      getAccount: (id) => get().accounts.find(a => a.id === id),

      addAccount: (account) => set((state) => ({
        accounts: [...state.accounts, { ...account, id: `acc-${Date.now()}` }],
      })),

      toggleAccountActive: (id) => set((state) => ({
        accounts: state.accounts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a),
      })),

      addJournalEntry: (base, lines) => set((state) => ({
        journalEntries: [createJournalEntry(base, lines), ...state.journalEntries],
      })),

      recordPurchaseExpense: (itemName, totalCost, paymentAccountId = 'acc-cash-usd', createdBy = 'Comprador') => {
        const lines: JournalLine[] = [
          makeLine(`l-pur-${Date.now()}-1`, 'acc-exp-materials', totalCost, 0, `Compra inventario: ${itemName}`),
          makeLine(`l-pur-${Date.now()}-2`, paymentAccountId, 0, totalCost, `Pago compra: ${itemName}`)
        ];

        const baseEntry: Omit<JournalEntry, 'id' | 'lines' | 'totalDebit' | 'totalCredit' | 'createdBy'> = {
          date: new Date().toISOString().split('T')[0],
          concept: `Compra de mercancía: ${itemName}`,
          type: 'gasto_obra',
          paymentMethod: 'Efectivo/Transferencia',
          originalAmount: totalCost,
          originalCurrency: 'USD',
          status: 'completado'
        };

        set((state) => ({
          journalEntries: [createJournalEntry(baseEntry, lines, createdBy), ...state.journalEntries]
        }));
      },

      deleteJournalEntry: (id) => set((state) => ({
        journalEntries: state.journalEntries.filter(je => je.id !== id),
      })),

      toggleJournalEntryStatus: (id) => set((state) => ({
        journalEntries: state.journalEntries.map(je =>
          je.id === id ? { ...je, status: je.status === 'completado' ? 'pendiente' : 'completado' } : je
        ),
      })),

      addPaymentEntry: (payment) => set((state) => ({
        paymentEntries: [{ ...payment, id: `pe-${Date.now()}` }, ...state.paymentEntries],
      })),

      confirmPaymentEntry: (id, reviewerId) => set((state) => ({
        paymentEntries: state.paymentEntries.map(pe =>
          pe.id === id ? { ...pe, status: 'confirmado', reviewerId, confirmedAt: new Date().toISOString() } : pe
        ),
      })),

      rejectPaymentEntry: (id, reviewerId, reason) => set((state) => ({
        paymentEntries: state.paymentEntries.map(pe =>
          pe.id === id ? { ...pe, status: 'rechazado', reviewerId, notes: reason } : pe
        ),
      })),

      getBalance: (accountId) => {
        const entries = get().journalEntries;
        let balance = 0;
        for (const je of entries) {
          for (const line of je.lines) {
            if (line.accountId === accountId) {
              balance += line.debit - line.credit;
            }
          }
        }
        return balance;
      },

      getTotalRevenue: () => {
        const entries = get().journalEntries;
        return entries
          .filter(je => je.type === 'ingreso' && je.status === 'completado')
          .reduce((sum, je) => sum + je.totalCredit, 0);
      },

      getTotalExpenses: () => {
        const entries = get().journalEntries;
        const expenses = entries.filter(je =>
          (je.type === 'gasto_obra' || je.type === 'gasto_fijo') && je.status === 'completado'
        );
        const commissions = entries.filter(je =>
          je.type === 'comision' && je.status === 'completado'
        );
        return expenses.reduce((sum, je) => sum + je.totalDebit, 0) +
               commissions.reduce((sum, je) => sum + je.totalDebit, 0);
      },

      getTotalCommissions: () => {
        return get().journalEntries
          .filter(je => je.type === 'comision')
          .reduce((sum, je) => sum + je.totalDebit, 0);
      },

      getTotalCommissionsPaid: () => {
        return get().journalEntries
          .filter(je => je.type === 'comision' && je.status === 'completado')
          .reduce((sum, je) => sum + je.totalDebit, 0);
      },

      getTotalCommissionsPending: () => {
        return get().journalEntries
          .filter(je => je.type === 'comision' && je.status === 'pendiente')
          .reduce((sum, je) => sum + je.totalDebit, 0);
      },

      getNetProfit: () => {
        return get().getTotalRevenue() - get().getTotalExpenses();
      },
    }),
    {
      name: 'convoltaje-accounting-store',
    }
  )
);
