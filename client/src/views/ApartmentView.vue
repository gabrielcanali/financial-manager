<script setup>
import SimpleLineChart from "../components/SimpleLineChart.vue";
import { useFinanceUi } from "../composables/useFinanceUi";

const ui = useFinanceUi();
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-xs uppercase text-slate-400">Meu apartamento</p>
        <h2 class="text-xl font-semibold text-slate-50">Evolucao das parcelas</h2>
        <p class="text-xs text-slate-400">
          Visualizacao dedicada para a serie combinada de parcelas Caixa/Construtora, refletida nos resumos mensais e anuais.
        </p>
      </div>
      <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/dashboard">
        Voltar ao dashboard
      </RouterLink>
    </section>

    <section class="glass-panel space-y-4 p-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">Serie combinada</p>
          <p class="text-xs text-slate-400">
            {{ ui.store.apartmentEvolution?.combinada?.length || 0 }} pontos carregados para o ano {{ ui.store.year }}.
          </p>
        </div>
        <span class="pill bg-white/5">Atual {{ ui.store.year }}</span>
      </div>
      <SimpleLineChart
        gradient-id="apt-grad-ap-view"
        :points="ui.apartmentChart.points"
        :labels="ui.apartmentChart.labels"
        container-class="h-52 w-full"
        :height="200"
        from-color="#5eead4"
        to-color="#93c5fd"
        dot-color="#5eead4"
        empty-message="Sem serie de evolucao para o ano selecionado."
      />
      <div class="flex flex-wrap gap-3 text-xs text-slate-300">
        <span
          v-for="(label, idx) in ui.apartmentChart.labels"
          :key="idx"
          class="pill bg-white/5"
        >
          {{ label.ref }} - {{ ui.formatCurrency(label.value) }}
        </span>
        <span v-if="!ui.apartmentChart.labels.length" class="pill bg-white/5">Nenhum ponto carregado.</span>
      </div>
      <div class="rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
        <p class="font-semibold text-slate-100">Configuracao</p>
        <p class="text-slate-400">
          Rotas do modulo apartamento permanecem ativas e consolidadas nos resumos mensais/anuais. Dados refletem a API em {{ ui.store.year }}.
        </p>
      </div>
    </section>
  </div>
</template>
