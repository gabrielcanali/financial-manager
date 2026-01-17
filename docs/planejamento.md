# Planejamento do financial-manager

## Visao geral da ideia
- Painel financeiro local em JSON para estudo/uso pessoal, com importacao/exportacao simples e sem dependencia de backend externo publico.
- Organizacao anual/mensal com dados salariais, calendario, movimentacoes variaveis, recorrentes, poupanca, emprestimos e consolidado do apartamento para cada mes.

## Estado atual do repositorio
- API Express (`server/src/server.js`) com rotas `/api/months`, `/api/years` e `/api/apartment`, cobrindo CRUD de meses, resumo anual/mensal, poupanca, emprestimos e apartamento com validacoes de ano/mes, datas, valores e limites de parcela (1..36).
- Services de meses/anos fazem migracao de registros legados (gerando `id`/`serie_id`), reprocessam `total_liquido`, geram parcelas ou recorrencias futuras sob demanda e expoem agregadores usados pelos resumos; testes de service garantem os contratos basicos.
- Base JSON (`server/data/financeiro.json`) atualizada com poupanca/emprestimos e bloco de configuracoes; endpoints de admin (`/admin/export`, `/admin/import`, `/admin/backup`, `/admin/status`, `/admin/validate`, `/admin/bootstrap`) permitem operar o arquivo local com logs simples e validacoes antes de importar.
- Front-end foi resetado e reconstruido com Vite + Vue 3 + Tailwind + Pinia (`client/`), entregando navegacao ano/mes, consumo das rotas da API, CRUD de lancamentos/recorrentes/poupanca/emprestimos e formularios basicos para admin; layout, feedbacks visuais e graficos seguem sem refinamento.
- SPA utiliza vue-router e um layout unico com sidebar e breadcrumb simples; o guard de rota bloqueia acesso sem base carregada, mas ainda ha friccoes de UX (componentes placeholders, hierarquia visual inconsistente e ausencia de microfeedbacks).

## Alinhamento com a ideia
- Base tecnica e funcional (API + SPA) cobre o fluxo de dados do caderno de ideias: anos/meses, apartamento, recorrentes, poupanca e emprestimos.
- Onboarding e operacoes de admin ja permitem subir, validar e exportar a base local, garantindo o ciclo CRUD completo.
- UX segue crua: graficos, quick actions e cards ainda usam placeholders, nao ha iteracao de ergonomia e falta revisar nomenclaturas, responsividade e orientacao contextual.
- Nenhuma fase de UX refinada ou avancada foi executada; graficos inteligentes, sugestoes automaticas e quick actions inteligentes continuam no backlog.

## Estado do front reconstruido
- Estrutura principal: sidebar fixa, header com seletores de ano/mes, paginas para Dashboard, Mensal, Recorrentes, Emprestimos e Apartamento.
- Componentes compartilham formularios baseados em Tailwind, com validacoes alinhadas a API (datas do mes, valores limitados, terminologia de parcelas e recorrencias).
- Feedback atual limita-se a toasts genericos do store e loaders simples; nao ha onboarding guiado, estados vazios polidos, graficos refinados ou automacoes de UX.

## Roteiro de desenvolvimento e status
### Fases concluidas
1) **Fundacao e contrato de dados (concluida)**  
Schema em `docs/schema.md`, validacoes iniciais nas rotas e CRUD basico com testes para os services.

2) **Fluxo de meses e recorrencias (concluida)**  
Calculo de totais mensais, geracao de parcelas (1..36), cascade por `serie_id` e recorrencias com `termina_em`.

3) **Dashboard e resumos na API (concluida)**  
Agregadores mensais/anuais para variaveis, recorrentes, poupanca, emprestimos e apartamento, expondo `/months/:year/:month/summary` e `/years/:year/summary`.

4) **Modulo apartamento (concluida)**  
Rotas `GET/PUT /apartment/:year/:month` e `/apartment/evolution`, consolidando Caixa + Construtora nos resumos.

5) **Cliente web reconstruido (concluida)**  
SPA Vite + Vue 3 + Tailwind + Pinia reimplementada com navegacao ano/mes, CRUD de lancamentos/recorrentes/poupanca/emprestimos e operacoes de admin conectadas; UX propositalmente basica aguardando desk check.

### Fases planejadas (em aberto)
**Fase X - Desk Check Funcional e UX (em preparacao)**  
- Revisao modulo a modulo  
- Validacao de comportamento de telas  
- Levantamento de friccoes de UX  
- Registro de ajustes necessarios  
- Coleta de decisoes do usuario  
- Nenhuma implementacao nesta fase

**Fase 6 - UX Refinada (Ergonomia e Usabilidade) (nao iniciada)**  
- Correcao de acentuacao e nomenclaturas visuais  
- Revisao do seletor de mes/ano (input -> select/combobox)  
- Reorganizacao do seletor de periodo (header ou sidebar)  
- Simplificacao de formularios de data (informar apenas o dia quando aplicavel)  
- Automatizacao de entrada/saida (tipo define o sinal do valor)  
- Unificacao visual da tela de recorrentes (pre/pos fatura apenas no backend)  
- Ajustes de formularios conforme a ideia original  
- Ajustes gerais de layout, responsividade e repeticao visual  
- Comportamento automatico de onboarding quando nao existir JSON

**Fase 7 - Hardening e operacao (nao iniciada)**  
- Automatizar lint/testes (front e API) e smoke tests do store.  
- Endurecer rotas de admin/import/export/backup com logs claros e monitoracao basica.  
- Preparar seeds/snapshots para onboarding rapido e documentar procedimentos operacionais.

**Fase 8 - UX Avancada e Inteligencia (nao iniciada)**  
- Graficos avancados no dashboard  
- Sugestoes automatizadas (categorias, alertas, padroes)  
- Quick Actions inteligentes  
- Simulacoes e projecoes financeiras  
- Comportamentos derivados da timeline financeira  
- Analises automaticas com base nos dados existentes

## Priorizacao atual
- Consolidar o front reconstruido (testes manuais e checklist funcional) antes de qualquer melhoria visual.
- Preparar material de suporte (roteiros de teste, prints e definicoes de modulos) para executar a Fase X.
- Bloquear implementacoes de UX ate que o desk check registre os ajustes e decisoes do usuario.

## Backlog imediato e dependencias para o desk check
- Revisar JSON base para garantir dados cobrindo todos os modulos (variaveis, recorrentes, poupanca, emprestimos, apartamento).
- Listar criterios de aceite por modulo (Dashboard, Mensal, Recorrentes, Emprestimos, Apartamento, Admin/onboarding) a serem usados pelo proximo agente.
- Confirmar se endpoints criticos (`/admin/*`, `/months`, `/years`, `/apartment`) estao acessiveis no ambiente local e documentar eventuais passos extras (ex.: seeds manuais).
