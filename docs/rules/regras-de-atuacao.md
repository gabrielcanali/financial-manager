# Regras de Atuação do Agente

> Este documento define **como o agente deve atuar**, independentemente da tarefa.
> Ele é complementar às **Regras de Negócio** e serve para evitar decisões indevidas.

---

## 1. Fonte de Verdade
O agente deve considerar como **únicas fontes de verdade**:
- `docs/wiki/ideias.md`
- `docs/wiki/regras-de-negocio.md`
- `docs/wiki/modelos-json.md`

Qualquer outro arquivo (inclusive código existente) **não pode redefinir comportamento**.

---

## 2. Regra de Ouro
Se um comportamento **não estiver explicitamente definido** nos documentos de fonte de verdade:
- ❌ Não implementar
- 📝 Registrar como pendência

O agente **não pode assumir comportamento implícito**.

---

## 3. Escopo
O agente deve atuar **somente** dentro do escopo do MVP definido em `ideias.md`.

É proibido:
- Expandir escopo
- Antecipar funcionalidades futuras
- Criar automações inteligentes
- Criar integrações externas

---

## 4. Atuação por Etapas

### 4.1 Regra de granularidade
- Cada atuação deve resolver **uma única tarefa** do board
- Tarefas grandes devem ser quebradas antes da implementação

### 4.2 Ordem obrigatória de atuação
1. Ler tarefa em `docs/board/[0] TO-DO`
2. Mover para `DOING`
3. Implementar
4. Validar manualmente
5. Atualizar documentação (se necessário)
6. Registrar pendências
7. Mover para `DONE`

---

## 5. Uso de Modelos de IA

Cada atuação deve declarar explicitamente:
- Modelo utilizado
- Reasoning effort

O agente **não pode trocar o modelo por conta própria**.

---

## 6. Código

### 6.1 Princípios
- Código simples e legível
- Evitar abstrações prematuras
- Priorizar clareza sobre performance

### 6.2 Proibições
- Criar lógica “inteligente” não solicitada
- Criar sistemas genéricos demais
- Criar infra complexa no MVP

---

## 7. Documentação

- Sempre que uma decisão for tomada, verificar se:
  - já está documentada → ok
  - não está documentada → registrar pendência

O agente **não deve atualizar documentos de regras** sem autorização explícita.

---

## 8. Pendências

Pendências devem ser registradas em:
- `docs/pendencias.md`

Formato obrigatório:
- Título
- Contexto
- Opções possíveis
- Recomendação (sem implementar)

---

## 9. Critério de Sucesso da Atuação

Uma atuação é considerada bem-sucedida se:
- Respeitou o escopo
- Respeitou as regras de negócio
- Não criou comportamento implícito
- Não deixou pendências escondidas

---

## 10. Diretriz Final

> **Menos é melhor.**
>
> Se houver dúvida entre implementar algo agora ou esperar definição:
> **espere e registre como pendência**.