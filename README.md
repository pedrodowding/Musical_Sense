# Musical Sense 🎹

Aplicativo web de aprendizagem musical com aulas visuais e avaliação das notas tocadas em um **piano ou teclado físico** pelo microfone do navegador.

## Correção da demonstração por instrumento

A escolha de Ukulele, Violão, Guitarra e Baixo agora direciona as notas de demonstração para um **modelo sintetizado de corda pinçada**, com ataque e decaimento distintos do piano. O botão "Testar" utiliza notas da trilha do instrumento atual, em vez de apresentar sempre notas de piano.

São aproximações físicas locais feitas no navegador por Karplus-Strong, **não gravações reais**. Em Som > Timbre da guia, escolha "Automático pelo instrumento". A preferência manual "Piano sintetizado" continuará ativa até retornar ao automático.

Testes em `tests/instrument-audio.test.mjs` verificam diferentes timbres, encerramento do áudio e encaminhamento da demonstração.

## Fase 1 do roadmap: perfil, família e experiência mobile

Consolidamos o perfil pessoal em uma navegação dedicada, sem mudar o modelo de dados nem adicionar músicas nesta fase.

- Avatar no cabeçalho: seletor rápido de aluno com diálogo nativo, acessível e até cinco perfis locais.
- Aba Perfil: resumo com nível, XP, sequência de dias, aulas, precisão e atalhos claros.
- Evolução: atividade dos últimos sete dias, progresso por instrumento e missões atuais.
- Minhas músicas: favoritos, práticas recentes e acesso às letras pessoais, reutilizando o catálogo já existente.
- Família: adicionar, renomear, excluir e alternar alunos em uma tela separada.
- Configurações: som, diagnóstico do microfone e backup manual em uma área apropriada.
- Navegação: mantidas as cinco abas mobile, com a aba Perfil ativa nas páginas internas.
- Segurança de dados: identificadores mantidos, persistência com rollback para operações críticas e aviso explícito de armazenamento local.

**Escopo intencional:** não alteramos repertório, avaliação de notas, regras de XP, detecção de microfone ou sincronização em nuvem.

Validação automatizada: \`node --test tests/*.test.mjs\`. Critérios e testes detalhados: [docs/UX_PHASE1.md](docs/UX_PHASE1.md).

## Atualização 3.1: som mais audível e controle de volume

A reprodução de notas foi reconstruída sobre uma única saída Web Audio. Em vez de enviar os osciladores diretamente aos alto-falantes com ganho fixo baixo, o aplicativo utiliza um barramento com ganho master ajustável, compressor dinâmico para reduzir picos, envelope de notas mais definido e seleção de timbre sintetizado.

- O volume principal padrão é **85%** e pode ser ajustado de 0 a 100%, diretamente em **Aula**, **Cantar** ou no botão **Som** no topo do aplicativo.
- O metrônomo tem volume próprio (padrão 72%) e um botão para testar o pulso.
- A página **Som** permite reproduzir uma curta sequência de notas, selecionar um timbre (automático, piano, cordas ou suave) e restaurar os padrões.
- Preferências de áudio persistem no navegador e estão incluídas no arquivo de backup familiar.
- Para reduzir estalos digitais, o ganho é interpolado suavemente; um compressor ajuda a controlar picos quando há mais de uma nota.
- O som continua **sintetizado**, não é uma gravação de piano ou violão real.
- Não é possível mudar programaticamente o volume físico de alto-falantes/fones no Safari; use os controles do aparelho.
- Para usar microfone e reprodução juntos, recomendam-se fones para evitar que o som de saída seja captado como resposta.

**Verificação executada:** testes simulados do grafo de áudio, geração de notas, cliques e botões/controles. A avaliação subjetiva de loudness, distorção e dinâmica no alto-falante interno do iPad ainda requer teste físico no dispositivo.

## Atualização 3.0: trilha por instrumento, música e UX mobile

- **Escolha funcional de instrumento:** Piano, Teclado, Violão, Guitarra, Ukulele, Baixo e Voz. O instrumento ativo fica salvo no perfil; o histórico e XP não são perdidos ao trocar.
- **Trilhas específicas:** 12 aulas de piano/teclado, seis exercícios de nota única para cada instrumento de cordas e área própria de canto com três canções/exercícios vocais.
- **Repertório inicial:** 32 opções tocáveis/cantáveis de melodias e exercícios (5 piano + 24 cordas + 3 canto) e letras pessoais adicionais. Inclui material original e obras tradicionais/em domínio público. Não há catálogo comercial licenciado.
- **Descoberta musical:** busca tolerante a acentos, seleção por instrumento, filtros de nível, favoritos por aluno, detalhes de música e prévia sintetizada para melodia disponível.
- **Experiência mobile:** cinco abas principais, caminho progressivo com próxima lição evidente, botões touch-first, áreas seguras do iPhone/iPad e um braço de cordas com indicação de casas em vez de teclado de piano nas aulas de violão, guitarra, ukulele e baixo.
- **Compatibilidade:** microfone continua sendo a fonte principal em Safari; somente **notas isoladas** são avaliadas nas trilhas de cordas. Acordes simultâneos ainda não têm detector próprio.

Referências de UX e matriz de testes: [docs/MOBILE_UX_AND_CONTENT_V3.md](docs/MOBILE_UX_AND_CONTENT_V3.md).

## Atualização 2.2: canto, letras, gamificação e confiabilidade

**Nova área Cantar:** três conteúdos vocais originais em PT-BR, com sílabas, letras e melodias sincronizadas, modos de voz em oitavas diferentes, comparação monofônica de afinação pela frequência captada do microfone, reprodução de guia melódico sintetizado, metrônomo e resultado por nota.

**Minha biblioteca de letras:** importar/colar TXT ou LRC sob declaração de direitos. O conteúdo é privado do perfil no armazenamento local. A exibição de letra pessoal não avalia se palavras ou melodia estão corretas sem uma partitura e direitos correspondentes. Não há raspagem de músicas comerciais.

**Gamificação:** XP com trava de sessões duplicadas, bônus reduzido em repetições, níveis, missões diárias, oito tipos de medalhas, streak por calendário local, pontuação vocal e checkpoints para retomar aulas de instrumento.

**Confiabilidade:** cancelamento seguro de solicitações de microfone, controle para interromper guia/metrônomo, administração de até cinco perfis familiares, backup/exportação e restauração validada de dados JSON, testes de diagnóstico de microfone em Perfil e cobertura regressiva no GitHub Actions.

**Antes de comercializar:** validar iPad e voz/instrumento reais, calibrar latência, garantir conformidade LGPD para futura conta online, licenciar qualquer repertório comercial com direitos explícitos para letra, melodia, playback e eventual experiência de canto/karaokê.

Documentação de catálogo, direitos e matriz de QA: [docs/CONTENT_RIGHTS_AND_QA.md](docs/CONTENT_RIGHTS_AND_QA.md).

Executar testes (Node 22+):

\`\`\`sh
node --test tests/*.test.mjs
\`\`\`

## Versão atual

- Dashboard mobile-first, trilhas pedagógicas e exercícios guiados
- Partitura SVG dinâmica com notas atuais, concluídas e orientações de dedilhado
- Teclado visual informativo. **O aluno não precisa tocar na tela**
- Reconhecimento monofônico pelo microfone, estimativa YIN e indicação de frequência/afinação
- Estabilização de notas, detecção básica de ataques e orientação quando houver erro
- Entrada MIDI opcional em navegadores que suportam Web MIDI; Safari do iPad usa microfone
- Reprodução de demonstração sintetizada dos exercícios com Web Audio
- Perfis independentes, XP, estrelas, precisão, aulas concluídas e treinos
- Biblioteca inicial de melodias tradicionais, domínio público e exercícios didáticos
- PWA com Service Worker, manifesto, ícone SVG e suporte offline após instalação


## Modo Performance (versão 2.1)

Cada aula possui duas modalidades acessíveis na própria tela:

1. **Aprender sem pressa:** o usuário toca as notas isoladamente e avança após o reconhecimento.
2. **Tocar no ritmo:** um corredor de notas se desloca até a linha verde no tempo da música. O aluno ouve quatro pulsos de preparação, acompanha 60, 80 ou 100 BPM e pode pausar/continuar.

No modo Performance, o aplicativo avalia os eventos de entrada monofônicos em relação aos instantes esperados, marca notas não tocadas e registra notas perfeitas, boas, fora do centro do pulso e perdidas. Os relatórios exibem precisão estimada, sequência de acertos e um trecho sugerido para praticar novamente.

**Latência:** por padrão, os eventos captados pelo microfone são compensados em 160 ms. É possível alterar entre 0 e 300 ms no controle da aula. MIDI usa o horário do evento sem essa compensação. Ajustar a latência ajuda, mas ainda não equivale a uma calibração automática validada em diversos dispositivos.

**Comportamento de conclusão:** um desafio de performance com menos de 65% de notas corretas concede XP reduzido, sem marcar a aula completa. A repetição de um trecho difícil não marca toda a aula como concluída.

**Áudio:** os pulsos são sintetizados localmente com Web Audio. Recomendamos fones de ouvido para impedir que os cliques emitidos pelo iPad sejam captados pelo próprio microfone. Não há faixa comercial ou acompanhamento por banda gravada.

**Validação:** o algoritmo de pontuação possui testes automatizados reproduzíveis com \`node --test tests/performance.test.mjs\`. A sincronização com instrumentos reais, incluindo a latência do Safari, continua dependente de testes físicos.

## Como publicar

Repositório estático: importação Vercel como **Other**, sem Build Command e sem Output Directory. Cada push na branch main inicia um deploy na integração GitHub/Vercel já configurada.

## Como testar no iPad

1. Abrir endereço HTTPS no Safari, posicionar o iPad próximo ao instrumento.
2. Entrar em **Primeiros passos > Conheça o Dó central**. Permitir uso do microfone.
3. Tocar e sustentar um **Dó 4 (261,63 Hz)**. Observar indicador de volume, frequência e nota.
4. Repetir notas iguais **soltando a tecla entre ataques**. A aula deve avançar automaticamente.
5. Se o som for captado mas não houver nota estável, reduzir ruído, ajustar sensibilidade ou aproximar o iPad.

## Limitações honestas

- Detecção **monofônica** em estudo: acordes simultâneos e múltiplas vozes ainda não são analisados.
- Algoritmo, compatibilidade de iPad e latência **precisam de validação com instrumentos reais**. Nem todos os timbres/oitavas são captados de forma confiável.
- O modo Performance mede proximidade temporal estimada entre eventos de notas e pulsos, sem garantia de precisão profissional. A latência real e o instante exato do ataque de notas ainda podem variar por instrumento e dispositivo. O metrônomo no modo guiado não avalia ritmo.
- Perfis usam localStorage neste dispositivo; há backup JSON manual, mas não login ou sincronização na nuvem.
- O metrônomo e os exemplos de áudio são sintetizados localmente, sem gravações comerciais.
- Outros instrumentos além de piano/teclado estão previstos, mas não têm trilhas próprias.
- No Safari do iPad, a Web MIDI API não está amplamente disponível. O microfone é o modo principal.
- Arquivos do app podem funcionar offline após o primeiro carregamento, mas capturar áudio e instalar PWA dependem das permissões e capacidades do navegador.
- O aplicativo é um projeto independente e não reutiliza código, ilustrações, músicas protegidas ou marca do Simply Piano.

## Referências funcionais

O design é uma implementação original de padrões de ensino musical: partitura, retorno em tempo real, lições curtas, teclado visual de referência e progressão. O projeto REA (morluto/rea) foi estudado como possibilidade de análise baseada em evidências, mas **não foi executado contra o aplicativo Simply Piano**.

## Arquivos

- index.html: inicialização do aplicativo
- styles.css: design system e layouts responsivos
- app.js: navegação, perfis, aulas, partitura e progresso
- music-data.js: conteúdo pedagógico e melodias
- audio-engine.js: reconhecimento de notas, MIDI e áudio de exemplo
- sw.js: cache de arquivos do PWA
- manifest.webmanifest e icon.svg: metadados e ícone
