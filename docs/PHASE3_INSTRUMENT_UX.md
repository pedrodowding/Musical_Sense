# Musical Sense | Fase 3: repertório original e UX adaptativa

## Intenção

Esta fase combina a expansão inicial do repertório com a regra central: **o instrumento ativo determina todo o contexto de aprendizagem**. Não mudamos a identidade nem o XP dos alunos. Não adquirimos licenças de hits comerciais.

## Repertório entregue

O catálogo anterior continha 32 opções, das quais 18 eram melodias/canções e 14 eram exercícios. Foram adicionadas 32 melodias/canções didáticas originais:

| Instrumento | Novas melodias | Total de entradas com o instrumento |
| --- | ---: | ---: |
| Piano / teclado (compartilham a mesma trilha) | 8 | 13 |
| Violão | 5 | 11 |
| Guitarra | 5 | 11 |
| Ukulele | 5 | 11 |
| Baixo elétrico | 5 | 11 |
| Voz | 4 | 7 |

**Resultado**: 64 entradas totais, sendo 50 melodias/canções e 14 exercícios. O mesmo arranjo de piano pode ser praticado no teclado sem ser contado como composição duplicada.

As novas peças instrumentais são melodias de estudo com cerca de 16 notas, andamento e duração definidos, reconhecidas pelo motor monofônico existente. As músicas de cordas usam posições até a sétima casa da primeira corda ou da corda indicada. As quatro novas canções vocais têm frases, sílabas, notas e durações sincronizadas. São estudos originais curtos, **não equivalem a gravações de artistas ou a cursos completos**.

O arquivo `data/catalog.json` contém as 28 novas obras instrumentais e seus arranjos. O arquivo `catalog-published.js` é gerado deterministicamente via `node scripts/build-catalog.mjs`. As canções vocais ficam em `singing-data.js`.

### Origem e direitos

O conteúdo foi composto como material didático novo para esta implementação, sem copiar fonogramas ou letras comerciais. A revisão registrada para os 28 arranjos instrumentais é **estrutural e automatizada, não revisão humana**. O campo de evidência explicita a origem alegada e os metadados indicam essa natureza. Antes de licenciamento comercial amplo ou distribuição por terceiros, recomendamos curadoria musical e jurídica humana, inclusive para verificar similaridades involuntárias, atribuições e direitos aplicáveis.

## Nova experiência inicial

**Antes:** quatro seções extensas, métricas repetidas, vários atalhos concorrentes e área de canto sempre na navegação principal.

**Agora:**

1. Um cabeçalho com o instrumento atual e acesso para trocá-lo.
2. Próximo passo claro, com um CTA principal.
3. Uma música recomendada do próprio instrumento.
4. Dois submenus expansíveis, fechados por padrão: **Mais atividades** e **Meu progresso e ajustes**.

O XP detalhado, missões, conquistas, escolha de treino e ferramentas de áudio continuam disponíveis, mas não ocupam mais a entrada do aluno.

A sidebar desktop agrupa Aprender, Praticar, Mais opções e Meu espaço. No mobile permanecem cinco destinos: Início, Trilha, Músicas, Praticar/Cantar, Perfil. A quarta aba se adapta ao instrumento: Cantar para voz, Praticar para os demais.

## Comportamento ao trocar o instrumento

Ao escolher um instrumento, o aplicativo atualiza:

- Nome e ícone do instrumento no cabeçalho, dashboard e perfil.
- Próxima aula e contagem de progresso da trilha correspondente.
- Músicas sugeridas e filtros do catálogo para o instrumento atual.
- Treinos rápidos com exercícios apropriados, sem aquecimento vocal misturado às aulas de ukulele.
- Timbre de demonstração com retorno automático à configuração do novo instrumento: piano para teclado, modelo de corda pinçada para violão, guitarra, ukulele e baixo, guia suave para canto.
- Interface de aula: braço/casa/corda nas cordas, teclado no piano; dicas coerentes para cada tipo de instrumento.
- Favoritos e músicas recentes do instrumento atual no topo da área pessoal, com demais instrumentos em um submenu.

Os dados globais do perfil, como XP, letras pessoais, aulas concluídas e favoritos, **não são apagados** na troca. O som é sintetizado, não uma amostra real de instrumento.

## Aula menos poluída

Os controles principais (microfone, ouvir exemplo, dica, ouvir nota) continuam visíveis. MIDI quando aplicável, sensibilidade, volume e controles secundários passam para grupos de opções expansíveis. Isso reduz a competição visual sem ocultar funções essenciais.

## Matriz de testes de aprovação

| Jornada | Critério esperado |
| --- | --- |
| Piano → Ukulele | Página inicial, menu, recomendação, trilha, treinos e som mudam para ukulele |
| Ukulele → Baixo | Demonstração, posição no braço e repertório passam a baixo |
| Ukulele → Voz | Navegação muda de Praticar para Cantar, e a trilha mostra aquecimento vocal |
| Voz → Piano | Aba Praticar retorna e exemplos de teclado são exibidos |
| Favoritos em vários instrumentos | Cada conjunto aparece sob instrumento atual, com demais colapsados |
| Aula de cordas | Nenhuma instrução manda procurar tecla de piano |
| Música sugerida | Tem instrumentação correspondente e inicia uma aula real |
| Repertório novo | ID único, BPM válido, notas com durações e posições disponíveis no instrumento |
| Responsividade | Sem rolagem horizontal da página em 320, 375, 390, 430, 768 e 1024 px |
| Continuidade | Troca de instrumento não perde XP, favoritos, checkpoint ou histórico |
| CLI e CI | Catálogo editorial sincronizado, módulos válidos e regressões aprovadas |

O GitHub Actions cobre dados e jornadas simuladas. A inspeção visual e a escuta do timbre no Safari de iPad ou iPhone precisam ser feitas em um dispositivo real.

## Fora do escopo

- Acordes polifônicos, reconhecimento de bateria e áudio de instrumentos amostrados.
- Streaming de gravações comerciais, letras protegidas ou importação automática de plataformas de música.
- Autenticação em nuvem, sincronização de alunos entre aparelhos e novos planos pagos.

Próxima evolução recomendada: melhorar o motor de reconhecimento e o áudio amostrado por instrumento, depois de validar a experiência dessa fase.
