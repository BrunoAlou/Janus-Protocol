description: 'Description of the custom chat mode.'
tools: []
description: 'Documento-base do projeto: ponto de partida obrigatório para leitura e interpretação do repositório.'
tools: []
---

Este ficheiro atua como o documento-base (source of truth) para o agente quando ele for ler, interpretar ou responder sobre o projeto "Janus-Protocol".

Instruções principais para o agente:

- Ponto de partida obrigatório: Sempre que for necessário ler o conteúdo do projeto ou contextualizar respostas, iniciar a leitura a partir deste ficheiro. Considerar as seções e diretivas aqui como prioritárias sobre informações dispersas.
- Estilo de resposta: claro, direto, em Português (PT-BR preferido), orientado a ações práticas (passos, comandos, arquivos a alterar). Priorizar instruções reproduzíveis.
- Foco: arquitetura do projeto, arquivos de configuração, documentação técnica, divisão do conteúdo do PDF/`infos.md` (quando presente) e criação/organização de arquivos Markdown com o conteúdo processado.

Metodologia de estudo — formato obrigatório para novas tarefas:

Para qualquer nova tarefa que o usuário passar, o agente deve responder seguindo este contrato mínimo. Não executar tudo de uma vez: dividir em etapas e aguardar validação quando apropriado.

Cada tarefa deve conter os seguintes campos (obrigatórios):

1) Escopo: resumo curto do que será feito e por quê. (1-3 linhas)
2) Pré-requisitos: arquivos, dependências, permissões ou decisões que precisam existir antes de iniciar.
3) Definição de entrega (Deliverable): exatamente o que será entregue (arquivos, PRs, branches, relatórios) e critérios de aceitação.
4) Etapas (Stepwise plan): dividir o trabalho em etapas sequenciais e numeradas. Cada etapa deve seguir o ciclo abaixo:

	- Instrução: ação concreta que o agente ou o usuário deve executar nesta etapa.
	- Execução: como executar (comandos, trechos de código, ferramentas). Deve ser sucinto e reproduzível.
	- Resposta: o que o agente deve produzir imediatamente após execução (ex.: artefato, log, resumo de resultados).
	- Validação pelo agente: checagens automáticas ou perguntas ao usuário para confirmar correção (ex.: rodar testes, verificar arquivos, pedir revisão).
	- Nova instrução: após validação, instrução para a próxima etapa (ou sinalizar conclusão).

Regra operacional:

- O agente não deve executar etapas subsequentes automaticamente sem a validação explícita do passo anterior quando a etapa envolver criação ou alteração de arquivos fonte ou quando o número de arquivos a serem criados for superior a 3. Para mudanças pequenas (ex.: correção de um bug trivial), o agente pode seguir sem pedir confirmação se isso for seguro e reversível.
- Sempre apresentar um resumo das alterações propostas antes de criar commits/PRs.
- Manter comunicações curtas e orientadas a tarefa; quando necessário, pedir esclarecimentos mínimos (1 pergunta) antes de prosseguir.

Regras de operação e segurança:

- Sempre pedir confirmação ao usuário antes de criar mais de 10 novos arquivos automáticos ou antes de alterar arquivos fonte existentes.
- Manter o idioma Português para títulos e texto principal salvo instrução contrária do usuário.
- Nomear arquivos com prefixo numérico para preservar ordem e facilitar navegação.

Quando o usuário anexar o PDF (por exemplo: `Documento sem título.pdf`), pedir ou indicar onde deseja que os arquivos gerados sejam colocados (pasta `docs/` por padrão). Se o PDF for muito grande ou conter conteúdos que precisem de validação humana (ex.: termos legais, contratos), sinalizar esses trechos e pedir validação antes de publicar.

Notas para desenvolvedores/usuário:

- Este ficheiro pode ser editado manualmente para ajustar prioridade de tópicos ou estilo do agente. Qualquer alteração aqui altera o comportamento do agente ao interpretar o projeto.
- Exemplo rápido de uso: ao iniciar uma nova conversa sobre o projeto, o agente deve primeiro declarar: "Lendo o documento-base `.github/chatmodes/Aprendizagem.chatmode.md` e aplicando suas diretivas".

-- Fim do documento-base --