import { defineStore } from "pinia";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.origin.startsWith("file:")
    ? "http://localhost:3000/api"
    : "/api");

function normalizeYear(year) {
  return String(year || "").padStart(4, "0").slice(-4);
}

function normalizeMonth(month) {
  return String(month || "").padStart(2, "0").slice(-2);
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export const useFinanceStore = defineStore("finance", {
  state: () => ({
    year: normalizeYear(new Date().getFullYear()),
    month: normalizeMonth(new Date().getMonth() + 1),
    monthsAvailable: [],
    yearSummary: null,
    monthSummary: null,
    monthData: null,
    apartmentEvolution: null,
    loading: false,
    adminLoading: false,
    message: "Inicializando painel",
    error: "",
    importFeedback: null,
    importPayload: null,
  }),
  getters: {
    entries: (state) => state.monthData?.entradas_saidas || [],
    preRecurrents: (state) =>
      state.monthData?.contas_recorrentes_pre_fatura || [],
    postRecurrents: (state) =>
      state.monthData?.contas_recorrentes_pos_fatura || [],
    savingsMovements: (state) => state.monthData?.poupanca?.movimentos || [],
    loansMade: (state) => state.monthData?.emprestimos?.feitos || [],
    loansReceived: (state) => state.monthData?.emprestimos?.recebidos || [],
  },
  actions: {
    setYear(year) {
      this.year = normalizeYear(year);
    },
    setMonth(month) {
      this.month = normalizeMonth(month);
    },
    async bootstrap() {
      await this.fetchYearSummary(this.year);
    },
    async api(path, { method = "GET", body, headers } = {}) {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          "Content-Type": body ? "application/json" : undefined,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const isEmpty = res.status === 204;
      const payload = isEmpty ? null : await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          payload?.error ||
          (payload?.errors ? payload.errors.join(", ") : res.statusText);
        throw new Error(msg || "Falha ao comunicar com a API");
      }
      return payload;
    },
    async fetchYearSummary(year = this.year) {
      this.loading = true;
      this.error = "";
      this.message = `Carregando resumo anual ${year}...`;
      try {
        const summary = await this.api(`/years/${year}/summary`);
        this.yearSummary = summary;
        this.monthsAvailable = summary.meses_disponiveis || [];
        if (!this.monthsAvailable.includes(this.month) && this.monthsAvailable.length) {
          this.month = this.monthsAvailable[0];
        }
        await this.fetchMonth(this.month);
        await this.fetchApartmentEvolution();
        this.message = "Painel atualizado";
      } catch (err) {
        this.error = err.message;
        this.message = "Erro ao carregar ano";
      } finally {
        this.loading = false;
      }
    },
    async fetchMonth(month = this.month) {
      this.loading = true;
      this.error = "";
      this.message = `Sincronizando ${this.year}-${month}...`;
      try {
        const [summary, data] = await Promise.all([
          this.api(`/months/${this.year}/${month}/summary`),
          this.api(`/months/${this.year}/${month}`),
        ]);
        this.monthSummary = summary;
        this.monthData = data;
        this.message = "Mes sincronizado";
      } catch (err) {
        this.error = err.message;
        this.message = "Erro ao carregar mes";
      } finally {
        this.loading = false;
      }
    },
    async fetchApartmentEvolution() {
      try {
        this.apartmentEvolution = await this.api(
          `/apartment/evolution?year=${this.year}`
        );
      } catch (err) {
        this.apartmentEvolution = { combinada: [] };
      }
    },
    async refreshAll() {
      await this.fetchYearSummary(this.year);
    },
    async createEntry(payload, { generateFuture = false } = {}) {
      const query = generateFuture ? "?generateFuture=true" : "";
      await this.api(
        `/months/${this.year}/${this.month}/entries${query}`,
        { method: "POST", body: payload }
      );
      await this.fetchMonth();
    },
    async updateEntry(id, payload, { cascade = false } = {}) {
      const query = cascade ? "?cascade=true" : "";
      await this.api(
        `/months/${this.year}/${this.month}/entries/${id}${query}`,
        { method: "PUT", body: payload }
      );
      await this.fetchMonth();
    },
    async deleteEntry(id) {
      await this.api(
        `/months/${this.year}/${this.month}/entries/${id}`,
        { method: "DELETE" }
      );
      await this.fetchMonth();
    },
    async createRecurring(payload, { period, generateFuture = false } = {}) {
      const query = generateFuture ? "?generateFuture=true" : "";
      await this.api(
        `/months/${this.year}/${this.month}/recurrents/${period}${query}`,
        { method: "POST", body: payload }
      );
      await this.fetchMonth();
    },
    async updateRecurring(id, payload, { period, cascade = false } = {}) {
      const query = cascade ? "?cascade=true" : "";
      await this.api(
        `/months/${this.year}/${this.month}/recurrents/${period}/${id}${query}`,
        { method: "PUT", body: payload }
      );
      await this.fetchMonth();
    },
    async deleteRecurring(id, { period } = {}) {
      await this.api(
        `/months/${this.year}/${this.month}/recurrents/${period}/${id}`,
        { method: "DELETE" }
      );
      await this.fetchMonth();
    },
    async saveSavings(movements) {
      await this.api(
        `/months/${this.year}/${this.month}/savings`,
        { method: "PUT", body: { movimentos: movements } }
      );
      await this.fetchMonth();
    },
    async saveLoans({ feitos, recebidos }) {
      await this.api(
        `/months/${this.year}/${this.month}/loans`,
        { method: "PUT", body: { feitos, recebidos } }
      );
      await this.fetchMonth();
    },
    async exportSnapshot() {
      if (!this.monthsAvailable.length) return;
      const monthsPayload = {};
      for (const m of this.monthsAvailable) {
        monthsPayload[m] = await this.api(`/months/${this.year}/${m}`).catch(
          (err) => ({ error: err.message })
        );
      }
      const payload = {
        exported_at: new Date().toISOString(),
        year: this.year,
        months: monthsPayload,
        year_summary: this.yearSummary,
        apartment_evolution: this.apartmentEvolution,
      };
      this.downloadJson(payload, `financial-manager-${this.year}.json`);
    },
    async exportFromApi() {
      this.adminLoading = true;
      this.message = "Exportando via API...";
      try {
        const payload = await this.api("/admin/export");
        this.downloadJson(payload.db, `financeiro-export-${this.year}.json`);
        this.message = "Export concluido";
      } catch (err) {
        this.error = err.message;
        this.message = "Falha ao exportar";
      } finally {
        this.adminLoading = false;
      }
    },
    async backupServer() {
      this.adminLoading = true;
      this.message = "Gerando backup no servidor...";
      try {
        const result = await this.api("/admin/backup", {
          method: "POST",
          body: {},
        });
        this.message = `Backup criado em ${result.file}`;
      } catch (err) {
        this.error = err.message;
        this.message = "Falha ao gerar backup";
      } finally {
        this.adminLoading = false;
      }
    },
    async parseImportFile(file) {
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        const months = parsed?.months ? Object.keys(parsed.months).length : 0;
        this.importPayload = parsed;
        this.importFeedback = {
          ok: true,
          message: `Arquivo lido (${months} meses / ano ${parsed.year || "?"}).`,
        };
      } catch (err) {
        this.importPayload = null;
        this.importFeedback = {
          ok: false,
          message: "JSON invalido ou corrompido.",
        };
      }
    },
    async sendImportToApi() {
      if (!this.importPayload) return;
      this.adminLoading = true;
      this.message = "Enviando JSON para API...";
      try {
        await this.api("/admin/import", {
          method: "POST",
          body: this.importPayload,
        });
        this.message = "Import concluida. Recarregando painel...";
        await this.refreshAll();
      } catch (err) {
        this.error = err.message;
        this.message = "Falha ao importar JSON";
      } finally {
        this.adminLoading = false;
      }
    },
    downloadJson(payload, filename) {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    sum(list = []) {
      return list.reduce((acc, item) => acc + safeNumber(item.valor), 0);
    },
  },
});
