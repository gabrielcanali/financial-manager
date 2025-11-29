<script setup>
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useFinanceUi } from "../composables/useFinanceUi";

const ui = useFinanceUi();
const router = useRouter();

watch(
  () => ui.store.statusLoaded && ui.store.hasBase,
  (ready) => {
    if (ready) {
      router.replace({ name: "dashboard" });
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel space-y-4 p-6">
      <p class="text-sm uppercase text-slate-400">Onboarding / Front V2</p>
      <h1 class="text-2xl font-semibold text-slate-50">
        Bem-vindo! Vamos preparar sua base local.
      </h1>
      <p class="text-sm text-slate-400">
        Navegacao so fica liberada apos carregar ou criar um JSON. Valide o arquivo ou gere uma base nova com as configuracoes iniciais de fatura e adiantamento.
      </p>
      <div class="flex flex-wrap gap-2 text-xs text-slate-300">
        <span class="pill bg-white/5">Status: {{ ui.store.message }}</span>
        <span
          v-if="ui.store.error"
          class="pill border border-rose-500/30 bg-rose-500/15 text-rose-100"
        >
          Erro: {{ ui.store.error }}
        </span>
      </div>
      <div class="flex flex-wrap gap-3">
        <button class="btn" @click="ui.store.bootstrap" :disabled="ui.store.loading">
          Checar novamente
        </button>
        <span class="text-xs text-slate-400">
          Configure o fechamento da fatura e (opcionalmente) o adiantamento antes de gerar a base.
        </span>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase text-slate-400">Nova base</p>
            <p class="text-lg font-semibold text-slate-50">Criar JSON vazio</p>
          </div>
          <span class="pill bg-white/5">Passo 1</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1 sm:col-span-2">
            <p class="text-xs uppercase text-slate-400">Fechamento da fatura (dia)</p>
            <input
              v-model="ui.onboardingForm.fechamento_fatura_dia"
              type="number"
              min="1"
              max="31"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                v-model="ui.onboardingForm.adiantamento_habilitado"
                class="accent-accent"
              />
              Habilitar adiantamento de salario
            </label>
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Dia do adiantamento</p>
            <input
              v-model="ui.onboardingForm.adiantamento_dia"
              type="number"
              min="1"
              max="31"
              :disabled="!ui.onboardingForm.adiantamento_habilitado"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">% adiantado</p>
            <input
              v-model="ui.onboardingForm.adiantamento_percentual"
              type="number"
              min="1"
              max="100"
              step="1"
              :disabled="!ui.onboardingForm.adiantamento_habilitado"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <div
          v-if="ui.onboardingErrors.length"
          class="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100"
        >
          <p class="font-semibold">Ajuste para continuar:</p>
          <ul class="list-disc pl-4">
            <li v-for="err in ui.onboardingErrors" :key="err">{{ err }}</li>
          </ul>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="btn" @click="ui.handleCreateBase" :disabled="ui.store.adminLoading">
            Criar base vazia
          </button>
          <button
            class="btn"
            @click="ui.store.bootstrap"
            :disabled="ui.store.loading || ui.store.adminLoading"
          >
            Recarregar status
          </button>
        </div>
      </div>

      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase text-slate-400">Importar JSON</p>
            <p class="text-lg font-semibold text-slate-50">Validar e carregar</p>
          </div>
          <span class="pill bg-white/5">Passo 2</span>
        </div>
        <p class="text-sm text-slate-400">
          Valide seu arquivo antes de enviar para a API. Aceitamos o export atual com anos/meses, apartamento e configuracoes.
        </p>
        <label class="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" v-model="ui.importWithBackup" class="accent-accent" />
          Fazer backup automatico antes de substituir
        </label>
        <label class="btn w-full cursor-pointer justify-between" for="import-file-onboarding">
          <span>Selecionar arquivo</span>
          <input
            id="import-file-onboarding"
            type="file"
            accept="application/json"
            class="hidden"
            @change="ui.handleImport"
          />
        </label>
        <div class="rounded-lg border border-white/10 bg-white/5 p-4">
          <p class="text-sm font-semibold text-slate-50">Validacao</p>
          <p class="text-xs text-slate-400">
            {{ ui.store.importFeedback?.message || "Nenhum arquivo lido ainda." }}
          </p>
          <ul
            v-if="ui.store.importFeedback?.warnings?.length"
            class="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-200"
          >
            <li v-for="warn in ui.store.importFeedback.warnings" :key="warn">
              {{ warn }}
            </li>
          </ul>
          <ul
            v-if="ui.store.importFeedback?.errors?.length"
            class="mt-2 list-disc space-y-1 pl-4 text-xs text-rose-200"
          >
            <li v-for="err in ui.store.importFeedback.errors" :key="err">
              {{ err }}
            </li>
          </ul>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              class="btn"
              :disabled="!ui.store.importFeedback?.ok || ui.store.adminLoading"
              @click="ui.runImportToApi"
            >
              Importar e substituir
            </button>
            <button
              class="btn"
              @click="ui.store.bootstrap"
              :disabled="ui.store.loading || ui.store.adminLoading"
            >
              Voltar para status
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
