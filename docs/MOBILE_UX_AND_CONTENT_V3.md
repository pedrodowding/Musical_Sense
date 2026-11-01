# Musical Sense | UX mobile e descoberta musical (v3)

## Referências funcionais, não clonagem visual

Pesquisamos as orientações oficiais do Simply Piano e o relato de UX publicado pela Duolingo. O Musical Sense reaproveita **padrões gerais de usabilidade**, nunca telas, identidade, imagens, gravações, letras ou código proprietários.

- Simply Piano: catálogo pesquisável, filtrado por nível, com favoritos, lições progressivas e controles como ouvir/repetir trecho. Fonte: https://piano-help.hellosimply.com/en/articles/5834479-play-songs-in-the-song-library e https://piano-help.hellosimply.com/en/articles/16945914-simply-piano-song-library-menu-navigation
- Duolingo: caminho progressivo com "próxima ação" identificável, simplificação da navegação e consistência visual. Fontes: https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_language_read_listen_write_speak_2024.pdf e https://blog.duolingo.com/core-tabs-redesign/

## Jornada 1. Escolher instrumento

A escolha fica acessível do início e da área de perfis. O perfil ativo armazena o instrumento em \`user.instrument\`, preservando XP, perfil, progresso existente e favoritos.

Instrumentos:
- Piano e teclado: compartilhamento de 12 lições progressivas de notas, leitura, melodias e técnica, com teclado visual.
- Violão e guitarra: seis exercícios/pequenas melodias **monofônicos** por instrumento, com indicação de primeira corda e casa, sem avaliação de acordes simultâneos.
- Ukulele: seis exercícios iniciais na corda Lá.
- Baixo: seis exercícios iniciais na corda Sol, com frequência de referência mais grave.
- Voz: catálogo de três exercícios/canções originais com letra alinhada à melodia e avaliação de afinação, separado da trilha de piano.

Trocar instrumento nunca apaga conclusões. As trilhas de corda são conteúdos iniciais e **não equivalem a um curso completo**.

## Jornada 2. Escolher música

Catálogo local inicial de **32 entradas**, entre canções, melodias e exercícios disponíveis para execução: cinco conteúdos de piano, 24 entradas de cordas e três vocais. Letras pessoais autorizadas adicionadas pelo usuário aparecem separadamente e aumentam esse total.

- Busca textual tolerante a acentos, sem perda de foco no teclado mobile.
- Escopos: Meu instrumento, Todas, Canto, Favoritas e Minhas letras.
- Filtro por dificuldade.
- Favoritos salvos por perfil e incluídos no backup JSON.
- Detalhe com artista/origem, dificuldade, modalidade, tempo estimado e ação primária.
- Prévia sintetizada das notas para atividades com melodia, com interrupção de áudio ao sair.
- Se uma música requer outro instrumento, a ação informa que o perfil será alterado antes da prática.
- Sem alegações de biblioteca comercial licenciada ou de suporte a letras protegidas sem autorização.

## Jornada 3. Entrar em uma aula

A trilha apresenta um próximo exercício claro, estados de concluído/em andamento e nós sequenciais. O aluno pode rever qualquer exercício, sem travas artificiais.

Para cordas, a ilustração mostra corda/casa e não um teclado de piano. O reconhecimento é monofônico por microfone. Ao sair, o checkpoint da aula guiada é salvo. Conquistas permanecem por aluno.

## Navegação mobile

Cinco abas fixas no rodapé (Início, Trilha, Músicas, Cantar, Perfil), preservando Treinos e Conquistas como páginas internas acessíveis por CTAs. Esse limite reduz densidade e mantém a navegação principal legível em celulares estreitos.

- Breakpoint de navegação inferior até 920 px, incluindo tablets em retrato.
- Área segura de iOS: \`env(safe-area-inset-bottom)\`.
- Campos de busca com 16 px para evitar zoom involuntário no iPhone.
- Botões e filtros relevantes com alturas touch-first de aproximadamente 44 px ou mais.
- Cartões de catálogo em duas colunas no tablet, uma coluna compacta em telefones.
- Partitura e teclado/braço em modo aula usam espaçamento reduzido em telas estreitas.

## Matriz de QA para aprovação humana

| Cenário | Critério observável |
| --- | --- |
| iPhone SE ou largura 320 px | Sem scroll horizontal da página, cinco abas legíveis e CTA de aula acessível |
| Larguras 375, 390, 430 px | Busca, favoritos e ações de cartões utilizáveis com uma mão |
| iPad retrato 768, 820 px | Barra inferior visível, conteúdo sem colisões |
| Tablet paisagem 1024 px | Sidebar desktop ou layout coerente, sem botões sobrepostos |
| Violão/guitarra/ukulele/baixo | Apenas notas da trilha correta, posição de corda/casa exata |
| Seleção de outro instrumento em Música | Antes de começar, label explicita a troca |
| Busca com teclado aberto | Digitar não desmonta o input nem reinicia a pesquisa |
| Favoritar e trocar de perfil | Favoritos independentes, backup/restore preserva a lista |
| Abrir/fechar prévia de melodia | Áudio interrompido ao sair, sem tocar sobre uma aula |
| Trocar de app durante aula | Microfone interrompido e progresso preservado |
| Conteúdo de voz | Sem teclado de piano apresentado como exercício vocal |
| Fontes e direitos | Não usar letras/gravações de terceiros sem licença contratual |

**Validação executada:** testes de dados, filtragem, ações e jornadas simuladas do aplicativo. **Pendente:** inspeção visual com automação de browser nos tamanhos acima e testes reais de toque, áudio e permissionamento no Safari/iPad.

## Próximos investimentos relevantes

- Avaliação de acordes polifônicos e afinação de cordas.
- Ampliação de cursos específicos por instrumento, com editor de conteúdo.
- Catálogo comercial licenciado: fonte, metadados, versionamento, direitos, letra sincronizada e fonogramas.
- Persistência em nuvem com autenticação e LGPD, após definição de contas e consentimento.
