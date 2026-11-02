# Musical Sense | Fase 4: áudio real, reconhecimento e calibração por instrumento

## O que entrou

- **11 amostras de notas realmente gravadas**, extraídas de bibliotecas públicas CC0, com origem documentada em [SAMPLE_CREDITS.md](SAMPLE_CREDITS.md). O app só busca o pequeno conjunto do instrumento ao tocar uma demonstração, nunca na abertura da tela inicial.
- **Modo de som Real/Sintetizado**, em Som. O modo Real tenta decodificar OGG e FLAC com Web Audio. Se o navegador não suportar um codec, volta automaticamente para o motor sintetizado anterior, mantendo a aula utilizável. Quando um exemplo é reproduzido, a mensagem informa a origem usada de fato.
- **Banco de amostras em memória**: cada arquivo é carregado uma única vez por sessão. O Service Worker existente armazena os arquivos após o primeiro carregamento. Não se adicionam amostras ao precache inicial.
- **Reconhecimento de notas revisado**: função YIN/CMNDF com análise de pitch configurável e tratamento de ambiguidades de oitava. Perfil específico de baixo utiliza janela de 8192 amostras, corte passa-altas em 28 Hz e detecta frequências abaixo dos 65 Hz anteriormente suportados. Outros instrumentos usam janelas de 4096 e filtros adequados à sua faixa.
- **Calibração local**: em Som > Calibrar microfone, o aluno fica em silêncio por cerca de três segundos. O aplicativo coleta apenas intensidade (RMS), sem gravar nem transmitir áudio, calcula a mediana e adapta o limiar para o instrumento ativo. O nível é guardado no perfil local de cada aluno, por instrumento.
- **Cancelamento de reprodução**: mudar instrumento ou sair interrompe demonstrações antigas, inclusive carregamentos ainda pendentes.

## Limites

- As amostras usam somente **duas ou três notas originais por instrumento**, com transposição digital para as demais. São gravações reais, mas a biblioteca não é um instrumento multiamostrado completo. Qualidade e articulação variam com a distância tonal da amostra.
- OGG/FLAC são decodificados conforme a capacidade do navegador. O fallback sintetizado não depende de rede.
- **Voz** utiliza referência sintetizada: as amostras atuais cobrem piano, violão, guitarra, ukulele e baixo, não canto humano.
- Nenhum aplicativo baseado apenas em microfone consegue garantir reconhecimento perfeito em acordes simultâneos, ambientes ruidosos, equipamentos ruins ou reproduções do próprio alto-falante.
- O reconhecimento ainda é monofônico. MIDI é alternativa disponível em navegadores que suportam Web MIDI; no Safari do iPad o caminho recomendado continua sendo microfone.
- A calibração exige permissão temporária de microfone e silêncio ambiental; se o ambiente estiver muito barulhento, o usuário recebe uma mensagem para repetir.

## Notas de implementação

Arquivos centrais:

- `sample-bank.js`: manifesto e loader local das amostras, cache em memória e escolha da altura mais próxima.
- `audio-engine.js`: reconhecimento, perfis e reprodução de áudio.
- `instrument-audio.js`: parâmetros por instrumento, limiar de sensibilidade e calibração de ruído.
- `app.js`: tela Som, salvamento local, troca de instrumento e integração com aulas.
- `assets/samples/`: 11 notas gravadas e licenciadas CC0, distribuídas com o site.
- `tests/audio-phase4.test.mjs`: regressões de graves, áudio de amostras, codec incompatível, calibração e segurança de origens.

## Critérios verificáveis

1. Baixo: reconhecimento sintético próximo a 41,2 Hz em 44,1 e 48 kHz com erro de altura inferior a 8 cents.
2. Piano e cordas: testes sintéticos de notas entre 55 e 880 Hz com erro máximo de 8 cents, incluindo ruído leve.
3. Ruído não periódico e silêncio: não devem gerar nota confiável.
4. Amostras: arquivos locais com assinatura binária OGG/FLAC e licença documentada.
5. Amostras carregadas uma só vez e fallback não bloqueante se decodeAudioData falhar.
6. Calibração por instrumento e aluno: coleta de RMS, sem armazenamento de voz ou notas captadas.
7. Abertura da aplicação: sem baixar toda a biblioteca de amostras.
8. Navegação, favoritos e XP: sem regressões.

## Validação de dispositivo

Os testes de CI e sinais sintéticos permitem verificar muitos erros, mas **não substituem testes presenciais em iPhone/iPad**. Verificar em Safari, com fones, microfone ativo e ukulele/baixo reais. Confirmar empiricamente latência e falsos positivos antes de afirmar precisão em ambiente real.
