# Musical Sense | Fase 2, Biblioteca Musical 2.0

## Entrega

A biblioteca passa a distinguir **obra**, **arranjo** e **aula**. As 32 entradas iniciais e seus identificadores de progresso são preservados. A expansão de músicas continua reservada à Fase 3.

- Busca e filtros combinados: instrumento, música/exercício/letra, gênero, dificuldade e favoritos.
- Tela de detalhe com origem editorial da música.
- Importação local de MIDI ou MusicXML, prévia e exportação de um rascunho JSON.
- Validação editorial automatizada de licença, fonte, autoria, notas e aprovação explícita.
- Novos arranjos aprovados podem alimentar aulas sem alterar manualmente o código da navegação.
- Nenhuma importação é publicada ou enviada a um servidor automaticamente.

## Como importar um arquivo

Acesse **Músicas > Importar partitura**.

O MusicXML suportado é do tipo score-partwise não compactado, com uma única parte, uma só voz, sem acordes simultâneos, pausas ou mudanças de andamento. Ligaduras simples, alterações de semitons e durações por divisões são lidas. Arquivos MXL compactados ainda não são aceitos.

O MIDI suportado é Standard MIDI File (SMF) tipo 0 ou 1, com PPQN e melodia monofônica. Até 16 trilhas e sem mudanças de andamento. Peças polifônicas ou com pausas prolongadas são recusadas, em vez de perder notas ou alterar a execução de forma silenciosa.

Limites: 450 KB por arquivo, três a 512 notas, alturas MIDI 24 a 96 e duração entre 0,25 e 8 batidas por nota.

Depois de importar, confirme título, compositor, instrumento, origem e licença. Escute uma prévia sintetizada e baixe o rascunho JSON. O arquivo ficará em status draft. A autorização de uso para uma prévia local não concede permissão para publicação.

## Processo editorial

Arquivos do repositório:

- data/catalog.json: fonte editorial de obras e arranjos.
- catalog-model.js: validação, direitos, relação obra/arranjo/aula e conteúdo publicado.
- catalog-published.js: versão pública gerada a partir da fonte, não editar manualmente.
- scripts/build-catalog.mjs: gerador e validador determinístico.
- tests/catalog-phase2.test.mjs: regressão de dados, direitos, MIDI e prévia.

Fluxo de aprovação:

1. Um editor recebe o JSON exportado pelo importador e revisa as notas e os metadados.
2. Incorpora a obra e o arranjo em data/catalog.json, preservando IDs únicos.
3. Verifica os direitos da composição, edição e arranjo. Registra licença, fonte HTTPS ou documento comprobatório, conforme aplicável.
4. Somente após revisão, altera work.status e arrangement.status para published, marca work.rightsVerified = true e registra reviewedBy e reviewedAt nas duas entidades.
5. Para licença permission, é obrigatório registrar a evidência da autorização. Para CC-BY, é obrigatório registrar a atribuição.
6. Executa o comando node scripts/build-catalog.mjs e depois node --test tests/*.test.mjs.
7. Publica a alteração somente após a aprovação do revisor e dos testes.

O GitHub Actions executa também node scripts/build-catalog.mjs --check e rejeita divergência entre dados editoriais e catálogo gerado.

## Critérios de aceite

- Repertório inicial sem perda de IDs, favoritos, níveis e progresso.
- Músicas, exercícios e letras classificados corretamente.
- Filtros combináveis e compreensíveis em celular e tablet.
- Prévia local sem publicação acidental.
- Rejeição explícita de formatos musicais que ainda não sabemos avaliar.
- Inclusão editorial de novas músicas sem alterar páginas ou lógica central.
- Testes de CI aprovados e deploy confirmado separadamente.

## Limitações

Os novos arquivos importados não são distribuídos automaticamente para outros alunos. Não há painel administrativo autenticado nem biblioteca comercial licenciada. MIDI sozinho não comprova direitos autorais. A importação não suporta arquivos MP3, MXL, múltiplas vozes ou acordes simultâneos. Arranjos publicados para instrumentos de cordas ainda precisam de revisão de cordas e casas.

O progresso do aluno permanece local no navegador. A Fase 2 não muda a economia de XP, o modelo de contas ou a base de usuários.

## Referências

- MusicXML: https://www.w3.org/2021/06/musicxml40/tutorial/structure-of-musicxml-files/
- MusicXML, notas: https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/note/
- DOMParser: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
