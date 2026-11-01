# Musical Sense: catálogo, letras, licenciamento e medição vocal

## Estado da implementação

**Funcionando no código:** catálogo inicial de três exercícios/canções **originais** (letra + melodia em notas MIDI + duração em batidas + frase), acompanhamento visual por frase/sílaba, avaliação de afinação pelo microfone, controle de tempo e registro vocal, importação local de TXT/LRC sob declaração de direitos, XP vocal e medalhas.

**Não implementado:** busca pública de letras comerciais, streaming de gravações profissionais, reconhecimento de palavras efetivamente pronunciadas, calibração automática de latência em iPad, gravação/reprodução da própria voz, catálogo comercial, sincronização de contas na nuvem.

## Modelo de dados

O conteúdo musical gerenciável é independente da apresentação e do microfone. Cada música de canto estruturada possui:

- Identidade: \`id\`, \`title\`, \`artist\`, \`level\`, \`genre\`, \`description\`, \`key\`, idioma (o catálogo original atual é PT-BR).
- Metrônomo: \`bpm\`, \`totalBeats\`, compasso quando relevante.
- Fonte e direitos: \`source.type\`, \`author\`, \`license\`, permissões específicas para \`lyricsRights\`, \`melodyRights\` e \`recordingRights\`. Conteúdo original não significa ter licença de gravação comercial.
- Melodia: array \`steps\`, com \`m\` (MIDI), \`beats\`, \`syllable\`, \`startBeat\` e \`phrase\`.
- Letra: \`phrases\`, com \`text\`, \`startBeat\`, \`endBeat\` e limites das notas.
- Avaliação: amostras de frequência RMS + estimativa de pitch e desvios em cents. **Não há transcrição de fala**, nem validação da pronúncia.

Os três conteúdos atuais estão em \`singing-data.js\`; o modelo acima pode alimentar uma API de catálogo quando houver infraestrutura e autorização contratual.

## Letras pessoais

O editor local aceita:

1. **LRC**: \`[00:12.50]Linha da letra\`, com timestamps em minutos e segundos, incluindo \`[offset:+100]\`.
2. **TXT**: linhas simples. Cada linha recebe um avanço aproximado de 3,5 segundos, expressamente indicado como estimativa.
3. Arquivos \`.lrc\`/\`.txt\` até 30 KB, ou texto colado até 20.000 caracteres. Conteúdo salvo no **localStorage do perfil ativo**, nunca enviado ao servidor.
4. A caixa de confirmação de direitos é obrigatória. O armazenamento é local e sujeito à limpeza do navegador.

**Importante:** uma letra pessoal não contém, por si só, partitura, melodia autorizada, playback ou os tempos exatos de interpretação. Portanto, o modo de letra pessoal mostra a linha no tempo e a nota captada, sem comparar se a pessoa cantou a melodia correta.

## Estratégia para catálogo profissional e licenciado

1. **Metadados musicais**: catalogar compositor, intérprete, ISRC/ISWC quando disponíveis, duração, idioma, versão, editora, letras e fonograma. MusicBrainz pode apoiar identificação/metadados, observadas as condições comerciais do serviço, mas **não licencia letras ou gravações**. Referência: https://musicbrainz.org/doc/MusicBrainz_API.
2. **Letras e sincronização licenciadas**: avaliar um contrato comercial com prestadores como Musixmatch ou LyricFind. Antes de integração, solicitar direitos **expressos de exibição sincronizada/canto/karaokê**, armazenamento em cache, territórios, atribuições, expiração, uso infantil, monetização e obras autorizadas. O simples acesso a uma API não prova que o contrato autoriza todos esses usos. Referência: https://developer.musixmatch.com/.
3. **Melodia e partitura**: obter MusicXML/MIDI ou compor/arranjar internamente quando houver direito sobre obra e arranjo. Validar a correspondência sílaba ↔ nota ↔ duração.
4. **Áudio de acompanhamento**: usar áudio próprio ou gravações com contrato específico, sem presumir que licenças de exibição de letras abrangem fonogramas. Guardar trilhas instrumental e vocal separadas quando licenciado.
5. **Validação editorial e legal**: registrar provenance, documento de licença, território, validade, exigências de crédito, moderação de importações e testes manuais de sincronização.
6. **Distribuição**: somente disponibilizar no catálogo público obras com direitos comprovados; itens pessoais permanecem locais até existir um procedimento específico de autorização e publicação.

A legislação brasileira trata reprodução e disponibilização de obras protegidas como modalidades sujeitas a autorização, ressalvadas exceções legais. Referências oficiais:
- Lei 9.610/1998: https://www.gov.br/propriedade-intelectual/pt-br/legislacao/direitos-autorais/legislacao-nacional/lei-9610.pdf
- Perguntas frequentes de direitos autorais: https://www.gov.br/turismo/pt-br/secretaria-especial-da-cultura/assuntos/direitos-autorais/perguntas-frequentes/perguntas-frequentes-1

## Gamificação e persistência

- Dados **por aluno**, até cinco perfis por dispositivo: XP, nível, sequência de dias, distintivos, missões, histórico, aulas concluídas, cantos concluídos e checkpoints de aulas guiadas.
- Regras em \`gamification.js\`. Identificador de sessão evita duplicação de recompensas após clique repetido. Repetir atividades tem XP reduzido e limite diário.
- O dia é calculado pelo calendário local, sem depender de formatação variável do Safari.
- Uma tentativa incompleta não marca aula como concluída. Uma performance com menos de 65% de notas corretas não conclui a aula. Canto precisa atingir 60% de notas aceitas na melodia.
- O progresso salvo no navegador pode se perder ao apagar dados do site ou usar outro dispositivo; sincronização futura requer autenticação, base de dados, controles de privacidade e política de retenção.

## Limites de medição no iPad

- O Safari usa o microfone via Web Audio, sem depender de Web MIDI.
- O detector é monofônico. Para acordes ou gravações de música acompanhada, seria necessário um estimador polifônico robusto.
- O julgamento vocal considera estimativas de pitch, estabilidade e cobertura das notas. Ambientes ruidosos, vibrato, registros vocais e latência podem alterar os resultados.
- O canto não valida as palavras pronunciadas; letras são texto de apoio, não reconhecimento de voz.
- A latência e acurácia precisam ser medidas com piano/voz reais e diferentes iPads, não apenas com tons sintetizados.

## Matriz de validação manual antes de comercializar

- Safari iPad: aceitar/negar microfone, sair durante permissão, abrir duas vezes, alternar apps, ativar novamente.
- Piano: Dó central, oitava grave, repetição da mesma tecla, notas curtas, sustenidos, silêncio e ruído.
- Canto: voz masculina/feminina, oitava abaixo, sustentar sílaba, variação de afinação, silêncio, fones e sem fones.
- Conteúdo: LRC ordenado/desordenado, offset, arquivo inválido, texto simples, tags HTML, ausência de autorização.
- Estado: finalizar, pausar, sair e retomar aula, repetir, trocar/perder perfil, armazenamento indisponível, atualizar PWA.
- XP: primeira conclusão, repetição 2/3/4 no mesmo dia, duplicação de sessão, mudança de dia, streak, medalhas.
- Segurança: não expor letras pessoais de outros perfis e não publicar material não licenciado.

## Próxima arquitetura de escala

Quando houver contas e catálogo de terceiros: Supabase/Postgres, tabelas \`songs\`, \`song_rights\`, \`song_lyrics\`, \`song_notes\`, \`song_versions\`, \`song_assets\`, \`user_progress\`, \`user_rewards\` e \`user_uploads\`, com RLS por usuário/organização. Catálogo editorial com aprovação humana para publicar, origem e validade de licença obrigatórias, sem importar de fontes não autorizadas.
