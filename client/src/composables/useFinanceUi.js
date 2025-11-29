import { inject } from "vue";

const FINANCE_UI_KEY = "financeUi";

function useFinanceUi() {
  const ui = inject(FINANCE_UI_KEY, null);
  if (!ui) {
    throw new Error("Contexto financeUi nao encontrado. Verifique o provider no App.");
  }
  return ui;
}

export { FINANCE_UI_KEY, useFinanceUi };
