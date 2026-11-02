# Licenças e créditos das amostras de instrumentos

Amostras de **notas isoladas gravadas em instrumentos reais**, incluídas em `assets/samples/` e utilizadas apenas na demonstração de notas. Nenhum fonograma comercial ou música protegida foi incorporado.

Todas as bibliotecas abaixo declaram **Creative Commons Zero 1.0 (CC0)**. A indicação de autoria e origem é mantida por transparência mesmo quando a atribuição não é obrigatória.

## Piano e violão acústico (Meta Open Sound)

- Projeto: [Meta Open Sound](https://github.com/facebookincubator/Meta-open-sound)
- Licença da coleção de instrumentos: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- Fonte piano: `systems/instruments/meta-piano/ogg/` (camada de velocidade 03)
- Fonte violão: `systems/instruments/meta-nylon-guitar/ogg/` (corda B, palhetada, camada de velocidade 02)
- Gravados originalmente e disponibilizados pela equipe Creative Audio da Meta, conforme a documentação do projeto.

Arquivos copiados:
- `assets/samples/piano/c4.ogg` de `INSPiano_Vel03_C4_01.ogg`, nota MIDI 60
- `assets/samples/piano/g4.ogg` de `INSPiano_Vel03_G4_01.ogg`, nota MIDI 67
- `assets/samples/acoustic/e4.ogg` de `INSGuitarNylon_StringB_Vel02Pick_E4_01.ogg`, nota MIDI 64
- `assets/samples/acoustic/a4.ogg` de `INSGuitarNylon_StringB_Vel02Pick_A4_01.ogg`, nota MIDI 69

## Ukulele (FreePats)

- Projeto: [FreePats ukulele1](https://github.com/freepats/ukulele1)
- Autor da gravação: Mateusz Dąbrowski, instrumento Flight Fireball tenor, gravado em 2026
- Licença: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- Arquivos originais: `samples/A4.flac`, `samples/C#5.flac`, `samples/F5.flac`
- Mapeamentos: MIDI 69, 73 e 77, respectivamente
- Metadados e detalhes de afinação: `Ukulele 20260811.sfz`

## Guitarra elétrica limpa (FreePats)

- Projeto: [FreePats electric-guitar-FSBS-clean](https://github.com/freepats/electric-guitar-FSBS-clean)
- Gravações de uma guitarra Fender por interface de áudio, processadas para timbre limpo
- Licença: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- Arquivos originais: `samples/bridge/small/E4_s6_01.flac`, `samples/bridge/small/G4_s6_01.flac`
- Mapeamentos: MIDI 64, 67

## Baixo elétrico (FreePats)

- Projeto: [FreePats electric-bass-YR](https://github.com/freepats/electric-bass-YR)
- Autor original: Andrea Biasior, baixo Yamaha RBX, com pequenas edições do FreePats
- Licença: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- Arquivos originais: `samples/finger/G.flac`, `samples/finger/D#.flac`
- Mapeamentos conforme `FingerBassYR 20190930.sfz`: MIDI 31 e 39; as aulas de baixo transpoem as notas conforme o registro necessário.

## Implementação e transparência

- Os arquivos não são exigidos para carregar a tela inicial: `sample-bank.js` faz carregamento sob demanda no próprio domínio do Musical Sense, apenas quando uma demonstração necessita daquele timbre.
- O navegador decodifica OGG/FLAC via `AudioContext.decodeAudioData()`. Se não suportar determinado formato, a síntese local substitui a amostra, e a mensagem informa qual origem foi realmente utilizada.
- Não há envio de áudio do aluno. A calibração do microfone usa somente valores de volume (RMS), sem guardar, transcrever ou transmitir gravações.
- Poucas notas reais foram selecionadas por instrumento, com transposição digital para alturas próximas. Por isso a qualidade é superior ao oscilador genérico, mas ainda não equivale a um banco completo multiamostrado com várias velocidades.
- O SoundPlayer conserva o compressor existente para limitar picos, com volume inicial moderado.
- Código dos programas SFZ originais, arquivos de atribuição e documentação estão nos projetos de origem, acima.
