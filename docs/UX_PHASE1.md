# Musical Sense | Fase 1 concluída no código: UX mobile e área pessoal

## Escopo e propósito

A Fase 1 do roadmap reorganiza exclusivamente a experiência pessoal, familiar e a navegação mobile. O repertório e o motor de reconhecimento musical não são alterados.

**Antes:** uma única página "Perfis da família" reunia alunos, cadastro, escolha de instrumento, indicadores, diagnóstico de microfone e backup. O botão com avatar no cabeçalho levava para essa página, dificultando a alternância rápida.

**Depois:** o avatar abre o seletor de aluno em um diálogo nativo. A aba Perfil exibe um painel pessoal, com destinos claros para Evolução, Instrumentos, Minhas músicas, Família e Configurações.

## Arquitetura de telas

| Tela | Responsabilidade | Acesso |
| --- | --- | --- |
| Perfil | Identidade, nível, XP, sequência, resumo e atalhos | Quinta aba mobile e sidebar |
| Trocar aluno | Alternar entre até cinco perfis locais | Avatar do cabeçalho, diálogo nativo |
| Evolução | Progresso, histórico de sete dias, trilhas por instrumento e missões | Perfil > Minha evolução |
| Meus instrumentos | Trocar instrumento sem apagar progresso | Perfil > Meus instrumentos |
| Minhas músicas | Favoritos e práticas recentes usando dados existentes | Perfil > Minhas músicas |
| Família | Criar, renomear, escolher e excluir perfis | Perfil > Perfis da família |
| Configurações | Som, diagnóstico, exportação/restauração e ajuda | Perfil > Configurações |

As cinco abas principais continuam sendo Início, Trilha, Músicas, Cantar e Perfil. Páginas de conta internas preservam o destaque da aba Perfil. Ações de música continuam indo para a biblioteca e para as aulas já existentes.

## Persistência e compatibilidade

A aplicação continua usando a mesma chave \`musical-sense-v3\` em \`localStorage\`. Não há migração de banco, mudança de IDs ou transformação destrutiva de objetos. Dados mantidos:

- Perfis existentes, instrumentos, favoritos e letras pessoais.
- XP, histórico, sequências, conquistas e missões diárias.
- Checkpoints e lições concluídas.
- Preferências de áudio e backup JSON.
- Até cinco perfis locais, sem alegar autenticação ou sincronização na nuvem.

Operações de criar, trocar, renomear ou excluir usam persistência antes de confirmar a operação. Quando o navegador não permite salvar, o estado em memória retorna ao anterior. A exclusão exige confirmação explícita.

**Limitação conhecida:** \`localStorage\` não é uma base multi-dispositivo. A seção Configurações mantém exportação/restauração manual, com alertas de que a importação substitui dados locais.

## Diretrizes visuais e acessibilidade

- Botões de troca de aluno e gerenciamento com alvo mínimo de 44 × 44 CSS px.
- Uso de \`<dialog>\` nativo para foco e tecla Escape, com fechamento no botão dedicado e alternativa para navegadores antigos.
- Hierarquia dos textos, contraste e cartões distintos por função.
- Conteúdo adaptável em telas de 320, 375, 390, 430, 768 e 1024 pixels. O comportamento visual deve ser confirmado em dispositivos reais, especialmente Safari no iPad/iPhone.
- Nome de aluno escapado antes de inserir no HTML.
- Indicadores não inventam precisão quando ainda não existem tentativas.
- Recursos disponíveis são descritos corretamente: não há mensagem afirmando que só piano/teclado possuem conteúdo.

## Jornadas obrigatórias para aprovação

| Jornada | Critério |
| --- | --- |
| Abrir troca de aluno | Um toque no avatar, diálogo com lista correta |
| Alternar aluno | Segundo toque seleciona o aluno e navega para início |
| Perfil | Evolução, instrumentos, músicas, família e configurações encontráveis |
| Evolução | Sete dias e progresso de todos os instrumentos sem valores \`undefined\` |
| Favoritos | Cada aluno mantém apenas os próprios favoritos |
| Família | Criar, renomear, excluir com confirmação e limite de cinco |
| Persistência | Troca/edição não altera ID, XP, medalhas, letras ou aula de outro aluno |
| Configurações | Backup e diagnóstico apenas na área correta, sem perda de funcionalidades |
| Mobile | Cinco abas, áreas tocáveis e ausência de scroll horizontal |
| Acessibilidade | Diálogo nomeado, botão de fechamento, estados selecionados e foco visível |

Testes automatizados em \`tests/account-ux.test.mjs\` e compatibilidade com a suíte anterior \`tests/mobile-journey.test.mjs\`.

## Etapas seguintes

Fase 2 inicia somente após aprovação funcional/visual desta etapa. Não houve importação de música nem mudanças na arquitetura de conteúdo nesta entrega.

**Publicação:** GitHub e Vercel devem ser avaliados separadamente. Commit no GitHub não prova deploy em produção. O status público do último commit precisa confirmar publicação e testes físicos antes da aprovação final.
